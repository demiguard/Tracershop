# Python Standard Library

# Third party Packages
from django.test import RequestFactory, TransactionTestCase

# Tracershop Production
from database.models import User, UserGroups
from tracerauth.views import ExternalLoginView

class ExternalLoginTestCase(TransactionTestCase):
  def setUp(self) -> None:
    self.factory = RequestFactory()
    self.view = ExternalLoginView()
    self.AdminUser = User(username="Admin",

                          UserGroup=UserGroups.Admin)
    self.AdminUser.set_password("Admin_password")
    self.AdminUser.save()
    self.ShopExternalUser = User(username="ShopExternal",
                                 UserGroup=UserGroups.ShopExternal)
    self.ShopExternalUser.set_password("ShopExternal_password")
    self.ShopExternalUser.save()
    self.ShopInternalUser = User(username="ShopInternal",
                                 UserGroup=UserGroups.ShopUser)
    self.ShopInternalUser.set_password("ShopInternal_password")
    self.ShopInternalUser.save()

    self.ShopAdminUser = User(username="ShopAdmin",
                              UserGroup=UserGroups.ShopAdmin)
    self.ShopAdminUser.set_password("ShopAdmin_password")
    self.ShopAdminUser.save()
    self.ProductionAdmin = User(username="ProductionAdmin",
                                UserGroup=UserGroups.ProductionAdmin)
    self.ProductionAdmin.set_password("ProductionAdmin_password")
    self.ProductionAdmin.save()
    self.ProductionUser = User(username="ProductionUser",
                               UserGroup=UserGroups.ProductionUser)
    self.ProductionUser.set_password("ProductionUser_password")
    self.ProductionUser.save()

  def tearDown(self) -> None:
    self.AdminUser.delete()
    self.ShopExternalUser.delete()
    self.ShopInternalUser.delete()
    self.ShopAdminUser.delete()
    self.ProductionAdmin.delete()
    self.ProductionUser.delete()


  def test_empty(self):
    request = self.factory.get('/external')

    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_shop_external_success(self):
    request = self.factory.get('/external',
                               {'username' : "ShopExternal",
                                'password': "ShopExternal_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 200)

  def test_shop_external_failure(self):
    request = self.factory.get('/external',
                               {'username' : "ShopExternal",
                                'password': "not_ShopExternal_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_admin_rejected(self):
    request = self.factory.get('/external',
                               {'username' : "Admin",
                                'password': "Admin_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_shop_admin_rejected(self):
    request = self.factory.get('/external',
                               {'username' : "ShopAdmin",
                                'password': "ShopAdmin_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_production_admin_rejected(self):
    request = self.factory.get('/external',
                               {'username' : "ProductionAdmin",
                                'password': "ProductionAdmin_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_production_user_rejected(self):
    request = self.factory.get('/external',
                               {'username' : "ProductionUser",
                                'password': "ProductionUser_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)

  def test_shop_internal_rejected(self):
    request = self.factory.get('/external',
                               {'username' : "ShopInternal",
                                'password': "ShopInternal_password"})
    response = self.view.get(request)
    self.assertEqual(response.status_code, 403)