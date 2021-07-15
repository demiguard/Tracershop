from django.urls import path
#Views
from api.views.getCustomers import ApiGetCustomers
from api.views.getCustomer  import ApiGetCustomer
from api.views.getTracers import ApiGetTracers
from api.views.DeliverTimesEndpoint import ApiDeliverTimes
from api.views.MonthColorEndpoint import ApiMonthColorEndpoint


from api.utils import LMAP


Views = [
  ApiGetCustomer,
  ApiGetCustomers,
  ApiDeliverTimes,
  ApiMonthColorEndpoint,
  ApiGetTracers
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)