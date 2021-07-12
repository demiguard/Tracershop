from django.urls import path
#Views
from api.views.getCustomers import ApiGetCustomers
from api.views.getCustomer  import ApiGetCustomer
from api.views.DeliverTimesEndpoint import DeliverTimesEndpoint

from api.utils import LMAP


Views = [
  ApiGetCustomer,
  ApiGetCustomers,
  DeliverTimesEndpoint
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)