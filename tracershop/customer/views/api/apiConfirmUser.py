from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError

import json
import traceback

from customer.lib import Formatting
from customer.lib.SQL import SQLController as SQL
from customer.models import PotentialUser, User, UserHasAccess, Customer
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

def GetUserID(request):
  JSONObject = Formatting.ParseJSONRequest(request)
  return int(JSONObject['PuserID'])

def CreateUserFromPotentialUser(potentialUser):
  NewUser = User(
    username=potentialUser.username,
    password=potentialUser.password,
    email_1=potentialUser.email_1,
    is_staff=True
  )

  NewUser.save()
  DeletePotentialUser(potentialUser)

  for CustomerInstance in Customer.objects.filter(defualtActiveCustomer=True):
    UserHasAccess(userID=NewUser, CustomerID=CustomerInstance).save()

def DeletePotentialUser(potentialUser):
  potentialUser.delete()

class ApiConfirmUser(AdminRequiredMixin, LoginRequiredMixin, View ):
  """

   Note: Yes there's alot of dub code, however the problem is that you can't really copy the try excepts, since the different functions return JSON responses.
  Otherwise you get some type based programming which is also ugly

  """
  name = "APIConfirmUser"
  path = "myadmin/api/ConfirmUser"


  def put(self, request):
    try:
      potentialUserID = GetUserID(request)
    except KeyError: 
      
      #Add Logging here
      return JsonResponse({"Success" : "No ID in request"})
    except ValueError:
      #TODO: ADD MORE LOGGING HERE
      return JsonResponse({"Success" : "Wrong Format of ID"})

    try:
      potentialUser = SQL.getSpecificObject(potentialUserID, PotentialUser)
    except ObjectDoesNotExist:
      #Ooh boy it's a forest with all these logs
      return JsonResponse({"Success": "Potential User could not be found"})

    CreateUserFromPotentialUser(potentialUser)

    return JsonResponse({"Success" : "Success"})

  def delete(self, request):
    try:
      potentialUserID = GetUserID(request)
    except KeyError: 
      
      #Add Logging here
      return JsonResponse({"Success" : "No ID in request"})
    except ValueError:
      #TODO: ADD MORE LOGGING HERE
      return JsonResponse({"Success" : "Wrong Format of ID"})

    try:
      potentialUser = SQL.getSpecificObject(potentialUserID, PotentialUser)
    except ObjectDoesNotExist:
      #Ooh boy it's a forest with all these logs
      return JsonResponse({"Success": "Potential User could not be found"})

    DeletePotentialUser(potentialUser)
    return JsonResponse({"Success" : "Success"})