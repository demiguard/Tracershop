from django.db.models import Model, IntegerChoices
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


class Days(IntegerChoices):
  Monday = 0
  Thursday = 1
  Wednesday = 2
  Tuesday = 3
  Friday = 4
  Saturday = 5
  Sunday = 6

