import { Booking, MODELS } from "../dataclasses/dataclasses";
import { ParseJSONstr } from "./formatting";

function serialize_instance(modelType, skeleton){
  // So the idea here is that all of the key will be initialized with
  // undefined then will be overwritten in the function.
  const newModel = new modelType();
  if (!('pk' in skeleton)){
    console.error("Missing Primary key in: ", skeleton)
    console.error("Did you pass an object of the type?")
  }
  newModel.id = skeleton.pk;
  if (!('fields' in skeleton)){
    console.error("Missing Fields key in: ", skeleton)
  }
  Object.assign(newModel, skeleton.fields);
  return newModel;
}

export function deserialize_list(modelType, models){
  const serializedList = [];

  for(const model of models){
    const newModel = serialize_instance(modelType, model)
    serializedList.push(newModel);
  }

  return serializedList;
}

export function deserialize_booking(data){
  const parsedJSON = ParseJSONstr(data);
  return deserialize_list(Booking, parsedJSON);

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
