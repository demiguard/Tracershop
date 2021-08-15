from django.urls import path
#Views
from api.views.getCustomers import ApiGetCustomers
from api.views.getCustomer  import ApiGetCustomer
from api.views.getTracers import ApiGetTracers
from api.views.DeliverTimesEndpoint import ApiDeliverTimes
from api.views.MonthColorEndpoint import ApiMonthColorEndpoint
from api.views.getFDGOrders import ApiGetFDGOrders
from api.views.getInitialData import ApiGetInitialData
from api.views.getSpecialTracers import ApiGetSpecialTracers

from lib.utils import LMAP


Views = [
  ApiGetCustomer,
  ApiGetCustomers,
  ApiDeliverTimes,
  ApiMonthColorEndpoint,
  ApiGetTracers,
  ApiGetFDGOrders,
  ApiGetInitialData,
  ApiGetSpecialTracers
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)