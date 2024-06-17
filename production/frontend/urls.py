from django.urls import path
from .views import indexView, pdfView, pdfInjectionView, vial_csv_view
from shared_constants import URL_ACTIVITY_PDF_BASE_PATH, URL_INDEX, URL_INJECTION_PDF_BASE_PATH

urlpatterns = [
  path(URL_INDEX, indexView),
  path(f'{URL_ACTIVITY_PDF_BASE_PATH}/<int:endpointID>/<int:tracerID>/<int:year>/<int:month>/<int:day>', pdfView),
  path(f'{URL_INJECTION_PDF_BASE_PATH}/<int:injection_order_id>', pdfInjectionView),
  path(f'excel/<int:year>/<int:month>/data.xlsx', vial_csv_view),
]