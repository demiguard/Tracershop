from django.shortcuts import render, redirect
from django.views.generic import TemplateView

from customer.forms.forms import CreateUserForm
from customer.models import PotentialUser

class CreateUserView(TemplateView):
  template_name = 'customer/auth/createUser.html'

  def get(self, request):
    
    context = {
      'CreateUserForm' : CreateUserForm()
    }

    return render(request, self.template_name, context)

  def post(self, request):
    pu = PotentialUser.objects.create(
      username = request.POST['username'],
      first_name = request.POST['first_name'],
      last_name = request.POST['last_name'],
      email_1 = request.POST['email_1'],
      email_2 = request.POST['email_2'],
      email_3 = request.POST['email_3'],
      email_4 = request.POST['email_4'],
      address = request.POST['address'],
      location = request.POST['location'],
      cityname = request.POST['cityname'],
      postcode = request.POST['postcode'],
    )
    pu.set_password(request.POST['password'])

    pu.save()


    return redirect('customer:CreateUserSuccess')



