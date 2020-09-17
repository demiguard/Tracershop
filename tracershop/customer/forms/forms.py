from django import forms
from django.forms import Form, ModelForm

from customer.lib.Enums import USECASENAMING
from customer.models import PotentialUser

class OrderForm(Form):
  order_MBQ = forms.IntegerField(min_value=0, required=False, label="Antal MBQ")
  comment   = forms.CharField(required=False, widget=forms.TextInput())

class LoginForm(Form):
  username = forms.CharField()
  password = forms.CharField(widget=forms.PasswordInput())

class CreateUserForm(Form):

  username         = forms.CharField(max_length=120)
  password         = forms.CharField(widget=forms.PasswordInput()) 
  password_confirm = forms.CharField(widget=forms.PasswordInput())

  first_name = forms.CharField(max_length=30, required=False)
  last_name  = forms.CharField(max_length=60, required=False)

  email_1 = forms.EmailField(max_length=256, required=False, widget=forms.EmailInput())
  email_2 = forms.EmailField(max_length=256, required=False, widget=forms.EmailInput())
  email_3 = forms.EmailField(max_length=256, required=False, widget=forms.EmailInput())
  email_4 = forms.EmailField(max_length=256, required=False, widget=forms.EmailInput())

  address  = forms.CharField(max_length=60, required=False)
  location = forms.CharField(max_length=60, required=False)
  cityname = forms.CharField(max_length=60, required=False)
  postcode = forms.CharField(max_length=60, required=False)

class VerifyUserForm(Form):
  is_staff = forms.BooleanField(required=False)
  is_admin = forms.BooleanField(required=False)
  customerNumber = forms.IntegerField(required=False, widget=forms.TextInput())

class T_OrderForm(Form):
  useOptions = [(i, useCase) for i, useCase in enumerate(USECASENAMING)]

  deliverTime = forms.TimeField()
  injectionField = forms.IntegerField(required=False, widget=forms.TextInput())
  useField = forms.ChoiceField(choices=useOptions)

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields['deliverTime'].widget.attrs.update({'class': "timeField"})
    self.fields['injectionField'].widget.attrs.update({'class':"injectionField"})
    self.fields['useField'].widget.attrs.update({'class':"selectTOrder custom-select"})