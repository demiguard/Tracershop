from django.db import models
from database.models import SubscribeableModel

class TracerTypes(models.IntegerChoices):
    injection = 1
    activity = 2


class Isotope(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  atomName = models.CharField(max_length=30)
  halfTime = models.IntegerField(null=True)
  isotopeNumber = models.IntegerField(null=True) # Protons + neutrons
  symbol = models.CharField(max_length=5, null=True)

class Tracer(SubscribeableModel):
  ID = models.AutoField(primary_key=True)
  name = models.CharField(max_length=30, unique=True, null=True)
  longName = models.CharField(max_length=60, null=True, default=None)
  inUse = models.BooleanField(default=False)
  isotope = models.ForeignKey(Isotope, on_delete=models.SET_NULL, null=True)
  tracerType = models.IntegerField(choices=TracerTypes.choices, default=TracerTypes.injection)

  def __str__(self):
    if self.name:
      return self.name
    else:
      return f"This Tracer-{self.ID} have no name. Please fix"

class Procedure(SubscribeableModel):
  ID        = models.AutoField(primary_key=True)
  title     = models.CharField(unique=True, max_length=128)
  baseDosis = models.IntegerField(null=True)
  delay     = models.IntegerField(default=0)
  inUse     = models.BooleanField(default=False)
  tracer    = models.ForeignKey(Tracer, on_delete=models.SET_NULL, null=True)

  def __str__(self):
    return self.title

  class Meta:
    verbose_name = "Procedure"
    verbose_name_plural = "Procedures"
