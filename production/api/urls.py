from django.urls import path
#Views

# Auth Views

# Database Views
## Calender Views
from api.views.database.Calender.MonthColorEndpoint      import APIMonthColorEndpoint
from api.views.database.Calender.getCloseDays            import APIClosedDays

## Customers Views
from api.views.database.Customers.getCustomers            import APIGetCustomers
from api.views.database.Customers.getCustomer             import APIGetCustomer
from api.views.database.Customers.DeliverTimesEndpoint    import APIDeliverTimes

## Order Views
from api.views.database.Orders.createEmptyOrder        import APICreateEmptyFDGOrder
from api.views.database.Orders.getActivityOrders       import APIGetActivityOrders
from api.views.database.Orders.getActivityTable        import APIGetActivityTable
from api.views.database.Orders.getSpecialTracersOrders import APIGetSpecialTracerOrders
from api.views.database.Orders.getVialRange            import APIGetVialRange
from api.views.database.Orders.getVials                import APIGetVials

## Tracer Views
from api.views.database.Tracer.createNewTracer         import APICreateNewTracer
from api.views.database.Tracer.deleteTracer            import APIDeleteTracer
from api.views.database.Tracer.getTracers              import APIGetTracers
from api.views.database.Tracer.getTracerCustomer       import APIGetTracerCustomer
from api.views.database.Tracer.updateTracer            import APIUpdateTracer
from api.views.database.Tracer.updateTracerCustomer    import APIUpdateTracerCustomer

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
  APIGetVials,
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)
