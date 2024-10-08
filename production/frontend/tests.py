# Python Standard Library
from datetime import date, time, timezone, datetime
from logging import DEBUG
from pathlib import Path
from unittest.mock import MagicMock, patch, Mock

# Third Party packages
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import TestCase, RequestFactory

# Tracershop packages
from constants import DEBUG_LOGGER, ERROR_LOGGER
from shared_constants import URL_ACTIVITY_PDF_BASE_PATH, URL_INJECTION_PDF_BASE_PATH
from database.models import User, UserGroups, UserAssignment, Customer,\
    DeliveryEndpoint, TracerTypes, Tracer, Isotope, ActivityOrder,\
    InjectionOrder, Days, ActivityProduction, ActivityDeliveryTimeSlot,\
    WeeklyRepeat, OrderStatus, TracerUsage, Vial
from frontend.views import indexView, pdfView, pdfInjectionView


mock_guess_customer_group = Mock(return_value=("Street",[UserAssignment()]))
mock_guess_customer_group_fail = Mock(return_value=("Not_Street",[]))
mock_guess_customer_group_boom = Mock(return_value=("Street",[]), side_effect=Exception)

# Create your tests here.
class ViewTestCase(TestCase):
  def setUp(self) -> None:
    self.factory = RequestFactory()

  @classmethod
  def setUpTestData(cls) -> None:
    cls.user = User.objects.create(username='testuser', user_group=UserGroups.ProductionAdmin)
    cls.shop_user = User.objects.create(username='shop_user', user_group=UserGroups.ShopUser)
    cls.new_shop_user = User.objects.create(username='new_shop_user', user_group=UserGroups.ShopUser)
    cls.customer = Customer.objects.create(short_name="customer", billing_address="Street")
    cls.us = UserAssignment.objects.create(user=cls.shop_user, customer=cls.customer)

  def test_indexView(self):
    request = self.factory.get("/")
    request.user = AnonymousUser()
    with self.assertLogs(DEBUG_LOGGER, DEBUG):
      response = indexView(request)
    self.assertEqual(response.status_code, 200)

  def test_index_with_user_info(self):
    request = self.factory.get("/")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    request.META['HTTP_X_TRACER_USER'] = 'testuser'
    request.META['HTTP_X_TRACER_ROLE'] = 2
    request.user = AnonymousUser()

    response = indexView(request)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(request.user, User.objects.get(username="testuser"))

  @patch('frontend.views.guess_customer_group', mock_guess_customer_group)
  def test_index_shop_user_with_assignment(self):
    request = self.factory.get("/")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    request.META['HTTP_X_TRACER_USER'] = 'shop_user'
    request.META['HTTP_X_TRACER_ROLE'] = 5
    request.user = AnonymousUser()

    response = indexView(request)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(request.user, User.objects.get(username="shop_user"))
    mock_guess_customer_group.assert_not_called()

  @patch('frontend.views.guess_customer_group', mock_guess_customer_group)
  def test_index_shop_user_without_assignment_success(self):
    request = self.factory.get("/")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    request.META['HTTP_X_TRACER_USER'] = 'new_shop_user'
    request.META['HTTP_X_TRACER_ROLE'] = 5
    request.user = AnonymousUser()

    response = indexView(request)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(request.user,
                     User.objects.get(username="new_shop_user"))
    mock_guess_customer_group.assert_called_once()

  @patch('frontend.views.guess_customer_group', mock_guess_customer_group_boom)
  def test_index_shop_user_without_assignment_boom(self):
    request = self.factory.get("/")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    request.META['HTTP_X_TRACER_USER'] = 'new_shop_user'
    request.META['HTTP_X_TRACER_ROLE'] = 5
    request.user = AnonymousUser()
    with self.assertLogs(ERROR_LOGGER) as log_records:
      response = indexView(request)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(request.user,
                     User.objects.get(username="new_shop_user"))

  @patch('frontend.views.guess_customer_group', mock_guess_customer_group_fail)
  def test_index_shop_user_without_assignment_fail(self):
    request = self.factory.get("/")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    request.META['HTTP_X_TRACER_USER'] = 'new_shop_user'
    request.META['HTTP_X_TRACER_ROLE'] = 5
    request.user = AnonymousUser()
    with self.assertLogs(DEBUG_LOGGER) as log_records:
      response = indexView(request)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(request.user,
                     User.objects.get(username="new_shop_user"))

class PDFViewingTestCase(TestCase):
  def setUp(self) -> None:
    self.factory = RequestFactory()

  @classmethod
  def setUpTestData(cls):
    cls.taylor = User.objects.create(username="TaylorTheSlow", user_group=UserGroups.ShopUser)
    cls.mr_gaga = User.objects.create(username="Mr gaga",      user_group=UserGroups.Admin)
    cls.prof_dre = User.objects.create(username="Prof Dre",    user_group=UserGroups.ProductionAdmin)
    cls.scoop_cat = User.objects.create(username="Scoop cat",  user_group=UserGroups.ProductionUser)
    cls.frank = Customer.objects.create(short_name="FrankTheCustomer")
    cls.franks_backyard = DeliveryEndpoint.objects.create(name="franks backyard", owner=cls.frank)
    cls.the_secret = Isotope.objects.create(atomic_letter="U", atomic_mass=235, atomic_number=92, halflife_seconds=57122)
    cls.the_secret_sauce=Tracer.objects.create(shortname="secret sauce",
                                                isotope=cls.the_secret,
                                                clinical_name="Boom stick fuel",
                                                tracer_type=TracerTypes.ActivityBased,
                                                vial_tag="FUN")
    cls.the_sauce_production=ActivityProduction.objects.create(
      production_day=Days.Monday,
      tracer=cls.the_secret_sauce,
      production_time=time(0,1,0),
    )
    cls.the_sauce_delivery=ActivityDeliveryTimeSlot.objects.create(
      weekly_repeat=WeeklyRepeat.EveryWeek,
      delivery_time=time(10,00,00),
      destination=cls.franks_backyard,
      production_run=cls.the_sauce_production,
    )
    cls.the_injection_sauce = InjectionOrder.objects.create(
      id=51132,
      delivery_time=time(12,40,55),
      delivery_date=date(2012,1,12),
      injections=1,
      status=OrderStatus.Released,
      tracer_usage=TracerUsage.human,
      comment=None,
      ordered_by=cls.taylor,
      endpoint=cls.franks_backyard,
      tracer=cls.the_secret_sauce,
      lot_number="FUN-120112-1",
      freed_datetime=datetime(2012,1,12,12,53,1, tzinfo=timezone.utc),
      freed_by=cls.scoop_cat,
    )
    cls.the_activity_sauce = ActivityOrder.objects.create(
      id=4828121,
      ordered_activity=682135,
      delivery_date=date(2012,1,2),
      status=OrderStatus.Released,
      comment=None,
      ordered_time_slot=cls.the_sauce_delivery,
      moved_to_time_slot = None,
      freed_datetime=datetime(2012,1,2,11,22,44, tzinfo=timezone.utc),
      ordered_by=cls.taylor,
      freed_by=cls.scoop_cat
    )
    cls.the_sauce_container = Vial.objects.create(
      id=5172054,
      tracer=cls.the_secret_sauce,
      activity=501531,
      volume=12.531,
      lot_number="FUN-120105-1",
      fill_time=time(11,44,55),
      fill_date=date(2012,1,2),
      assigned_to=cls.the_activity_sauce,
      owner=cls.frank,
    )

  def test_draw_activity(self):
    request = self.factory.get(f"/{URL_ACTIVITY_PDF_BASE_PATH}")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    response = pdfView(request,
                       self.the_sauce_delivery.id,
                       2012, 1, 2)
    self.assertEqual(response.status_code, 200)

  def test_draw_activity_invalid_date(self):
    request = self.factory.get(f"/{URL_ACTIVITY_PDF_BASE_PATH}")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    response = pdfView(request, self.the_sauce_delivery.id, 2012, 99, 2)
    self.assertEqual(response.status_code, 404)

  def test_draw_injection(self):
    request = self.factory.get(f"/{URL_ACTIVITY_PDF_BASE_PATH}")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)
    p = Path('frontend/static/frontend/pdfs/injection_orders/injection_order_51132.pdf')
    if p.exists():
      p.unlink()
    response = pdfInjectionView(request, 51132)
    self.assertEqual(response.status_code, 200)

  def test_draw_injection_404(self):
    request = self.factory.get(f"/{URL_ACTIVITY_PDF_BASE_PATH}")
    middleware = SessionMiddleware(request)
    middleware.process_request(request)

    response = pdfInjectionView(request, 51133)

    self.assertEqual(response.status_code, 404)
