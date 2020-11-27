from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from customer.models import Procedure
from customer.forms.forms import ProcedureForm

class ProcedureEditor(LoginRequiredMixin, TemplateView):
  template_name = "customer/sites/procedureEditor.html"
  login_url = "/login"
  redirect_field_name = 'loginView'
  name = "procedureEditor"
  path = "procedureEditor"

  
    

  def get(self, request):
    """
    docstring
    """
    procedureForms = []

    for procedure in Procedure.objects.all():
      procedureForms.append(
        ProcedureForm(instance=procedure)
      )


    context = {
      "procedureForms" : procedureForms
    }

    return render(request, self.template_name, context)

  
