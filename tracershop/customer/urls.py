from django.contrib import admin
from django.urls import path

from customer.views.index import IndexView

from customer.views.auth.login import LoginView, APILoginView, APILogoutView 

from customer.views.api.api_month_status import Api_month_status
from customer.views.api.api_order_date import Api_order_date

app_name = 'customer'

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    #AUTH
    path('login',      LoginView.as_view(),     name='loginView'),
    path('api/login',  APILoginView.as_view(),  name='login'),
    path('api/logout', APILogoutView.as_view(), name='logout'),

    #API
    path('api/month_status/<int:year>/<int:month>', Api_month_status.as_view(), name='API_month_status'),
    path('api/order_date/<int:year>/<int:month>/<int:day>', Api_order_date.as_view(), name="API_order_date"),
]