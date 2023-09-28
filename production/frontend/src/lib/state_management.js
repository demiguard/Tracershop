
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