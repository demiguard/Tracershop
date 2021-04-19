### Yes, I'm Aware of https://www.django-rest-framework.org/ 
### No i don't think i write better software, i'm just lazy.
### You can change that for this. The only difference is that the formatting of the json objects are different.
### Note that I'm in general not a super fan of other peoples software, as the Documentation can be short / inprecise.
### Because very often I want my code to do some VERY specific things, and that might either require some serious hacks of module, that is availble or
### I can't figure out how to use module correctly.

### All of that said, this is a REST framework
### This implies you can send a GET/POST/PUT/DELETE request to the api /api/REST/<modelname> 
### GET: get a specific table / entry in the table
### POST: create a new element in the table / Requires admin Rights
### PUT: update an existsing element / Requires admin rights
### DELETE: Remove an instance / Requires Admin rights
### Note with authenticaiton is that you can make that model specific if you need to
### Unhelpful remark: THis customization ability is why i love writting code self.
### Helpful remark: This API only allows access to the internal django database and does not allow access into the main Tracershop database

from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.exceptions     import PermissionDenied
from django.http                import JsonResponse, HttpResponseBadRequest, Http404, QueryDict
from django.shortcuts           import render
from django.views.generic       import View

from datetime import datetime, date

from customer import models
from customer import constants
from customer.lib import Serializer
from customer.lib.Formatting import ParseJSONRequest
from customer.lib.SQL import SQLController as SQL
from customer.models import Location

json = "json"

#This dir maps models to strings
modelHashMap = {
  "Address"             : models.Address,
  "AET"                 : models.AET,
  "Booking"             : models.Booking,
  "Customer"            : models.Customer,
  "Database"            : models.Database,
  "Location"            : models.Location,
  "Isotope"             : models.Isotope,
  "Procedure"           : models.Procedure,
  "Tracer"              : models.Tracer,
  "ServerConfiguration" : models.ServerConfiguration
} 

def FilterModels(model, Filter):
  result = []

  obejcts = model.obejcts.all()
  for instance in obejcts:
    PassedFilter = True
    for key, value in Filter.items():
      if instance[key] != value:
        PassedFilter = False
        break
    if PassedFilter:
      result.append(instance)

  return result

def getactiveModels(modelName):  
  activeModel = modelHashMap.get(model)
  if not activeModel:
    raise Http404("Model does not exists")
  return activeModel

class RESTAPI(View):
  #Note this entire REST is included in 
  name = 'RESTAPI'
  path = 'api/REST/<str:model>'

  def get(self, request, model):
    # Verfication / authentication
    # None even anon-user can send a REST Query to get
    # get a list of all the models or a specific model if data is included in a JSON response
    try:
      activeModel = getactiveModels(model)
    except Http404 as err:
      if modelname == "Models":
        return JsonResponse({"models" : list(modelHashMap.keys())})  
      else: 
        raise err

    requestData = ParseJSONRequest(request)
    if len(requestData.keys()) == 0:
      #See note on serializers in Serializer 
      serializeAllModels = Serializer.SerializeAll(activemodel) 
      return JsonResponse(SerializeAllModels)
    else:
      Instances = activeModel.obejcts.all()
      FilteredInstances = FilterModels(Instances, requestData)
      return JsonResponse(Serializer.SerializeInstaced(FilteredInstances))

    
def post(self, request, model):
  if not request.user.is_admin:
    raise PermissionDenied

  activeModel = getactiveModels(model)
  requestData = ParseJSONRequest(request)
  instance = Serializer.Deserialize(activeModel, requestData)
  instance.save()

def put(self, request, model):
  #Verfication / Authentication
  if not request.user.is_admin:
    raise PermissionDenied

  activeModel = getactiveModels(model)
  requestData = ParseJSONRequest(request)
  instances = FilterModels(activeModel, requestData)
  if len(instances) == 0:
    raise Http404("Model not found")
  elif len(instances) > 1:
    raise HttpResponseBadRequest
  else:
    instance = instances[0]
    instance = Serializer.DeserializeInstance(instance, data) #This is the same object but for the sake your sanity there's an assignment
    instance.save()

def delete(self, request, model):
  raise NotImplemented

