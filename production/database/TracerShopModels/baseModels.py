# Python standard Library
from logging import getLogger
from datetime import datetime, date, time
from typing import Any, Dict, List, Optional

# Third Party
from django.db.models import Model, IntegerChoices, ForeignKey, IntegerField,\
  TimeField, DateTimeField, DateField
from django.core.exceptions import FieldDoesNotExist, ObjectDoesNotExist

# Tracershop Modules
from constants import ERROR_LOGGER
from database.TracerShopModels import authModels
from tracerauth.audit_logging import CreateModelAuditEntry, DeleteModelAuditEntry, EditModelAuditEntry
from tracerauth.types import AuthActions
from lib.utils import classproperty

error_logger = getLogger(ERROR_LOGGER)

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

  def canEdit(self, user: Optional['authModels.User'] = None) -> AuthActions:
    return AuthActions.ACCEPT

  def canCreate(self, user: Optional['authModels.User'] = None) -> AuthActions:
    return AuthActions.ACCEPT

  def canDelete(self, user: Optional['authModels.User'] = None) -> AuthActions:
    return AuthActions.ACCEPT

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
    try:
      for key, value in modelDict.items():
        field = self._meta.get_field(key) # Fails if key doesn't match a field!
        if value is None:
          self.__setattr__(key, value)
        elif isinstance(field, ForeignKey):
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
          value = value[:10]
          value = datetime.strptime(value, "%Y-%m-%d").date()
        # End of assignment
        self.__setattr__(key, value)
    except Exception as e:
      error_logger.error(f"Caught an error in assigning {key} - {field} to {value}")

      raise e

  def save(self, user: Optional['authModels.User'] = None, *args, **kwargs) -> bool:
    # Something important to note is that if you have query set and that updates
    # Then .save is not called, in other words it's possible to change the
    # database without logging.
    # Now this is a know problem and at some point in time, i'm gonna look for
    # the solution
    # https://stackoverflow.com/questions/30449960/django-save-vs-update-to-update-the-database
    if self.pk is not None and self.pk <= 0:
      self.pk = None
      creating = True
    else:
      creating = not self.__class__.objects.filter(pk=self.pk).exists()

    if creating:
      action = self.canCreate(user)
      CreateModelAuditEntry.log(user, self, action)
    else:
      print(f"Editing {self.__class__.__name__} with id: {self.pk}")
      action = self.canEdit(user)
      EditModelAuditEntry.log(user, self, action)

    if action.should_act:
      super().save(*args, **kwargs)
      return True
    return False

  def delete(self, user: Optional['authModels.User'] = None, *args, **kwargs):
    action = self.canDelete(user)
    DeleteModelAuditEntry.log(user, self, action)

    if action.should_act:
      super().delete(*args, **kwargs)
      return True
    return False


class Days(IntegerChoices):
  """Enum describing the days. Note these overlap with datetime module,
  so they can't be changed without break a fuck ton of code.
  """
  Monday = 0
  Thursday = 1
  Wednesday = 2
  Tuesday = 3
  Friday = 4
  Saturday = 5
  Sunday = 6

