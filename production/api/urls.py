from django.urls import path
#Views

# Auth Views

# Database Views
#from api.views.database.ServerConfig import APIServerConfig
#
### Calender Views
#from api.views.database.Calender.getCloseDays            import APIClosedDays
#
### Customers Views
#from api.views.database.Customers.getCustomers            import APIGetCustomers
#from api.views.database.Customers.getCustomer             import APIGetCustomer
#from api.views.database.Customers.DeliverTimesEndpoint    import APIDeliverTimes
#
### Order Views
#from api.views.database.Orders.getVials                import APIGetVials
#
### Tracer Views
#from api.views.database.Tracer.createNewTracer         import APICreateNewTracer
#from api.views.database.Tracer.deleteTracer            import APIDeleteTracer
#from api.views.database.Tracer.getTracers              import APIGetTracers
#from api.views.database.Tracer.getTracerCustomer       import APIGetTracerCustomer
#from api.views.database.Tracer.updateTracer            import APIUpdateTracer
#from api.views.database.Tracer.updateTracerCustomer    import APIUpdateTracerCustomer

from lib.utils import LMAP


Views = [
  #APIGetCustomer,
  #APIGetCustomers,
  #APIGetTracers,
  #APIDeliverTimes,
  #APIUpdateTracer,
  #APIGetTracerCustomer,
  #APIUpdateTracerCustomer,
  #APICreateNewTracer,
  #APIDeleteTracer,
  #APIClosedDays,
  #APIGetVials,
  #APIServerConfig,
]

urlpatterns = LMAP(lambda view: path(view.path, view.as_view(), name=view.name), Views)
