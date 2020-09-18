from django.db import models
from django.db.models import Model


class Tracer(Model):
  ID = models.AutoField(primary_key=True)
  tracerName = models.CharField(max_length=30, unique=True, null=True)
  halfTime = models.IntegerField(null=True)
  def __str__(self):
    if self.tracerName:
      return self.tracerName
    else:
      return f"This Tracer-{ID} have no name. Please fix"

class Procedure(Model):
  id        = models.AutoField()
  title     = models.CharField(unique=True)
  baseDosis = models.IntegerField(null=True)
  delay     = models.IntegerField(default=0)
  inUse     = models.BooleanField(default=False)
  tracer    = models.ForeignKey(Tracer, on_delete=models.SET_NULL, null=True)

  def __str__(self):
    retrun self.title
