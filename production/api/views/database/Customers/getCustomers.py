from django.views.generic import View

from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController

from constants import JSON_CUSTOMER

class APIGetCustomers(View):
  """
    This endpoint retrieves the users from the User table, that can order products.
  """
  name = "getCustomers"
  path = "getCustomers"

  def get(self, request):
    return ProductionJSONResponse({
      JSON_CUSTOMER : self.SQL.getCustomers()
    })

  def __init__(self, SQL_Controller=SQLController.SQL()):
    self.SQL = SQL_Controller
    super().__init__()
