from django.contrib import admin
from django.urls import path

from customer.views.index import IndexView
from customer.views.FutureBookings import FutureBooking

from customer.views.admin.verify_user import VerifyUserView, APIVerifyUser


from customer.views.auth.createuser import CreateUserView
from customer.views.auth.createusersuccess import CreateUserSuccess
from customer.views.auth.login import LoginView, APILoginView, APILogoutView 
from customer.views.auth.editMyCustomers import EditMyCustomers

from customer.views.api.api_add_order import Api_add_order
from customer.views.api.api_month_status import Api_month_status
from customer.views.api.api_order_date import Api_order_date
from customer.views.api.api_add_torder import Api_add_torder

app_name = 'customer'

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('futureBooking', FutureBooking.as_view(), name='futureBooking'),
    #ADMIN
    path('verifyUser', VerifyUserView.as_view(), name= 'verifyUser'),
    
    #AUTH
    path('login',                 LoginView.as_view(),         name='loginView'),
    path('createuser',            CreateUserView.as_view(),    name='CreateUser'),
    path('createUserSuccess',     CreateUserSuccess.as_view(), name='CreateUserSuccess'),
    path('editMyUser/MyCustomer', EditMyCustomers.as_view(),   name='editMyCustomer'),

    #API
    path('api/addOrder', Api_add_order.as_view(), name='API_add_order'),
    path('api/addTOrder', Api_add_torder.as_view(), name='API_add_torder'),
    path('api/month_status/<int:year>/<int:month>', Api_month_status.as_view(), name='API_month_status'),
    path('api/order_date/<int:year>/<int:month>/<int:day>', Api_order_date.as_view(), name="API_order_date"),
    path('api/logout', APILogoutView.as_view(), name='logout'),
    path('api/login',  APILoginView.as_view(),  name='login'),
    path('api/verifyUser/<int:userID>', APIVerifyUser.as_view(), name='API_verifyUser'),
]