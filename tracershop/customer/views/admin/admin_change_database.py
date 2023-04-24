from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, QueryDict
from django.contrib.auth.mixins import LoginRequiredMixin

import json

from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin
from customer.forms.forms import DatabaseForm, AddressForm, ServerConfigurationForm
from customer.models import Database, Address, ServerConfiguration

class AdminChangeDatabase(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = "changeDatabase"
  path = "myadmin/change_database"

  template_name = "customer/admin/adminChangeDatabase.html"

  def get(self, request):
    databases = Database.objects.all()
    addresses = Address.objects.all()
    server_config = ServerConfiguration.objects.all()[0]

    database_forms = [DatabaseForm(instance=database) for database in databases]
    address_forms = [AddressForm(instance=address) for address in addresses]
    server_config_form = ServerConfigurationForm(instance=server_config)

    context = {
      "database_forms" : database_forms,
      "address_forms" : address_forms,
      "server_config_form" : server_config_form
    }

    return render(request, self.template_name, context=context)

  def post(self, request):
    post_data = request.POST

    server_config = ServerConfiguration.objects.all()[0]
    databases = Database.objects.all()
    addresses = Address.objects.all()

    # Address update
    ips = post_data.getlist('ip')
    ports = post_data.getlist('port')
    descriptions = post_data.getlist('description')

    for address,ip, port, description in zip(addresses, ips, ports, descriptions):
      address.ip = ip
      address.port = port
      address.description = description
      address.save()

    # Database Update
    databaseNames = post_data.getlist('databaseName')
    usernames = post_data.getlist('username')
    passwords = post_data.getlist('password')
    post_addresses = post_data.getlist('address')

    for database, databaseName, username, password, post_address in zip(
          databases, databaseNames, usernames, passwords, post_addresses):
      database.databaseName = databaseName
      database.username = username
      database.password = password
      try:
        database.address = Address.objects.get(pk=post_address)
      except:
        database.address = None
      database.save()

    # Updating Server Config
    try:
      database = Database.objects.get(pk=post_data['ExternalDatabase'])
      server_config.ExternalDatabase = database
      server_config.save()
    except:
      pass


    database_forms = [DatabaseForm(instance=database) for database in databases]
    address_forms = [AddressForm(instance=address) for address in addresses]
    server_config_form = ServerConfigurationForm(instance=server_config)

    context = {
      "database_forms" : database_forms,
      "address_forms" : address_forms,
      "server_config_form" : server_config_form
    }

    return render(request, self.template_name, context=context)