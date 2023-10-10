import React, { createContext, useContext, useReducer } from 'react';
import { TracerWebSocket } from '../lib/tracer_websocket';
import { TracershopState, User } from '../dataclasses/dataclasses';

const StateContext = createContext(TracershopState);
const DispatchContext = createContext({});
const WebsocketContext = createContext(TracerWebSocket);

export function StateContextProvider({children, value}) {
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}
export function DispatchContextProvider({children, value}) {
  return <DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>
}
export const WebsocketContextProvider = ({children, value}) => {
  return <WebsocketContext.Provider value={value}>{children}</WebsocketContext.Provider>
}


/**
 * 
 * @returns 
 */
export function useTracershopState() {
  return useContext(StateContext);
}

export function useTracershopDispatch(){
  return useContext(DispatchContext);
}

/**
 * 
 * @returns {TracerWebSocket}
 */
export function useWebsocket(){
  return useContext(WebsocketContext)
}

export class ReducerAction {}

/**
 * An action to update the global state with 
 */
export class UpdateCurrentUser extends ReducerAction {
  /** @type {User} */ newUser

  constructor(newUser) {
    super();
    this.newUser = newUser;
  }
}

export class UpdateState extends ReducerAction {
  newState
  /** @type {Boolean} */refresh

  /**
   * An action to update the global tracershop state
   * @param {Any} newState - the new state
   * @param {Boolean} refresh - if
   */
  constructor(newState, refresh){
    super();
    this.newState = newState;
    this.refresh = refresh;
  }
}

export class DeleteState extends ReducerAction {
  constructor(dataType, element_id){
    super();
    this.dataType = dataType;
    this.element_id = element_id;
  }
}

/**
 * 
 * @param {TracershopState} state 
 * @param {ReducerAction} action 
 * @returns {TracershopState}
 */
function tracershopReducer(state, action){
  // Note that switch statements here do not work because the typing checker
  if(action instanceof UpdateCurrentUser ){
    return Object.assign(TracershopState.prototype, {...state, logged_in_user : action.newUser});
  }

  if(action instanceof UpdateState ){
    const newState = Object.assign(TracershopState.prototype, {...state});

    for (const key of Object.keys(action.newState)){
      let oldStateMap = appState[key];
      if(action.refresh){
        oldStateMap = null
      }
      const modelMap = ParseDjangoModelJson(state[key], oldStateMap);
      newState[key] = modelMap
      db.set(key, modelMap)
    }
    this.setState(appState);

    return newState
  }
  if(action instanceof DeleteState){

    const newState = {...state}
    const newStateMap = new Map(newState[action.dataType])
    if (action.element_id instanceof Array){
      for(const id of action.element_id){
        newStateMap.delete(id);
      }
    } else {
      newStateMap.delete(action.element_id);
    }
    newState[action.dataType] = newStateMap;
    return newState
  }

  throw "Unknown action"
}


export function TracerShopContext({children}){
  function getDatabaseMap(databaseField){
    const dbMap = db.get(databaseField);
    if(!dbMap){
      return new Map();
    }
    return dbMap;
  }


  let user = db.get(DATABASE_CURRENT_USER)
  if(user && !(user instanceof User)){
    user = new User(user, user.id ,user.username, user.user_group, user.active);
  } else {
    user = new User();
  }
  const initial_state = new TracershopState(user);

  for(const keyword of Object.keys(MODELS)){
    state[keyword] = getDatabaseMap(keyword)
  }

  const tracerWebSocket = new TracerWebSocket(
    new WebSocket("ws://" + window.location.host + "/ws/"),
    dispatch
  );

  const [state, dispatch] = useReducer(tracershopReducer, initial_state)

  return(
    <StateContext.Provider value={state}>
      <DispatchContext value={dispatch}>
        <WebsocketContext.Provider value={tracerWebSocket}>
          {children}
        </WebsocketContext.Provider>
      </DispatchContext>
    </StateContext.Provider>
  );
}

