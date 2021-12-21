from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse

from lib.SQL import SQLController
from lib import Formatting

class APIUpdateTracerCustomer(View):
  name = "updateTracerCustomer"
  path = "updateTracerCustomer"

  def put(self, request):
    data = Formatting.ParseJSONRequest(request)

    createConnection = data["newValue"]
    tracer_id        = data["tracer_id"]
    customer_id      = data["customer_id"]

    if createConnection:
      SQLController.createTracerCustomer(tracer_id, customer_id)
    else:
      SQLController.deleteTracerCustomer(tracer_id, customer_id)


    return HttpResponse(status=204)
