from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import FileResponse, QueryDict, HttpResponseNotFound, JsonResponse, HttpResponse, HttpResponseServerError, HttpResponseBadRequest
from django.views.generic import View
from django.core.handlers.wsgi import WSGIRequest

from pathlib import Path
from datetime import datetime
import logging
import time
import os
import shutil
import json

from typing import Type


class UserEndpoint(AdminRequiredMixin, LoginRequiredMixin, RESTEndpoint):
  #model = models.User
  
  fields = [
    'id'
  ]

  def patch(self, request, obj_id):
    # Compute all the corresponding department and hospital combinations 
   
    return super().patch(request, obj_id)

  def post(self, request):
    # Compute all the corresponding department and hospital combinations 
    
    return super().post(request)
  

