from django.urls import path
from .views import indexView, pdfView

urlpatterns = [
  path('', indexView),
  path('pdfs/<str:customer>/<int:year>/<int:month>/<int:ID>', pdfView),
]