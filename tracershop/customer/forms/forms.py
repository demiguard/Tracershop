from django import forms
from django.forms import Form, ModelForm

from customer.lib.Enums import USECASENAMING
from customer.models import PotentialUser, Procedure, Location, Procedure

class OrderForm(Form):
  order_MBQ = forms.IntegerField(min_value=0, required=False, label="Antal MBQ")
  comment   = forms.CharField(required=False, widget=forms.TextInput())

  def __init__(self, ordertime, *args,**kwargs):
    super().__init__(*args, **kwargs)
    self.fields['order_MBQ'].widget.attrs['class'] = f"fdg_MQB_Field {ordertime}"
    

class LoginForm(Form):
  username = forms.CharField()
  password = forms.CharField(widget=forms.PasswordInput())

class CreateUserForm(Form):

  username         = forms.CharField(max_length=120)
  password         = forms.CharField(widget=forms.PasswordInput()) 
  password_confirm = forms.CharField(widget=forms.PasswordInput())
  email_1 = forms.EmailField(max_length=256, widget=forms.EmailInput(), label="Email 1*")
  

class EditUserForm(Form):
  password         = forms.CharField(widget=forms.PasswordInput(), required=False) 
  password_confirm = forms.CharField(widget=forms.PasswordInput(), required=False)
  email_1 = forms.EmailField(max_length=256, widget=forms.EmailInput(), required=False)
  
  
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

class ActiveCustomerForm(Form):
  def __init__(self, name, initalValue, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields[name] = forms.BooleanField(required=False, initial=initalValue)
    
class ProcedureForm(ModelForm):
  class Meta:
    model = Procedure
    fields = ["title", "baseDosis", "delay", "tracer", "inUse"]

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields["title"].widget.attrs["readonly"] = True
    for visible in self.visible_fields():
      visible.field.widget.attrs['class'] = 'form-control'

class LocationForm(ModelForm):
  class Meta:
    model = Location
    fields = ["location", "LocName", "AssignedTo"]

  def __init__(self, locationName,  *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields['LocName'].widget.attrs['id'] = f"input-{locationName}"
    self.fields['LocName'].widget.attrs['class'] = "LocationNameInput"
    self.fields['AssignedTo'].widget.attrs['id'] = f"select-{locationName}"
    self.fields['AssignedTo'].widget.attrs['class'] = f"AssignedToInput"

