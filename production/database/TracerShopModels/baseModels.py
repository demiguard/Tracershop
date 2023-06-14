# Python standard Library
from datetime import datetime, date, time
from typing import Any, Dict, List

# Third Party
from django.db.models import Model, IntegerChoices, ForeignKey, IntegerField,\
  TimeField, DateTimeField, DateField
from django.core.exceptions import FieldDoesNotExist

# Tracershop Modules
from lib.utils import classproperty


class TracershopModel(Model):
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

  @classproperty
  def exclude(cls) -> List[str]:
    return []

  class Meta:
    abstract = True

  def assignDict(self, modelDict: Dict[str, Any]):
    """Takes a Dict and updates the model with the values in the dict.
    Note that each key in the dict MUST be a field in the model.

    The Dict can miss keys.
    This function handles type conversion.

    This function does NOT save the model!

    Args:
      modelDict (Dict[str, Any]): The dict containing any amount of data
    """
    for key, value in modelDict.items():
      field = self._meta.get_field(key) # Fails if key doesn't match a field!
      if isinstance(field, ForeignKey):
        value = field.remote_field.model.objects.get(pk=value)
      # Note that Big and Small IntegerField superclass IntegerField, so we cool
      # There might be a bug here with Integer Choices.
      elif isinstance(field, IntegerField):
        value = int(value)
      elif isinstance(field, TimeField):
        dt = datetime.strptime(f"1970-01-01 {value}", "%Y-%m-%d %H:%M:%S")
        value = dt.time()
      elif isinstance(field, DateTimeField):
        value = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
      elif isinstance(field, DateField):
        value = datetime.strptime(value, "%Y-%m-%d").date()
      # End of assignment
      self.__setattr__(key, value)

  @classmethod
  def canDelete(cls, modelID, user = None) -> bool:
    """Checks if the user can delete a model"""
    return True



class Days(IntegerChoices):
  Monday = 0
  Thursday = 1
  Wednesday = 2
  Tuesday = 3
  Friday = 4
  Saturday = 5
  Sunday = 6

