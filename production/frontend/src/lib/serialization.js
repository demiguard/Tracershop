import { MODELS } from "../dataclasses/dataclasses";
import { ParseJSONstr } from "./formatting";

function __deserialize_single(modelType, modelList){
  const serializedList = []

  for(const model of modelList){
    const newModel = new modelType()
    newModel.id = model.pk
    Object.assign(newModel, model.fields)
    serializedList.push(newModel)
  }

  return serializedList
}

export function deserialize(inputJSON){
  const parsedJSON = ParseJSONstr(inputJSON)
  const returnObject = {}

  for(const modelTypeIdentifier of Object.keys(parsedJSON)){
    returnObject[modelTypeIdentifier] = __deserialize_single(
      MODELS[modelTypeIdentifier],
      parsedJSON[modelTypeIdentifier]
    )
  }
  return returnObject
}

export function deserialize_single(inputJSON){
  const parsedJSON = ParseJSONstr(inputJSON)

  for(const modelTypeIdentifier of Object.keys(parsedJSON)){
    return __deserialize_single(MODELS[modelTypeIdentifier], parsedJSON[modelTypeIdentifier])[0]
    }

}