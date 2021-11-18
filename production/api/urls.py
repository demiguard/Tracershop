from django.urls import path
#Views
from api.views.getCustomers            import APIGetCustomers
from api.views.getCustomer             import APIGetCustomer
from api.views.getTracers              import APIGetTracers
from api.views.DeliverTimesEndpoint    import APIDeliverTimes
from api.views.MonthColorEndpoint      import APIMonthColorEndpoint
from api.views.getActivityOrders       import APIGetActivityOrders
from api.views.getActivityTable        import APIGetActivityTable
from api.views.getSpecialTracersOrders import APIGetSpecialTracerOrders
from api.views.updateTracer            import APIUpdateTracer
from api.views.getTracerCustomer       import APIGetTracerCustomer
from api.views.updateTracerCustomer    import APIUpdateTracerCustomer
from api.views.createNewTracer         import APICreateNewTracer
from api.views.deleteTracer            import APIDeleteTracer
from api.views.getCloseDays            import APIClosedDays
from api.views.createEmptyOrder        import APICreateEmptyFDGOrder
from api.views.getVialRange            import APIGetVialRange

from lib.utils import LMAP


Views = [
  APIGetCustomer,
  APIGetCustomers,
  APIGetTracers,
  APIDeliverTimes,
  APIMonthColorEndpoint,
  APIGetActivityOrders,
  APIGetActivityTable,
  APIGetSpecialTracerOrders,
  APIUpdateTracer,
  APIGetTracerCustomer,
  APIUpdateTracerCustomer,
  APICreateNewTracer,
  APIDeleteTracer,
  APIClosedDays,
  APICreateEmptyFDGOrder,
  APIGetVialRange,
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)
