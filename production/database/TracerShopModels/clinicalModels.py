from django.db import models
from database.models import SubscribableModel
from database.TracerShopModels.authModels import Customer

class TracerTypes(models.IntegerChoices):
    injection = 1
    activity = 2

class Isotope(SubscribableModel):
  ID = models.AutoField(primary_key=True)
  atomName = models.CharField(max_length=30)
  halfTime = models.IntegerField(null=True)
  isotopeNumber = models.IntegerField(null=True) # Protons + neutrons
  symbol = models.CharField(max_length=5, null=True)

class Tracer(SubscribableModel):
  ID = models.AutoField(primary_key=True)
  name = models.CharField(max_length=30, unique=True, null=True)
  longName = models.CharField(max_length=60, null=True, default=None)
  inUse = models.BooleanField(default=False)
  isotope = models.ForeignKey(Isotope, on_delete=models.RESTRICT, null=True)
  tracerType = models.IntegerField(choices=TracerTypes.choices, default=TracerTypes.injection)

  def __str__(self):
    if self.name:
      return self.name
    else:
      return super().__str__()

class Procedure(SubscribableModel):
  ID        = models.AutoField(primary_key=True)
  title     = models.CharField(unique=True, max_length=128)
  baseDosis = models.IntegerField(null=True)
  delay     = models.IntegerField(default=0)
  inUse     = models.BooleanField(default=False)
  tracer    = models.ForeignKey(Tracer, on_delete=models.RESTRICT, null=True)

  def __str__(self):
    return self.title

  class Meta:
    verbose_name = "Procedure"
    verbose_name_plural = "Procedures"

class Location(SubscribableModel):
  roomCode   = models.CharField(max_length=16, primary_key=True)
  locName    = models.CharField(max_length=32, default="")
  AssignedTo = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, default=None)

  def __str__(self):
    if self.locName:
      return self.locName
    else:
      return self.roomCode

class Booking(SubscribableModel):
  procedure       = models.ForeignKey(Procedure, on_delete=models.RESTRICT)
  location        = models.ForeignKey(Location, on_delete=models.RESTRICT, null=True)
  accessionNumber = models.CharField(max_length=16, primary_key=True)
  startDate       = models.DateField()
  startTime       = models.TimeField()
  status          = models.IntegerField(default=0)
  orderNumber     = models.IntegerField(default=None, null=True)

  def __str__(self):
    return str(self.accessionNumber)
