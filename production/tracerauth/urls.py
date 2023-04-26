from django.urls import path
from tracerauth.views import ExternalLoginView


urlpatterns = [
  path(ExternalLoginView.path, ExternalLoginView.as_view())
]