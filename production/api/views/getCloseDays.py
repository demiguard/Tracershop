from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse

from lib.SQL import SQLController
from lib import Formatting

from datetime import date

class APIClosedDays(View):
  name = "ClosedDays"
  path = "closeddays"


  def get(self, request):
    datesDict = SQLController.getClosedDays()

    return JsonResponse(datesDict)

  def post(self, request):
    data = Formatting.ParseJSONRequest(request)
    try:
      requestDate = date(data["year"], data["month"], data["day"])
    except ValueError:
      return HttpResponseBadRequest()

    SQLController.createCloseDay(requestDate)

    return HttpResponse(status=204)


  def delete(self, request):
    data = Formatting.ParseJSONRequest(request)
    try:
      requestDate = date(data["year"], data["month"], data["day"])
    except ValueError:
      return HttpResponseBadRequest()

    SQLController.deleteCloseDay(requestDate)

    return HttpResponse(status=204)
  