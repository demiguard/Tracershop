### So this file and Class is mostly made because I couldn't figure out how to implement this class using a Djangos build in frame work
### Maybe I'm just stupid and can't read an API, So feel free to replace this with an implementation such that 
### So in general the stratigy is too transform json objects and list of models back and forth 
import json
from types import list

### Wrapper function intented to work as an interface. So if you replace this module with something else you should 

def SerializeAll(model):
  """
    This function creates a dictionary of all models. It's possible because of extention to the model class found in Basemodels.py - Subscribable model.
    As this allows model[fieldname] to return something
  """
  returnDict = {}

  models = model.objects.all()
  for instance in models:
    modelDict = {}
    for field in x._meta.fields:
      modelDict[field.name] = instance[field.name]
    
    returnDict[instance["pk"]] = modelDict
  
  return returnDict

def SerializeInstaced(modelList):
  returnDict = {}
  for instance in modelsList:
    modelDict = {}
    for field in x._meta.fields:
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
    modelInstance[field] = value    
  
  return modelInstance

### Internal functions these function should not be called from outside of this module. They should be private. If you need to call them move them up to the public functions 
