from django.shortcuts import render

# This is a single page appilication
def indexView(request, *args, **kwargs):
  return render(request, "frontend/index.html")
