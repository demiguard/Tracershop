from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.hashers import check_password
from database.models import User

from lib.SQL.SQLController import SQL

class TracershopAuthenticationBackend(BaseBackend):
  def authenticate(self,request, username=None, password=None) -> User:
    if username and password:
      try:
        user = User.objects.get(username=username)
      except User.DoesNotExist:
        return self.get_user_from_old_database(username, password)
      if check_password(password, user.password):
        return user
    return None

  def get_user_from_old_database(self, username, password):
    valid_old_user = self.SQL.authenticateUser(username, password)
    if valid_old_user:
      user = User(username=username, OldTracerBaseID=valid_old_user.OldTracerBaseID)
      user.set_password(password)
      user.save()
      return user
    return None

  def get_user(self, user_id):
    try:
      return User.objects.get(id=user_id)
    except User.DoesNotExist:
      return None

  def __init__(self, SQL=SQL()):
    self.SQL=SQL
    super().__init__()

