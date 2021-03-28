from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, QueryDict
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import ObjectDoesNotExist


from customer.forms.forms import VerifyUserForm
from customer.lib.SQL import SQLController
from customer.models import PotentialUser, User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

class AdminPanel (AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'adminPanel'
  path = 'admin/Panel'

  template_name = 'customer/admin/adminPanel.html'

  def get(self, request):

    context = {}


    return render(request, self.template_name, context)
