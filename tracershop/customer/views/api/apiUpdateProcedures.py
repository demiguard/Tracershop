from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError

import json

from customer.models import Procedure, Tracer

class ApiUpdateProcedure(LoginRequiredMixin, View):
  path = "api/updateProcedure"
  name = "APIUpdateProcedure"


  def get(self, request):
    #TODO: Add error handling
    for key, _ in request.GET.items():
      procedures = json.loads(key)

    for key, data in procedures.items():
      if not(key):
        continue
      try:
        try:
          procedure = Procedure.objects.get(title=key)
          procedure.delay = data["delay"]
          procedure.baseDosis = data["dosis"]
          procedure.inUse = data["inUse"]
        except ObjectDoesNotExist:
          try:
            procedure = Procedure(title=key, delay=data["delay"], baseDosis=data['dosis'], inUse=True)
          except ValueError:
            return({"Success":"Failure"})
        try:
          procedure.tracer = Tracer.objects.get(ID=data["tracer"]) 
        except ObjectDoesNotExist as E:
          procedure.tracer = None
        procedure.save()
      except :
        return JsonResponse({"Success" : "Failure"})
      
    return JsonResponse({"Success" : "Success"})
  
  def put(self, request): 
    
    data = json.loads(request.readline().decode())

    try:
      newProcedure = Procedure(
        inUse=True, 
        title=data['title'],
        baseDosis=data['dosis'],
        delay=data['delay']) 
      newProcedure.save()
    except IntegrityError:
      return JsonResponse({"Success" : "Failure"})
    except ValueError:
      return JsonResponse({"Success" : "Failure"})

    return JsonResponse({"Success" : "Success"})
