from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

from customer.lib.SQL import SQLController as SQL
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

from customer.models import Customer, Location
from customer.forms.forms import LocationForm


def createCustomerForm():
  pass


def createLocationsForms(Locations):
  LocationsForms = []
  for location in Locations:
    form =  LocationForm(location.location, instance=location)
    form.name = location.location

    LocationsForms.append(form)

  return LocationsForms


class AdminLocationsView(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'adminLocations'
  path = 'myadmin/Locations'

  template_name = 'customer/admin/adminLocations.html'

  def get(self, request): 
    """

      Note: there might some inefficiencies in my mapping, however since we are talking about <100 location and customers, we should be kewl with a n² or n³ algorithm 
    """
    locationsObjects            = SQL.getAll(Location)
    CustomerObjects             = SQL.getAll(Customer)

    displayLocations = createLocationsForms(locationsObjects)

    context = {
      'customers' : CustomerObjects,
      'locations' : displayLocations
    }


    return render(request, self.template_name, context)