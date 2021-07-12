from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from api.lib.SQL import SQLController
from api.utils import LMAP

class ApiGetCustomers(View):
  name = "getCustomers"
  path = "getCustomers"

  def get(self, request):

    Result = SQLController.getCustomers()
    FormattedResult = { res["ID"] : res["UserName"] for res in Result}
    
    return JsonResponse(FormattedResult)