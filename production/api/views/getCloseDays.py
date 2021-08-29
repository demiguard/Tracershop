from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse

from lib.SQL import SQLController
from lib import Formatting

class ApiClosedDays(View):
  name = "ClosedDays"
  path = "closeddays"


  def get(self, request):
    datesDict = SQLController.getClosedDays()

    return JsonResponse(datesDict)

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)

    SQLController.createCloseDay(data["year"], data["month"], data["day"])

    return HttpResponse(status=204)


  def delete(self, request):
    data = Formatting.ParseJSONRequest(request)

    SQLController.deleteCloseDay(data["year"], data["month"], data["day"])

    return HttpResponse(status=204)
  