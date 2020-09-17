from customer.forms import forms



def SecondaryOrderForms(SecondaryOrderQuery : list) -> list:
  returnForms = []

  for query in SecondaryOrderQuery:
    form = forms.T_OrderForm()
    form.name = query['name']
    form.id   = query['id']
    
    returnForms.append(form)


  return returnForms