from django.db.models import Model
from django.db import models
from django.core.exceptions import FieldDoesNotExist

class SubscribableModel(Model):
  #The main point about this class is allowing you go: model[fieldName] for reading data

  def __getitem__(self, name):
      try:
        self._meta.get_field(name)
        return getattr(self, name)
      except FieldDoesNotExist:
        raise KeyError("This is not valid Field")

  def __setitem__(self, name, value):
    try:
      self._meta.get_field(name)
      setattr(self, name, value)
    except FieldDoesNotExist:
      raise KeyError("This is not valid Field")

  class Meta:
    abstract = True
