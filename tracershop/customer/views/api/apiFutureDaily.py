from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import View
from django.http import JsonResponse, HttpResponseBadRequest

from datetime import date

from customer.models import Customer
from customer.lib.Filters import FilterBookings

class ApiFutureBookingDay(View):
  name = "ApiFutureBookingDay"
  path = "api/FutureDaily/<int:year>/<int:month>/<int:day>"

  #Constants
  USERIDKEY = 'UserID'


  def post(self, request, year, month, day):
    try:
      queryDate = date(year, month, day)
    except Exception as E:
      print(E)
      return HttpResponseBadRequest()
    
    #TODO Error Handling as statement below may not succeed
    customer = Customer.objects.get(ID=request.POST[self.USERIDKEY])

    response = FilterBookings(customer, queryDate)

    print(response)
    return JsonResponse(response)
    




