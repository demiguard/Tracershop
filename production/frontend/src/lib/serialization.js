import { MODELS } from "../dataclasses/dataclasses";
import { ParseJSONstr } from "./formatting";

export function deserialize_list(modelType, models){
  const serializedList = [];

  for(const model of models){
    const newModel = new modelType();
    newModel.id = model.pk;
    Object.assign(newModel, model.fields);
    serializedList.push(newModel);
  }

  return serializedList;
}
export function deserialize_map(modelType, models, oldMap){
  const newMap = new Map(oldMap);

  for(const model of models){
    const newModel = new modelType();
    newModel.id = model.pk;
    Object.assign(newModel, model.fields);
    newMap.set(newModel.id, newModel);
  }

  return newMap
}

export function deserialize(inputJSON){
  const parsedJSON = ParseJSONstr(inputJSON);
  const returnObject = {};

  for(const modelTypeIdentifier of Object.keys(parsedJSON)){
    returnObject[modelTypeIdentifier] = deserialize_list(
      MODELS[modelTypeIdentifier],
      parsedJSON[modelTypeIdentifier]
    );
  }
  return returnObject;
}


export function deserialize_single(inputJSON){
  const parsedJSON = ParseJSONstr(inputJSON)

  for(const modelTypeIdentifier of Object.keys(parsedJSON)){
    return deserialize_list(MODELS[modelTypeIdentifier], parsedJSON[modelTypeIdentifier])[0];
    }
}

export function clone(obj, objectType){
  const newModel = new MODELS[objectType];
  Object.assign(newModel, obj);
  return newModel;
}
