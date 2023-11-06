"""This scripts imports an old tracershop database into new tracershop database"""

__author__ = "Christoffer Vilstrup Jensen"

if __name__ != '__main__':
  raise Exception("This is a script not a module!")


import datetime
import django
import os
from typing import Dict, List

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'production.settings')
django.setup()


from database.models import *

Vial.objects.all().delete()
LegacyActivityOrder.objects.all().delete()
ActivityOrder.objects.all().delete()
LegacyInjectionOrder.objects.all().delete()
InjectionOrder.objects.all().delete()
ActivityDeliveryTimeSlot.objects.all().delete()
LegacyProductionMember.objects.all().delete()
TracerCatalogPage.objects.all().delete()
DeliveryEndpoint.objects.all().delete()
Customer.objects.all().delete()
ActivityProduction.objects.all().delete()
Tracer.objects.all().delete()
Isotope.objects.all().delete()
