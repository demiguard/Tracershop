from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from customer.forms.forms import EditUserForm


class EditMyUser(LoginRequiredMixin, TemplateView):
  template_name = 'customer/auth/editMyUser.html'
  login_url = '/login'
  redirect_field_name = 'loginView'
  path = "editMyUser"
  name = "editMyUser"

  def get(self, request):
    user = request.user

    context = {'EditUserForm' : EditUserForm(initial={
      "first_name" : user.first_name,
      "last_name" : user.last_name,
      "email_1" : user.email_1,
      "email_2" : user.email_2,
      "email_3" : user.email_3,
      "email_4" : user.email_4,
      "address" : user.address,
      "location" : user.location,
      "cityname" : user.cityname,
      "postcode" : user.postcode
    })}


    return render(request, self.template_name, context)

  def post(self, request):
    #TODO This function


    return redirect("customer:index")
