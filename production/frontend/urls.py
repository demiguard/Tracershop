from django.urls import path
from frontend.views import indexView, pdfView, pdfInjectionView, vial_csv_view,\
  shop_manual_view, release_isotope_document, vial_label_pdf
from shared_constants import URL_ACTIVITY_PDF_BASE_PATH, URL_INDEX,\
  URL_INJECTION_PDF_BASE_PATH, URL_SHOP_MANUAL, URL_ISOTOPE_PDF_BASE_PATH,\
  URL_VIAL_LABEL_PDF_BASE_PATH

urlpatterns = [
  path(URL_INDEX, indexView),
  path(f'{URL_ACTIVITY_PDF_BASE_PATH}/<int:timeSlotID>/<int:year>/<int:month>/<int:day>', pdfView),
  path(f'{URL_INJECTION_PDF_BASE_PATH}/<int:injection_order_id>', pdfInjectionView),
  path(f'{URL_ISOTOPE_PDF_BASE_PATH}/<int:delivery_id>/<int:year>/<int:month>/<int:day>', release_isotope_document),
  path(f'{URL_VIAL_LABEL_PDF_BASE_PATH}/<int:vial_id>', vial_label_pdf),
  path(f'excel/<int:year>/<int:month>/data.xlsx', vial_csv_view),
  path(URL_SHOP_MANUAL, shop_manual_view)
]