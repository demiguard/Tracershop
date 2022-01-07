from django.views.generic import View
from django.http import HttpResponseBadRequest, HttpResponse

from api.models import Database

from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController
from lib.utils import LMAP
from lib.Formatting import ParseJSONRequest

from constants import JSON_ACTIVE_DATABASE, JSON_DATABASE, JSON_FIELD_TO_UPDATE



class APIServerConfig(View):
  name = "ServerConfig"
  path = "ServerConfig"

  def get(self, request):
    config = SQLController.getServerConfig()
    databases = SQLController.getDatabases()

    return ProductionJSONResponse({
      JSON_ACTIVE_DATABASE : config.ExternalDatabase ,
      JSON_DATABASE : databases
    })

  def put(self, request):
    data = ParseJSONRequest(request)
    config = SQLController.getServerConfig()
    if data[JSON_FIELD_TO_UPDATE] == JSON_ACTIVE_DATABASE:
      try:
        newDatabase = Database.objects.get(databaseName=data[JSON_DATABASE])
      except Database.DoesNotExist:
        return HttpResponse(status=404)
      config.ExternalDatabase = newDatabase
      config.save()

    return HttpResponse(status=204)