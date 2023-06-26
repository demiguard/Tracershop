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

[vial.delete() for vial in Vial.objects.all()]
[lca.delete() for lca in LegacyActivityOrder.objects.all()]
[ac.delete() for ac in ActivityOrder.objects.all()]
[lio.delete() for lio in LegacyInjectionOrder.objects.all()]
[injectionOrder.delete() for injectionOrder in InjectionOrder.objects.all()]
[activityDeliveryTimeSlot.delete() for activityDeliveryTimeSlot in ActivityDeliveryTimeSlot.objects.all()]
[legacyProductionMember.delete() for legacyProductionMember in LegacyProductionMember.objects.all()]
[tracerCatalog.delete() for tracerCatalog in TracerCatalog.objects.all()]
[deliveryEndpoint.delete() for deliveryEndpoint in DeliveryEndpoint.objects.all() ]
[customer.delete() for customer in Customer.objects.all()]
[activityProduction.delete() for activityProduction in ActivityProduction.objects.all()]
[tracer.delete() for tracer in Tracer.objects.all()]
[isotope.delete() for isotope in Isotope.objects.all()]