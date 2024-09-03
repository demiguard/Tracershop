
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
export function setStateToEvent(stateFunction, formatFunction){
  return (event) => {
    const value = formatFunction ? formatFunction(event.target.value) : event.target.value;
    stateFunction(value);
  }
}

/**
 * Shorthand for (event) => {stateFunction({...obj, [keyword] : event.target.value})}
 * Useful for setting objects
 * @param {CallableFunction} stateFunction
 * @param {String} keyword - The keyword this function should write to
 * @param {CallableFunction | undefined} formatFunction
 * @returns {CallableFunction}
 */
export function setTempObjectToEvent(stateFunction, keyword, formatFunction){
  return (event) => {
    const value = formatFunction ? formatFunction(event.target.value) : event.target.value;
    stateFunction(obj => {return {...obj, [keyword] : value}});
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