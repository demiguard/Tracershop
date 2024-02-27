"""Test cases for models"""

# Python Standard Library

# Third Party Packages
from django.test import TransactionTestCase

# Tracershop Packages
from database.models import User, UserGroups, Vial

class AuthModelTestCase(TransactionTestCase):
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

class CustomerModels(TransactionTestCase):
  def test_model_strings(self):
    vial = Vial()



    