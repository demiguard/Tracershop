from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from TracerAuth.models import User

from lib.SQL.SQLController import SQL

class TracershopAuthenticationBackend(BaseBackend):
  def authenticate(self, username:str, password:str) -> User:
    if username and password:
      try:
        user = User.objects.get(username=username)
      except User.DoesNotExist:
        return get_user_from_old_database(username, password)
      if check_password(password, user.password):
        return user
    return None

  def get_user_from_old_database(self, username, password):
    valid_old_user = self.SQL.authenticateUser(username, password)

    if valid_old_user:
      user = User(username=username)
      user.set_password(password)
      user.save()
      return user
    
    return None


  def __init__(self, SQL=SQL()):
    self.SQL=SQL

