from django import forms
from django.forms import Form, ModelForm

from customer.models import PotentialUser

class OrderForm(Form):
  order_MBQ = forms.IntegerField(min_value=0, required=False, label="Antal MBQ")


class LoginForm(Form):
  username = forms.CharField()
  password = forms.CharField(widget=forms.PasswordInput())

class CreateUserForm(Form):
  
  username         = forms.CharField(max_length=120)
  password         = forms.CharField(widget=forms.PasswordInput()) 
  password_confirm = forms.CharField(widget=forms.PasswordInput())

  first_name = forms.CharField(max_length=30, required=False)
  last_name  = forms.CharField(max_length=60, required=False)

  email_1 = forms.CharField(max_length=256, required=False, widget=forms.EmailInput())
  email_2 = forms.CharField(max_length=256, required=False, widget=forms.EmailInput())
  email_3 = forms.CharField(max_length=256, required=False, widget=forms.EmailInput())
  email_4 = forms.CharField(max_length=256, required=False, widget=forms.EmailInput())

  address  = forms.CharField(max_length=60, required=False)
  location = forms.CharField(max_length=60, required=False)
  cityname = forms.CharField(max_length=60, required=False)
  postcode = forms.CharField(max_length=60, required=False)