import { useWebsocket } from "~/contexts/tracer_shop_context";
import { useOnEnter } from "~/effects/on_enter";

/**
 * This function binds
 * @param {Object} props
 * @param {() => Boolean | [Boolean, any]} props.validate - Function that validate the
 * @param {(any) => undefined} props.callback - function that can respond to websocket result
 */
export function useCommitObject({
  validate,
  temp_object,
  object_type,
  callback = () => {}
}){
  const websocket = useWebsocket()
  function commitFunction(){
    const validateOutput = validate();

    let valid, formattedObject;

    if(typeof validateOutput === "boolean"){
      valid = validateOutput
      formattedObject = temp_object
    } else {
      [valid, formattedObject] = validateOutput;
    }

    if(!valid){
      return;
    }

    const tempObjectExists = temp_object.id !== undefined
                            && temp_object.id !== null
                            && 0 <= temp_object.id;

    const websocketFunction = tempObjectExists ?
        websocket.sendEditModel.bind(websocket)
      : websocket.sendCreateModel.bind(websocket);

    return websocketFunction(object_type, formattedObject).then(
      (response) => callback(response)
    )
  }

  useOnEnter(commitFunction);
}