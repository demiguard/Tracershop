from django.contrib import admin
from django.urls    import path

from customer.lib.CustomTools import LMap

# Views
from customer.views.index          import IndexView
from customer.views.FutureBookings import FutureBooking

from customer.views.admin.verify_user import VerifyUserView, APIVerifyUser

from customer.views.auth.createuser        import CreateUserView
from customer.views.auth.createusersuccess import CreateUserSuccess
from customer.views.auth.login             import LoginView, APILoginView, APILogoutView 
from customer.views.auth.editMyCustomers   import EditMyCustomers
from customer.views.auth.editmyuser        import EditMyUser

from customer.views.api.api_add_order    import Api_add_order
from customer.views.api.api_month_status import Api_month_status
from customer.views.api.api_order_date   import ApiOrderDate
from customer.views.api.api_add_torder   import Api_add_torder
from customer.views.api.apiFutureDaily   import ApiFutureBookingDay

app_name = 'customer'

Views = [
  #Sites
  IndexView,
  FutureBooking,
  #Admin
  VerifyUserView, 
  APIVerifyUser,
  #Authen
  CreateUserView,
  CreateUserSuccess,
  LoginView, 
  APILoginView, 
  APILogoutView,
  EditMyCustomers,
  EditMyUser,
  Api_add_order,
  Api_month_status,
  ApiOrderDate,
  Api_add_torder,
  ApiFutureBookingDay
]

urlpatterns = LMap(lambda view: path(view.path, view.as_view(), name=view.name), Views)

