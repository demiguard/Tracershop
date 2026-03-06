# Python standard library
from logging import getLogger
from pprint import pprint as pp
from typing import Any, List

# Third party modules
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError, CommandParser

# Tracershop modules
from database.models import User, UserGroups
from tracerauth import tracer_ldap

logger = getLogger('debug')

def get_local_user(regional_id):
  try:
    return User.objects.get(username=regional_id)
  except ObjectDoesNotExist:
    return User(username=regional_id)

def unique_filter[T](input_list: List[T]):
  """Note this filters out the items where Bool(item) = False"""
  output: List[T] = []
  for item in input_list:
    if item and item not in output:
      output.append(item)
  return output

class Command(BaseCommand):
  def handle(self, *args: Any, **options: Any) -> str | None:
    usernames = [user.username for user in User.objects.all()]
    bam_ids = [user.bam_id for user in User.objects.all()]

    all_ids = usernames + bam_ids
    unique_ids = unique_filter(all_ids)

    users_that_should_exist: List[User] = []
    users_to_be_deleted: List[User] = []

    for id_ in unique_ids:
      regional_id = tracer_ldap.get_regional_id(id_)
      if not regional_id:
        users_that_should_exist.append(get_local_user(id_))
        continue

      id_is_regional = id_ == regional_id

      if id_is_regional:
        user_that_should_exist = get_local_user(regional_id)
        users_that_should_exist.append(user_that_should_exist)
        result, user_group = tracer_ldap.checkUserGroupMembership(regional_id)
        if user_group is None:
          user_group = UserGroups.Anon

        user_that_should_exist.upgrade_user_group(user_group)


      else:
        try:
          users_to_be_deleted.append(User.objects.get(username=id_))
        except ObjectDoesNotExist:
          pass

        user_that_should_exist = get_local_user(regional_id)
        user_that_should_exist.bam_id = id_
        users_that_should_exist.append(user_that_should_exist)

        result, user_group = tracer_ldap.checkUserGroupMembership(regional_id)
        if user_group is None:
          user_group = UserGroups.Anon

        user_that_should_exist.upgrade_user_group(user_group)

    print(f"Updating: {len(users_that_should_exist)} users")
    for user in users_that_should_exist:
      user.bam_id = user.bam_id.upper()
      user.username = user.username.upper()

    for user in users_that_should_exist:
      user.save()

    print(f"Deleting: {len(users_to_be_deleted)} users")
    for user in users_to_be_deleted:
      user.delete()
