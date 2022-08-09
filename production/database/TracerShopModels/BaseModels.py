from django.db.models import Model
from django.db import models

class SubscribeableModel(Model):
  #The main point about this class is allowing you go: model[fieldName] for reading data

  def __getitem__(self, name):
      #Yes this might be a bit too powerful and allow some very hacky shenanigance
      if name == "pk":
        return getattr(self, name)
      try:
        self._meta.get_field(name)
        return getattr(self, name)
      except models.FieldDoesNotExist:
        raise KeyError("This is not valid Field")

  def __setitem__(self, name, value):
    try:
      self._meta.get_field(name)
      setattr(self, name, value)
    except models.FieldDoesNotExist:
      raise KeyError("This is not valid Field")


  class Meta:
    abstract = True