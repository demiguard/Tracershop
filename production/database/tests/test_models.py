"""Test cases for models"""

# Python Standard Library
from datetime import date, time, datetime, timezone
from zoneinfo import ZoneInfo

# Third party packages
from django.test import TransactionTestCase, TestCase, SimpleTestCase

# Tracershop Packages
from constants import ERROR_LOGGER
from database.models import TracershopModel
from database.models import User, UserGroups, Vial, TracerTypes, Tracer,\
  Isotope, InjectionOrder, Days, Booking, SuccessfulLogin

class AuthModelTestCase(SimpleTestCase):
  def test_user_groups(self):
    admin_user = User(username="Admin", user_group=UserGroups.Admin)
    productionAdmin_user = User(username="ProductionAdmin", user_group=UserGroups.ProductionAdmin)
    productionUser_user = User(username="ProductionUser", user_group=UserGroups.ProductionUser)
    shopAdmin_user = User(username="ShopAdmin", user_group=UserGroups.ShopAdmin)
    shopUser_user = User(username="ShopUser", user_group=UserGroups.ShopUser)
    shopExternal_user = User(username="ShopExternal", user_group=UserGroups.ShopExternal)

    # Server side admin
    self.assertTrue(admin_user.is_production_admin)
    self.assertTrue(admin_user.is_production_member)
    self.assertTrue(admin_user.is_shop_admin)
    self.assertTrue(admin_user.is_shop_member)

    # Production Admin
    self.assertTrue(productionAdmin_user.is_production_admin)
    self.assertTrue(productionAdmin_user.is_production_member)
    self.assertFalse(productionAdmin_user.is_shop_admin)
    self.assertFalse(productionAdmin_user.is_shop_member)

    # Production User
    self.assertFalse(productionUser_user.is_production_admin)
    self.assertTrue(productionUser_user.is_production_member)
    self.assertFalse(productionUser_user.is_shop_admin)
    self.assertFalse(productionUser_user.is_shop_member)

    # Shop Admin
    self.assertFalse(shopAdmin_user.is_production_admin)
    self.assertFalse(shopAdmin_user.is_production_member)
    self.assertTrue(shopAdmin_user.is_shop_admin)
    self.assertTrue(shopAdmin_user.is_shop_member)

    # Shop User
    self.assertFalse(shopUser_user.is_production_admin)
    self.assertFalse(shopUser_user.is_production_member)
    self.assertFalse(shopUser_user.is_shop_admin)
    self.assertTrue(shopUser_user.is_shop_member)

    # Shop External
    self.assertFalse(shopExternal_user.is_production_admin)
    self.assertFalse(shopExternal_user.is_production_member)
    self.assertFalse(shopExternal_user.is_shop_admin)
    self.assertTrue(shopExternal_user.is_shop_member)

class CustomerModels(TestCase):
  def test_model_strings(self):
    isotope = Isotope.objects.create(
      id = 164879,
      atomic_number = 14,
      atomic_mass = 15,
      halflife_seconds = 1853701,
      atomic_letter = "A"
    )
    tracer = Tracer.objects.create(
      id = 1,
      shortname = "BOH",
      isotope=isotope,
      tracer_type = TracerTypes.ActivityBased,
      vial_tag="BOH"
    )

    tracer_2 = Tracer.objects.create(
      id = 2,
      shortname = "2BOH",
      isotope=isotope,
      tracer_type = TracerTypes.ActivityBased,
      vial_tag="2BOH"
    )

    vial_id = 1358776
    vial = Vial.objects.create(
      id = vial_id,
      tracer=tracer,
      activity = 6723.012,
      volume = 124,
      lot_number = "FDG-250105-1",
      fill_date = date(2025,1,5),
      fill_time = time(11,22,33)
    )

    self.assertEqual(str(vial), "Vial - BOH - A-15 - (Missing)")
    fvials = Vial.objects.filter(id__in=[vial_id])

    self.assertEqual(len(fvials), 1)
    fvials.update(tracer=tracer_2)

    self.assertEqual(str(fvials[0]),"Vial - 2BOH - A-15 - (Missing)")



class TracershopModelsTests(TestCase):
  def setUp(self) -> None:
    self.isotope = Isotope.objects.create(
      id=1,
      atomic_number=8,
      atomic_mass=18,
      halflife_seconds=2135.13,
      atomic_letter='f'
    )

  def test_assignment_tracer(self):
    tracer_dict = {
      'id' : 1,
      'shortname' : 'blah blah',
      'is_static_instance' : False,
      'isotope' : 1,
      'tracer_type' : TracerTypes.ActivityBased.value,
      'vial_tag' : "test_tag",
      'marketed' : "",
    }

    tracer = Tracer()

    tracer.assignDict(tracer_dict)

    self.assertEqual(tracer.id, 1)
    self.assertEqual(tracer.shortname, "blah blah")
    self.assertEqual(tracer.clinical_name, "")
    self.assertEqual(tracer.isotope, Isotope.objects.get(id=1))
    self.assertEqual(tracer.tracer_type, TracerTypes.ActivityBased)


  def test_injection_order_assignment(self):
    admin_user = User(username="Admin", user_group=UserGroups.Admin)

    injection_dict = {
      "freed_by" : None,
      "freed_datetime" : "2024-11-30 10:00:00"
    }

    injection_order = InjectionOrder(freed_by=admin_user)

    injection_order.assignDict(injection_dict)

    self.assertIsNone(injection_order.freed_by)
    self.assertEqual(injection_order.freed_datetime, datetime(
      2024,11,30,9,00,00, tzinfo=timezone.utc))

  def test_injection_weird_datetimes(self):
    injection_order = InjectionOrder()

    datetimes_strings = [
      "2024-11-30 10:00:00",
      "2024-11-30T10:00:00",
      "2024-11-30T10:00:00Z",
    ]

    for dt_string in datetimes_strings:
      injection_dict = {
        "freed_datetime" : dt_string # Normal
      }

      injection_order.assignDict(injection_dict)

    injection_order.assignDict({
      "freed_datetime" : "2024-11-30T11:00:00.123"
    })

    self.assertEqual(injection_order.freed_datetime, datetime(
        2024,11,30,10,00,00,123, tzinfo=timezone.utc)
    )


  def test_tracershop_model_set_get(self):
    tracer = Tracer()

    tracer['id'] = 1

    self.assertEqual(tracer['id'], 1)
    with self.assertRaises(KeyError):
      tracer['is_static_instance']

    with self.assertRaises(KeyError):
      tracer['is_static_instance'] = False

  def test_assigning_time_to_booking(self):
    booking = Booking()

    booking.assignDict({
      "start_time" : "11:00:00"
    })

    self.assertEqual(booking.start_time, time(11,00,00))

  def test_exception_gets_logged(self):
    booking = Booking()

    with self.assertLogs(ERROR_LOGGER) as captured_error_logs:
      with self.assertRaises(Exception):
        booking.assignDict({
          "start_time" : "99:00:00"
        })

  def test_base_class_get_display_name(self):
    self.assertEqual(Booking.display_name, "Booking")

    booking = Booking()

    self.assertEqual(booking.display_name, "Booking")

  def test_successful_login_string(self):
    user = User(username = "testuser")
    self.assertEqual(str(SuccessfulLogin(user=user, login_time=datetime(2000,1,1,0,0,0))),"testuser - 2000-01-01 00:00:00")

  def test_base_models_are_not_commitable(self):
    self.assertRaises(ValueError, TracershopModel.filter_args_for_committed_models)
    self.assertRaises(ValueError, TracershopModel.kwargs_for_uncommitting)