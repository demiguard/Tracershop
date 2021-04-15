from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import ObjectDoesNotExist


from customer.models import Customer
from customer.lib.SQL import SQLController
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

class AdminEditCustomers(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'adminEditCustomers'
  path = 'admin/EditCustomers'

  template_name = 'customer/admin/EditCustomers.html'

  def get(self, request):
    context={
      "Customers" : SQLController.getAll(Customer)
    }    

    return render(request, self.template_name, context)