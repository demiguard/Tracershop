from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin


from customer.forms.forms import VerifyUserForm
from customer.lib.SQL import SQLController
from customer.models import PotentialUser, User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

class AdminConfirmUser (AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'adminConfirmUser'
  path = 'myadmin/ConfirmUser'

  template_name = 'customer/admin/adminConfirmUser.html'


  def get(self, request):
    potentialUsers = SQLController.getPotentialUsers()
    context = {
      "potentialUsers" : potentialUsers
    }

    return render(request, self.template_name, context)