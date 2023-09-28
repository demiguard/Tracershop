# Python Standard Library

# Third Party packages
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import TestCase, RequestFactory

# Tracershop packages
from database.models import User, UserGroups
from frontend.views import indexView



# Create your tests here.
class ViewTestCase(TestCase):
  def setUp(self) -> None:
    self.factory = RequestFactory()
    


  @classmethod
  def setupTestData(cls) -> None:
    cls.user = User.objects.create(username='testuser', user_group=UserGroups.ShopUser)
    cls.user.set_password("password")

  def test_indexView(self):
    request = self.factory.get("/")
    request.user = AnonymousUser()

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
    request.session.save()