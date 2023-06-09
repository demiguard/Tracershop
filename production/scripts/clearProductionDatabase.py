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

[tracer.delete() for tracer in Tracer.objects.all()]
[isotope.delete() for isotope in Isotope.objects.all()]
