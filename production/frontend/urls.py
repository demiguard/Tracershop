from django.urls import path
from .views import indexView, pdfView

urlpatterns = [
  path('', indexView),
  path('pdfs/<int:endpointID>/<int:tracerID>/<int:year>/<int:month>/<int:day>', pdfView),
]