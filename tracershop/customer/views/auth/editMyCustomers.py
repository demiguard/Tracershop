from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from customer.models import Customer, UserHasAccess
from customer.forms.forms import ActiveCustomerForm
from customer.lib.SQL import SQLController


class EditMyCustomers(LoginRequiredMixin, TemplateView):
  template_name = 'customer/auth/editMyCustomers.html'
  login_url = '/login'
  redirect_field_name = 'loginView'
  path = "editMyUser/MyCustomer"
  name = "editMyCustomer"

  def get(self, request):


    CurrentSelectedUsers = set(map(lambda x: x.CustomerID, UserHasAccess.objects.all().filter(userID=request.user.ID)))
    CustomerObjects = Customer.objects.all().filter(is_REGH=True)
    Accesses = [customer in CurrentSelectedUsers for customer in CustomerObjects]

    inputForm = [ ActiveCustomerForm(customer.customerName, access) for customer, access in zip(CustomerObjects, Accesses)]
    context = { 'customerList' : inputForm }


    return render(request, self.template_name, context)

  def post(self, request):
    user = request.user
    currentAccesses = UserHasAccess.objects.filter(userID=user).delete()


    for key, items in request.POST.items():
      if key == 'csrfmiddlewaretoken':
        continue
      customer = Customer.objects.filter(customerName=key)[0]
      newAccess = UserHasAccess(userID=user, CustomerID=customer)
      newAccess.save()
      

    return redirect("customer:index")