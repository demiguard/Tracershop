from django.views.generic import View

from lib.ProductionJSON import ProductionJSONResponse
from lib.SQL import SQLController 

from constants import JSON_CUSTOMER, JSON_DELIVERTIMES

class APIGetCustomer(View):
  """
    This endpoint retrieves the deliver times availble to a specific customer
  """
  name = "getCustomer"
  path = "getCustomer/<int:ID>"

  def get(self, request, ID):
    
    return ProductionJSONResponse({
      JSON_CUSTOMER : self.SQL.getCustomer(ID),
      JSON_DELIVERTIMES : SQLController.getCustomerDeliverTimes(ID)
    })

  def __init__(self, SQL_Controller=SQLController.SQL()):
    self.SQL = SQL_Controller
    super().__init__()