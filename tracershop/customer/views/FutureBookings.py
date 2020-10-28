from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

import datetime

from customer.lib.CustomTools import LMap
from customer.lib.Filters import FilterBookings, FindActiveCustomer

from customer.models import Booking, CustomerUsesLocation, UserHasAccess

class FutureBooking(LoginRequiredMixin, TemplateView):
  template_name = 'customer/sites/futureBookings.html'
  login_url = '/login'
  redirect_field_name = 'loginView'

  def get(self, request):
    today = datetime.date.today()
    
    customers, activeCustomer = FindActiveCustomer(request.user)
    if not(activeCustomer):
      redirect("customer:editMyCustomer")

    studies = FilterBookings(activeCustomer, today)
    
    context = {
      'customerIDs' : LMap(lambda x: (x.ID, x.customerName), customers),
      'studies' : studies,
      'today' : today.strftime('%Y-%m-%d')
    }
    
    return render(request, self.template_name, context=context)