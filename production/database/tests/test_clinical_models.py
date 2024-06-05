"""Tests for database/TracershopModels/clinicalModels.py"""

# Python Standard Library
from datetime import date, time

# Third Party Packages
from django.test import SimpleTestCase

# Tracershop modules
from database.models import Days
from database.TracerShopModels.authModels import User, UserGroups
from database.TracerShopModels.clinicalModels import Isotope, TracerTypes, Tracer, ActivityProduction, ReleaseRight
from tracerauth.types import AuthActions

class SimpleClinicalModelTests(SimpleTestCase):
  def test_strings(self):
    i1 = Isotope(atomic_letter="F", atomic_mass=18)
    i2 = Isotope(atomic_letter="Tc", atomic_mass=99, metastable=True)

    self.assertEqual(str(i1), 'F-18')
    self.assertEqual(str(i2), 'Tc-99m')
    t1 = Tracer(isotope=i1, shortname="FDG")
    self.assertEqual(str(t1), 'FDG - F-18')

    self.assertEqual(str(ActivityProduction(
      production_day=Days.Monday,
      tracer=t1,
      production_time=time(10,00,00),
    )), "Production of FDG - Monday - 10:00:00")

    self.assertEqual(
      str(ReleaseRight(
        expiry_date=None,
        releaser=User(username="releaser"),
        product=t1
      )),"ReleaseRight for releaser - FDG - F-18"
    )
    self.assertEqual(
      str(ReleaseRight(
        expiry_date=date(2020,1,1),
        releaser=User(username="releaser"),
        product=t1
      )),"ReleaseRight for releaser - FDG - F-18 expiring: 2020-01-01"
    )

  def test_ReleaseRight_actions(self):
    u = User(id=123, username="releaser", user_group=UserGroups.ProductionAdmin)

    release_right = ReleaseRight(
        expiry_date=date(2020,1,1),
        releaser=u,
        product=Tracer(isotope=Isotope(atomic_letter="F", atomic_mass=18),
                       shortname="FDG")
      )
    # Create actions
    self.assertEqual(release_right.canCreate(), AuthActions.REJECT)
    self.assertEqual(release_right.canCreate(User(user_group=UserGroups.ProductionUser)), AuthActions.REJECT_LOG)
    self.assertEqual(release_right.canCreate(u), AuthActions.REJECT_LOG)
    self.assertEqual(release_right.canCreate(User(user_group=UserGroups.ProductionAdmin)), AuthActions.ACCEPT_LOG)
    self.assertEqual(release_right.canCreate(User(user_group=UserGroups.Admin)), AuthActions.ACCEPT_LOG)
    # Edit actions
    self.assertEqual(release_right.canEdit(), AuthActions.REJECT)
    self.assertEqual(release_right.canEdit(User(user_group=UserGroups.ProductionUser)), AuthActions.REJECT_LOG)
    self.assertEqual(release_right.canEdit(u), AuthActions.REJECT_LOG)
    self.assertEqual(release_right.canEdit(User(user_group=UserGroups.ProductionAdmin)), AuthActions.ACCEPT_LOG)
    self.assertEqual(release_right.canEdit(User(user_group=UserGroups.Admin)), AuthActions.ACCEPT_LOG)
    # Delete actions
    self.assertEqual(release_right.canDelete(), AuthActions.REJECT)
    self.assertEqual(release_right.canDelete(User(user_group=UserGroups.ProductionUser)), AuthActions.REJECT_LOG)
    self.assertEqual(release_right.canDelete(u), AuthActions.ACCEPT_LOG)
    self.assertEqual(release_right.canDelete(User(user_group=UserGroups.ProductionAdmin)), AuthActions.ACCEPT_LOG)
    self.assertEqual(release_right.canDelete(User(user_group=UserGroups.Admin)), AuthActions.ACCEPT_LOG)
