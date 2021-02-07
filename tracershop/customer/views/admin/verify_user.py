from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import JsonResponse, QueryDict
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import ObjectDoesNotExist


from customer.forms.forms import VerifyUserForm
from customer.lib.SQL import SQLController
from customer.models import PotentialUser, User
from customer.views.mixins.AuthRequirementsMixin import AdminRequiredMixin

class VerifyUserView(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  name = 'verifyUser'
  path = 'verifyUser'

  template_name = 'customer/admin/VerifyUser.html'

  def get(self, request):
    unverfiedUsers =     SQLController.get_unverified_users()
    maxCustomerNumber =  SQLController.getMaxCustomerNumber()
    verificationforms = [ VerifyUserForm(initial={'customerNumber': i+1+maxCustomerNumber}) for i,_ in enumerate(unverfiedUsers) ]

    context = {
      'potentialUsersForms' : zip(unverfiedUsers, verificationforms)
    }

    return render(request, self.template_name, context)



class APIVerifyUser(AdminRequiredMixin, LoginRequiredMixin, TemplateView):
  path = "api/verifyUser/<int:userID>"
  name = "APIVerifyUser"
  def parse_qDict(self, qDict):
    returnDict = {}
    if qDict.get('is_admin','false') == 'true':
      returnDict['is_admin'] = True
    else:
      returnDict['is_admin'] = False
    if qDict.get('is_staff','false') == 'true':
      returnDict['is_staff'] = True
    else:
      returnDict['is_staff'] = False
    returnDict['customerNumber'] = qDict.get('customerNumber', None)

    return returnDict

  def put(self, request, userID):
    
    FormInfo = self.parse_qDict(QueryDict(request.body))

    try:
      pu = PotentialUser.objects.get(id=userID)
    except ObjectDoesNotExist: 
      return JsonResponse({'status': 0})

    newUser = User.objects.create(
      customer_number = FormInfo.get('customerNumber', None),
      is_staff = FormInfo.get('is_staff', False),
      is_admin = FormInfo.get('is_admin', False),
      username = pu.username,
      password = pu.password,
      first_name = pu.first_name,
      last_name  = pu.last_name,
      email_1 = pu.email_1,
      email_2 = pu.email_2,
      email_3 = pu.email_3,
      email_4 = pu.email_4,
      address  = pu.address,
      location = pu.location,
      cityname = pu.cityname,
      postcode = pu.postcode
    )

    newUser.save()

    pu.delete()

    return JsonResponse({'status': 1})

  def delete(self, request, userID):
    try:
      pu = PotentialUser.objects.get(id=userID)
    except ObjectDoesNotExist: 
      return JsonResponse({'status': 0})

    pu.delete()

    return JsonResponse({'status': 1})
