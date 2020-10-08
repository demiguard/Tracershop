from django.db import models
from django.db.models import Model

class Isotope(Model): 
  id = models.AutoField(primary_key=True)
  atomName = models.CharField(max_length=30)
  halfTime = models.IntegerField(null=True)
  isotopeNumber = models.IntegerField(null=True) # Protons + neutrons
  symbol = models.CharField(max_length=5, null=True)

class Tracer(Model):
  ID = models.AutoField(primary_key=True)
  tracerName = models.CharField(max_length=30, unique=True, null=True)
  inUse      = models.BooleanField(default=False)
  isotope = models.ForeignKey(Isotope, on_delete=models.SET_NULL, null=True)
  
  def __str__(self):
    if self.tracerName:
      return self.tracerName
    else:
      return f"This Tracer-{ID} have no name. Please fix"




class Procedure(Model):
  id        = models.AutoField(primary_key=True)
  title     = models.CharField(unique=True, max_length=128)
  baseDosis = models.IntegerField(null=True)
  delay     = models.IntegerField(default=0)
  inUse     = models.BooleanField(default=False)
  tracer    = models.ForeignKey(Tracer, on_delete=models.SET_NULL, null=True)

  def __str__(self):
    return self.title
