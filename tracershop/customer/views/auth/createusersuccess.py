from django.shortcuts import render
from django.views.generic import TemplateView

class CreateUserSuccess(TemplateView):
  template_name = 'customer/auth/createUserSuccess.html'

  def get(self, request):
    return render(request, self.template_name, {})
