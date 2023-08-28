"""This module is for audit logging. You should use this module rather an a
direct call to the audit logger."""

# Python Standard library
from abc import ABC, abstractmethod
import logging
from typing import List, Optional, Tuple

# Third party packages

# Tracershop modules
from database import models
from tracerauth.types import AuthActions

logger = logging.getLogger('audit')

def _get_max_length(tuples: List[Tuple])-> Tuple:
  init_tuple = tuples[0]
  max_lengths = [0] * len(init_tuple)

  for a_tuple in tuples:
    for i,string in enumerate(a_tuple):
      max_lengths[i] = max(max_lengths[i], len(string))

  return tuple(max_len for max_len in max_lengths)


class AuditLogEntry(ABC):
  @classmethod
  @abstractmethod
  def _get_accept_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    raise NotImplementedError("Derived must overwrite")

  @classmethod
  @abstractmethod
  def _get_reject_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    raise NotImplementedError("Derived must overwrite")

  @classmethod
  def log(cls, user: Optional['models.User'], model: 'models.TracershopModel', action : AuthActions):
    if action.should_log:
      if action == AuthActions.ACCEPT_LOG:
        message = cls._get_accept_message(user, model)
      else:
        message = cls._get_reject_message(user, model)
      logger.info(message)


class CreateModelAuditEntry(AuditLogEntry):
  @classmethod
  def _get_accept_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    log_fields = []
    for field in model._meta.get_fields(include_parents=True):
      if field.name in model.exclude:
        # Don't log sensitive information!
        continue
      log_fields.append((field.name, str(getattr(model, field.name))))

    max_field_name_length, max_new_value_length = _get_max_length(log_fields)

    messages_lines = []
    if user is not None:
      messages_lines.append(f"User: {user.username} is creating a instance of {model.__class__.__name__}")
    else:
      messages_lines.append(f"System is creating an instance of {model.__class__.__name__}")

    for field_name, new_value in log_fields:
      messages_lines.append(f"{field_name:{max_field_name_length}}: {new_value:{max_new_value_length}}")

    return "\n".join(messages_lines)

  @classmethod
  def _get_reject_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    if user is None:
      return f"The System attempted to create an instance of {model.__class__.__name__} but was denied permission."

    return f"User: {user.username} attempted create an instance of {model.__class__.__name__} but was denied permission."


class DeleteModelAuditEntry(AuditLogEntry):
  @classmethod
  def _get_accept_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    log_fields = []
    for field in model._meta.get_fields(include_parents=True):
      if field.name in model.exclude:
        # Don't log sensitive information!
        continue
      log_fields.append((field.name, str(getattr(model, field.name))))

    max_field_name_length, max_original_value_length = _get_max_length(
      log_fields)

    messages_lines = []
    if user is not None:
      messages_lines.append(f"User: {user.username} is deleting an instance of {model.__class__.__name__}")
    else:
      messages_lines.append(f"System is delete an instance of {model.__class__.__name__}")

    for field_name, original_value in log_fields:
      messages_lines.append(f"{field_name:{max_field_name_length}}: {original_value:{max_original_value_length}}")

    return "\n".join(messages_lines)

  @classmethod
  def _get_reject_message(cls, user: Optional['models.User'], model: 'models.TracershopModel') -> str:
    if user is None:
      return f"The System attempted to delete an instance of {model.__class__.__name__} with id {model.pk} but was denied permission."

    return f"User: {user.username} attempted to delete an instance of {model.__class__.__name__} with id {model.pk} but was denied permission."


class EditModelAuditEntry(AuditLogEntry):
  @classmethod
  def _get_accept_message(cls, user: Optional['models.User'],
                           model: 'models.TracershopModel') -> str:
    database_copy = model.__class__.objects.get(pk=model.pk)
    log_fields = []

    for field in model._meta.get_fields(include_parents=True):
      if field.name in model.exclude:
        # Don't log sensitive information!
        continue

      original_value = getattr(database_copy, field.name)
      new_value = getattr(model, field.name)

      if original_value == new_value:
        continue # There no edit, and therefore shouldn't be logged

      log_fields.append((field.name, str(original_value), str(new_value)))

    max_field_name_length, max_original_value_length,\
      max_new_value_length = _get_max_length(log_fields)

    messages_lines = []
    if user is not None:
      messages_lines.append(f"User: {user.username} is editing an instance of {model.__class__.__name__}")
    else:
      messages_lines.append(f"System is editing an instance of {model.__class__.__name__}")
    for field_name, original_value, new_value in log_fields:
      messages_lines.append(f"{field_name:{max_field_name_length}}: {original_value:{max_original_value_length}} --> {new_value:{max_new_value_length}}")

    return "\n".join(messages_lines)

  @classmethod
  def _get_reject_message(cls, user: Optional['models.User'],
                          model: 'models.TracershopModel') -> str:
    if user is None:
      return f"The System attempted to edit the instance of {model.__class__.__name__} with id {model.pk} but was denied permission."

    return f"User: {user.username} attempted to edit an instance of {model.__class__.__name__}  with id {model.pk} but was denied permission."

