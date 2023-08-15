# Python Standard Library
import re
from typing import Optional

# Third party packages
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password

# Tracershop Production Packages
from database.models import User


def validString(string: str) -> bool:
  """Checks if a string contains any funny Characters

  Args:
      string (str): String to be checked

  Returns:
      bool: Indicates if the string is valid or not, so if False, somebody might try and do some funny stuff
  """
  regex = re.compile(r"^[A-z0-9æøåÆØÅ]+$")

  if regex.match(string): # This returns a match object and we just truthy of that object
    return True
  return False

class TracershopAuthenticationBackend(BaseBackend):
  def authenticate(self, request, username=None, password=None) -> Optional[User]:
    if username and password:
      try:
        user = User.objects.get(username=username)
      except User.DoesNotExist:
        return None
      if check_password(password, user.password):
        return user
    return None

  def get_user(self, user_id):
    try:
      return User.objects.get(id=user_id)
    except User.DoesNotExist:
      return None

