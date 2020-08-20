from django import forms


class OrderForm(forms.Form):
  order_MBQ = forms.IntegerField(min_value=0, required=False, label="Antal MBQ")

class LoginForm(forms.Form):
  username = forms.CharField()
  password = forms.CharField(widget=forms.PasswordInput())