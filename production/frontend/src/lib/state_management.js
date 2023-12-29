
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
export function setStateToEvent(stateFunction){
  return (event) => {stateFunction(event.target.value)}
}

/**
 * Shorthand for (event) => {stateFunction({...obj, [keyword] : event.target.value})}
 * Useful for setting objects
 * @param {CallableFunction} stateFunction
 * @param {String} keyword - The keyword this function should write to
 * @returns {CallableFunction}
 */
export function setTempObjectToEvent(stateFunction, keyword){
  return (event) => {
    stateFunction(obj => {return {...obj, [keyword] : event.target.value}});
  }
}

export function setTempMapToEvent(stateFunction, id, keyword){
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