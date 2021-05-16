from django.contrib import admin
from django.urls    import path

from customer.lib.CustomTools import LMap

# Views
from customer.views.index           import IndexView
from customer.views.FutureBookings  import FutureBooking
from customer.views.procedureEditor import ProcedureEditor

from customer.views.admin.adminLocations import AdminLocationsView
from customer.views.admin.admin_users import AdminUserView
from customer.views.admin.adminPanel import AdminPanel
from customer.views.admin.adminConfirmUser import AdminConfirmUser
from customer.views.api.apiAdminChangePassword import ApiAdminChangePassword
from customer.views.api.apiAdminUpdateRights import ApiAdminUpdateRights
from customer.views.api.apiConfirmUser import ApiConfirmUser

from customer.views.auth.createuser        import CreateUserView
from customer.views.auth.createusersuccess import CreateUserSuccess
from customer.views.auth.editMyCustomers   import EditMyCustomers
from customer.views.auth.editmyuser        import EditMyUser
from customer.views.auth.login             import LoginView, APILoginView, APILogoutView 
from customer.views.auth.resetpassword     import ResetPasswordView

from customer.views.api.apiRest                          import RESTAPI
from customer.views.api.apiEditOrder                     import ApiEditOrder
from customer.views.api.api_add_order                    import Api_add_order
from customer.views.api.apiMonthStatus                   import ApiMonthStatus
from customer.views.api.api_order_date                   import ApiOrderDate
from customer.views.api.api_add_torder                   import Api_add_torder
from customer.views.api.apiFutureDaily                   import ApiFutureBookingDay
from customer.views.api.apiUpdateProcedures              import ApiUpdateProcedure
from customer.views.api.apiMassAddOrder                  import ApiMassAddOrder
from customer.views.api.apiCreateNewPasswordResetRequest import APICreateNewPasswordResetRequest
from customer.views.api.apiEditTOrder                    import ApiEditTOrder

app_name = 'customer'

Views = [
  #Sites
  IndexView,
  FutureBooking,
  ProcedureEditor,
  #Admin
  AdminUserView, 
  AdminPanel,
  AdminLocationsView,
  AdminConfirmUser,
  ApiAdminChangePassword,
  ApiAdminUpdateRights,
  ApiConfirmUser,
  #Authen
  CreateUserView,
  CreateUserSuccess,
  LoginView, 
  APICreateNewPasswordResetRequest,
  ResetPasswordView,
  APILoginView, 
  APILogoutView,
  EditMyCustomers,
  EditMyUser,
  ApiEditOrder,
  Api_add_order,
  ApiMonthStatus,
  ApiOrderDate,
  ApiMassAddOrder,
  Api_add_torder,
  ApiFutureBookingDay,
  ApiUpdateProcedure, 
  ApiEditTOrder,
  RESTAPI
]

urlpatterns = LMap(lambda view: path(view.path, view.as_view(), name=view.name), Views)

