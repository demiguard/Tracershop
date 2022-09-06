from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.http.response import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from customer.forms.forms import CreateUserForm
from customer.models import PotentialUser, User

success = "success"

class CreateUserView(TemplateView):
  template_name = 'customer/auth/createUser.html'
  path = "createuser"
  name = "CreateUser"

  @method_decorator(ensure_csrf_cookie)
  def get(self, request):
    context = {
      'CreateUserForm' : CreateUserForm()
    }

    return render(request, self.template_name, context)

  @method_decorator(ensure_csrf_cookie)
  def post(self, request):

    usernames = [user.username for user in User.objects.all()]
    pusernames = [ Puser.username for Puser in PotentialUser.objects.all() ]
    username = request.POST['username']
    username = username.upper().strip()
    if username in usernames:
      return JsonResponse({
        success : "Brugeren er allerede eksister allerede."
      })

    if username in pusernames:
      return JsonResponse({
        success : "Brugeren er i gang med at blive opretet. Du skal ikke gører mere."
      })

    potentialuser = PotentialUser.objects.create(
      username = username,
      email_1 = request.POST['email_1'],
    )
    potentialuser.set_password(request.POST['password'])

    potentialuser.save()

    return JsonResponse({
      success : "success"
    })



