"""Test cases for models"""

# Python Standard Library

# Third Party Packages
from django.test import TransactionTestCase, TestCase

# Tracershop Packages
from database.models import User, UserGroups, Vial, TracerTypes, Tracer,\
  Isotope, InjectionOrder, Days

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

class TracershopModels(TestCase):
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
    injection_dict = {
      "freed_by" : None,
      "freed_datetime" : "2024-11-30 10:00:00"
    }

    injection_order = InjectionOrder()

    injection_order.assignDict(injection_dict)

  def test_tracershop_model_set_get(self):
    tracer = Tracer()

    tracer['id'] = 1

    self.assertEqual(tracer['id'], 1)
    with self.assertRaises(KeyError):
      tracer['is_static_instance']

    with self.assertRaises(KeyError):
      tracer['is_static_instance'] = False
