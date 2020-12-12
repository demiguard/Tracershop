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

    ActiveCustomers = SQLController.getActiveCustomers()

    inputList = []


    for ActiveCustomer in ActiveCustomers:
      #Find our 
      DjangoCustomers = Customer.objects.filter(ID=ActiveCustomer['ID']) 
      if len(DjangoCustomers) == 0:
        DjangoCustomer = Customer(ID=ActiveCustomer[ID], customerName=ActiveCustomer['Username'])
        DjangoCustomer.save()
      else:
        DjangoCustomer = DjangoCustomers[0] #Unique cuz primary Key

      if not(DjangoCustomer.TestCustomer) and DjangoCustomer.is_REGH: #Should we append this one
        
        inputList.append(
          ActiveCustomerForm(
            ActiveCustomer['Username'], 
            UserHasAccess.objects.filter(userID=request.user,CustomerID=DjangoCustomer).exists(),
            ))

    context = { 'customerList' : inputList}


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