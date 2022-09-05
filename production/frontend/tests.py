from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, RequestFactory

from frontend.views import indexView

# Create your tests here.
class ViewTestCase(TestCase):
  def setUp(self) -> None:
    self.factory = RequestFactory()

  def test_indexView(self):
    request = self.factory.get("/")
    request.user = AnonymousUser()

    response = indexView(request)
    self.assertEqual(response.status_code, 200)
