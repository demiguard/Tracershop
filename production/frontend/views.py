from django.http import FileResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

import pathlib

# This is an (almost) single page appilication
@ensure_csrf_cookie
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")

def pdfView(request, customer:str, year: int, month, ID):
  return FileResponse(open(f"frontend/static/frontend/pdfs/{customer}/{year}/{month}/{ID}.pdf", 'rb'))