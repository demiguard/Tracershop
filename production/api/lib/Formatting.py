import json

def ParseJSONRequest(request):
  if request.body:
    return json.load(request)
  else:
    return {}