from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# This is a single page appilication
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")
