from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from customer.lib.SQL import SQLController

class (LoginRequiredMixin, TemplateView):
  name = 
  path = 

  template_name = 

  def get(self, request): 

    context = {}


    return render(request, self.template_name, context)