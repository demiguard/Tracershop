# Python Standard Library
import re
from typing import Optional

# Third party packages
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password

# Tracershop Production Packages

from database.models import User, UserGroups
from tracerauth.tracer_ldap import authenticate_user, checkUserGroupMembership, get_regional_id


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
  def authenticate(self, request, username=None, password=None, **kwargs) -> Optional[User]:
    if username and password:
      if isinstance(username, str):
        username = username.upper()
      if settings.USE_LDAP and authenticate_user(username, password):
        try: # First check if we have the user already
          return User.objects.get(username=username)
        except ObjectDoesNotExist:
          pass

        # Note that we would have created the user on /index.html with username
        # equal to the regional id. Note that if they are different then we can
        # go from bam id to regional id but not the other way around.

        try: # Second check if we have the user stored as bam id
          return User.objects.get(bam_id=username)
        except ObjectDoesNotExist:
          pass

        regional_id = get_regional_id(username)
        success, user_group = checkUserGroupMembership(username)

        if user_group is None:
          user_group = UserGroups.Anon

        # Okay We don't have the user, lets log them in.
        user = User.objects.create(
          username=regional_id,
          bam_id=username,
          user_group=user_group
        )

        return user

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
