from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from customer.forms.forms import CreateUserForm
from customer.models import User

class CreateUserView(TemplateView):
  template_name = 'customer/auth/createUser.html'
  path = "createuser"
  name = "CreateUser"

  def get(self, request):
    
    context = {
      'CreateUserForm' : CreateUserForm()
    }

    return render(request, self.template_name, context)

  def post(self, request):
    user = User.objects.create(
      username = request.POST['username'],
      email_1 = request.POST['email_1'],
      is_staff=True
    )
    user.set_password(request.POST['password'])

    user.save()




    return redirect('customer:loginView')



