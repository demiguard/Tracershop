from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist

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
      try:
        procedure = Procedure.objects.get(title=key)
        procedure.delay = data["delay"]
        procedure.baseDosis = data["dosis"]
        procedure.inUse = data["inUse"]
        try:
          procedure.tracer = Tracer.objects.get(ID=data["tracer"]) 
        except Exception as E:
          procedure.tracer = None
        procedure.save()
      except :
        return JsonResponse({"Success" : "Failure"})
      
    return JsonResponse({"Success" : "Success"})
