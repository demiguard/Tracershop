from django.shortcuts import render
from django.views.generic import TemplateView

from django.contrib.auth.mixins import LoginRequiredMixin

from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin
from customer.lib import sqlCurator

class VerifyUserView(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  template_name = 'customer/admin/VerifyUser.html'

  def get(self, request):
    



    context = {}

    return render(request, self.template_name, context)

class APIVerifyUser(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  pass