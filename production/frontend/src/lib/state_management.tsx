import { RecoverableError } from "~/lib/error_handling";
import { TracershopDataClass } from "~/lib/types";



export function changeState(stateKeyWord, This){
  const returnFunction = (event) => {
    const newState = {...This.state};
    newState[stateKeyWord] = event.target.value;
    This.setState(newState);
  }
  return returnFunction.bind(This);
}

/** Toggles a state parameter between true and false
 *  The new value is dependant on the current state
 *
 * @param {String} stateKeyWord - Keyword of state
 * @returns callable function
 */
export function toggleState(stateKeyWord, This){
  const returnFunction = (event) => {
    const newState = {...This.state};
    const oldValue = newState[stateKeyWord];
    newState[stateKeyWord] = !oldValue;
    This.setState(newState);
  }
  return returnFunction.bind(This);
}

/**
 * shorthand for (event) => {stateFunction(event.target.value)}
 * Note this will always be a string, so you have do some magic on the other end
 * @param {CallableFunction} stateFunction - the setState function related to variable
 * @returns {CallableFunction}
 */
export function setStateToEvent(stateFunction, formatFunction=undefined){
  return (event) => {
    const value = formatFunction ? formatFunction(event.target.value) : event.target.value;
    stateFunction(value);
  }
}

/**
 * Shorthand for (event) => {stateFunction({...obj, [keyword] : event.target.value})}
 * Useful for setting objects
 */
export function setTempObjectToEvent(stateFunction: React.Dispatch<React.SetStateAction<object>>, keyword : string, formatFunction?: (a: any) => any){
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatFunction ? formatFunction(event.target.value) : event.target.value;
    stateFunction(obj => {return {...obj, [keyword] : value}});
  }
}


type SetTempClassToEventArgs<T extends TracershopDataClass> = {
  stateFunction : React.Dispatch<React.SetStateAction<T>>
  keyword : string,
  formatFunction? : (arg : string) => any,
  errorFunction? : React.Dispatch<React.SetStateAction<RecoverableError>>
}

export function setTempClassToEvent<T extends TracershopDataClass>({
  stateFunction,
  keyword,
  formatFunction = (arg) => arg,
  errorFunction = (arg) => {}
} : SetTempClassToEventArgs<T>){
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatFunction(event.target.value);

    stateFunction(old => {
      const copy = old.copy();

      copy[keyword] = value;

      return copy
    });

    errorFunction(new RecoverableError());
  }

}

/**
 *
 * @param {*} stateFunction
 * @param {*} id
 * @param {*} keyword
 * @returns
 */
export function setTempMapToEvent(stateFunction, id, keyword, formatFunction){
  return (event) => {
    stateFunction(oldMap => {
      const value = formatFunction ? formatFunction(event.target.value) : event.target.value;
      const newObject = oldMap.get(id).copy();
      const newMap = new Map(oldMap);
      newObject[keyword] = value;
      newMap.set(id, newObject);
      return newMap;
    })
  }
}

/**
 *
 * @param {*} stateFunction
 * @param {*} id
 * @param {*} keyword
 * @returns
 */
export function setTempObjectMapToEvent(stateFunction, id, keyword){
  return (event) => {
    stateFunction(oldMap => {
      const newObject = {...oldMap.get(id)};
      const newMap = new Map(oldMap);
      newObject[keyword] = event.target.value;
      newMap.set(id, newObject);
      return newMap;
    })
  }
}

/**
 * @template T
 * @callback TConstructor
 * @returns {T | null}
 */

/**
 * This add an object to constructed by the nConstructor.
 * @template T
 * @param {Map<Number, T>} map
 * @param {TConstructor<T>} nConstructor
 * @returns {Map<Number, T>}
 */
export function appendNewObject(map, nConstructor){
  const stateMap = new Map(map);
  const obj = nConstructor();
  if (obj != null){
    stateMap.set(-1, obj);
  }
  return stateMap
}

export function set_state_error(stateFunction, id, error){
  stateFunction(oldErrors => {
    const newErrors = new Map(oldErrors);
    newErrors.set(id, error);
    return newErrors;
  })
}

export function reset_error(stateFunction, id){
  stateFunction(oldErrors => {
    if (oldErrors.has(id)){
      const newErrors = new Map(oldErrors);
      newErrors.delete(id);
      return newErrors;
    } else {
      return oldErrors;
    }
  });
}


export function reset_sub_error(stateFunction, id, error_key_word){
  stateFunction(oldErrors => {
    if (oldErrors.has(id)){
      const newErrors = new Map(oldErrors);
      const newError = newErrors.get(id);
      newError[error_key_word] = "";
      newErrors.set(id, newError);
      return newErrors;
    } else {
      return oldErrors
    }
  })
}

export const TOGGLE_ACTIONS = {
  ADD : "add",
  REMOVE : "remove",
}

export function toggleSetState(stateFunction, id, action){
  if(action === TOGGLE_ACTIONS.ADD){
    return () => {
      stateFunction(oldSet => {
        const newSet = new Set(oldSet);
        newSet.add(id);
        return newSet;
      })
    }
  } else if(action === TOGGLE_ACTIONS.REMOVE){
    return () => {
      stateFunction(oldSet => {
        const newSet = new Set(oldSet);
        newSet.delete(id);
        return newSet;
      })
    }
  } else {
    return () => {
      stateFunction(oldSet => {
        const newSet = new Set(oldSet);
          if(newSet.has(id)){
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
        return newSet;
      })
    }
  }
}