### So this file and Class is mostly made because I couldn't figure out how to implement this class using a Djangos build in frame work
### Maybe I'm just stupid and can't read an API, So feel free to replace this with an implementation such that 
### So in general the stratigy is too transform json objects and list of models back and forth 
### Wrapper function intented to work as an interface. So if you replace this module with something else you should 

from django.db.models import AutoField, BigAutoField, BooleanField, CharField, DateField, DateTimeField
from django.db.models import ForeignKey, FloatField, IntegerField, IntegerChoices, TimeField
from customer.lib.Formatting import ParseBool


import datetime



def SerializeAll(model):
  """
    This function creates a dictionary of all models. It's possible because of extention to the model class found in Basemodels.py - Subscribable model.
    As this allows model[fieldname] to return something
  """
  models = model.objects.all()
  return SerializeInstaced(models)

def SerializeInstaced(modelList):
  returnDict = {}
  for instance in modelList:
    modelDict = {}
    for field in instance._meta.fields:
      modelDict[field.name] = instance[field.name]
    
    returnDict[instance["pk"]] = modelDict
  
  return returnDict


def Deserialize(model, data):  
  """
    Creates a model from data dict

    Creates a model and updates all the values

    Parameters
    ----------
    model : BaseModel.SubscribalbeModel
        The type of model to be creates
    data : dict
        Dictionary with values to filled in model

    Returns
    -------
    Instance of model
        A instanced of the supplied model with fields achording to the supplied Dict
  """
  modelinstace = model()
  return DeserializeInstance(modelInstance, data)
    
def DeserializeInstance(modelInstance, data):
  """
    Creates a model from data dict

    Creates a model and updates all the values

    Parameters
    ----------
    modelInstace : BaseModel.SubscribalbeModel
        instace of a model to be filled
    data : dict
        Dictionary with values to filled in model

    Returns
    -------
    Instance of model
        A instanced of the supplied model with fields achording to the supplied Dict
  """
  for field, value in data.items():
    modelField = modelInstance._meta.get_field(field)
    AssignValue = __MatchFieldModel(modelField, value)
    modelInstance[field] = AssignValue
  
  return modelInstance



def FilterModels(model, Filter):
  result = []
  objects = model.objects.all()
  for instance in objects:
    PassedFilter = True
    for FieldName, value in Filter.items():
      Field = instance._meta.get_field(FieldName)
      ParseValue = __MatchFieldModel(Field, value)
      if instance[FieldName] != ParseValue:
        PassedFilter = False
        break
    if PassedFilter:
      result.append(instance)

  return result

### Internal functions these function should not be called from outside of this module. They should be private. If you need to call them move them up to the public functions 
def __MatchFieldModel(Field, Value: str):
  """
    Matches the value such that it fit inside of the Field

    Because the JSON parser just parse everything as strings, This function ensures that the valye is type correct
    Here are the implemented Fields:
      - AutoField - int
      - BigAutoField - int
      - BooleanField - Bool
      - Charfield - str
      - DateField - datetime Date object - Not implemented
      - DateTimeField - datetime Datetime object - Not implemented
      - FloatField - float
      - Foriegnkey - Django model object
      - IntegerField - int
      - IntergerChocies - int
      - TimeField - datetime Time Object - Not implemented

    Parameters
    ----------
    Field : Django.Field
        Field for which value are supposed to fit inside
    Value : str
        string representation of value that should go in Field

    Returns
    -------
    Type converted Value

    Raises
    -------
    Type errors if the underlying conversion fails, or it can't find the object, if it's a foreign key
  """
  if isinstance(Field, AutoField):
    return int(Value)
  if isinstance(Field, BigAutoField):
    return int(Value)
  if isinstance(Field, BooleanField):
    return ParseBool(Value)
  if isinstance(Field, CharField):
    return Value
  if isinstance(Field, ForeignKey):
    targetmodel = Field.related_model
    parsedValue = __MatchFieldModel(targetmodel._meta.pk, Value)
    return targetmodel.objects.get(pk=parsedValue)
  if isinstance(Field, FloatField):
    return float(Value)
  if isinstance(Field, IntegerField):
    return int(Value)
  if isinstance(Field, IntegerChoices):
    return int(Value)



  raise NotImplemented(f" Field type: {type(Field)} Are not supported")
