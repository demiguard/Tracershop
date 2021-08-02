from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, QueryDict
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import ObjectDoesNotExist


from customer.forms.forms import VerifyUserForm
from customer.lib.SQL import SQLController
from customer.models import PotentialUser, User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

class AdminUserView(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'adminUser'
  path = 'myadmin/ActiveUsers'

  template_name = 'customer/admin/adminUser.html'

  def get(self, request):
    context={
      "users" : SQLController.get_users()
    }    

    return render(request, self.template_name, context)


