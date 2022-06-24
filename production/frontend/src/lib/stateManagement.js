export function changeState(stateKeyWord, This){
  const returnFunction = (event) => {
    const newState = {...This.state};
    newState[stateKeyWord] = event.target.value;
    This.setState(newState);
  }
  return returnFunction.bind(This)
}