def formatUse(adir):
  if 'use' in adir:
    if (adir['use'] == 'Human'):
      adir['use'] = 'Menneske'
  
  return adir

def convertIntToStrLen2(INT : int) -> str:
  INT = str(INT)
  if len(INT) == 1:
    return "0" + INT
  return INT