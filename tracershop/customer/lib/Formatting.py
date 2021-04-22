import json

def convertIntToStrLen2(INT : int) -> str:
  INT = str(INT)
  if len(INT) == 1:
    return "0" + INT
  return INT

def convertTruthValuesFromJS(truthval :str) -> bool:
  if truthval.lower() == "true":
    return True
  if truthval.lower() == "false":
    return False
  raise ValueError("Value is not true or false")

def ParseJSONRequest(request):
  if request.body:
    return json.load(request)
  else:
    return {}
    
def ParseBool(string):
  if type(string) == str:
    if string.lower() == "true":
      return True
    if string.lower() == "false":
      return False
    raise ValueError("String does not match True or False")
  return bool(string)