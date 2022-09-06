from django.shortcuts import render, redirect
from django.views.generic import View, TemplateView
from django.http import JsonResponse, HttpResponseServerError, HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.mixins import LoginRequiredMixin


from customer.forms.forms import LoginForm

class LoginView(TemplateView):
  template_name = 'customer/auth/login.html'
  name = "loginView"
  path = "login"

  def get(self, request):
    context = {
      'login_form' : LoginForm()
    }

    return render(request, self.template_name, context)

  def post(self, request):
    return redirect("customer:login")

class APILoginView(View):
  path = "api/login"
  name = "login"

  def post(self, request):
    login_data = LoginForm(data=request.POST)
    success = False

    if login_data.is_valid():
      user = authenticate(
        request,
        username=request.POST['username'].upper().strip(),
        password=request.POST['password']
      )

      if user:
        login(request, user)
        success = True
      else:
        pass
    else:
      pass # LOG this

    response = JsonResponse({
      'success' : success
    })
    if not success:
      response.status_code = 403

    return response


class APILogoutView(TemplateView, LoginRequiredMixin):
  template_name=''
  login_url = '/login'
  redirect_field_name = 'loginView'
  name = "logout"
  path = "api/logout"

  def logout_user(self, request):
    logout(request)
    return redirect('customer:loginView')

  def get(self, request):
    return self.logout_user(request)

  def post(self, request):
    return self.logout_user(request)