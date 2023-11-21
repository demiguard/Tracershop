import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { TracerWebSocket } from '../lib/tracer_websocket';
import { MODELS, TracershopState, User } from '../dataclasses/dataclasses';
import { ReducerAction, UpdateCurrentUser, UpdateState, DeleteState } from '~/lib/websocket_actions';
import { db } from '~/lib/local_storage_driver';
import { DATABASE_CURRENT_USER } from '~/lib/constants';
import { ParseDjangoModelJson } from '~/lib/formatting';


const StateContext = createContext(new TracershopState());
const DispatchContext = createContext({});
const WebsocketContext = createContext(TracerWebSocket);

export function StateContextProvider({children, value}) {
  return (<StateContext.Provider value={value}>{children}</StateContext.Provider>);
}
export function DispatchContextProvider({children, value}) {
  return (<DispatchContext.Provider value={value}>{children}</DispatchContext.Provider>);
}
export const WebsocketContextProvider = ({children, value}) => {
  return (<WebsocketContext.Provider value={value}>{children}</WebsocketContext.Provider>);
}

/**
 * Custom hook that gets the global database state
 * @returns {TracershopState}
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
/**
 * 
 * @param {TracershopState} state 
 * @param {ReducerAction} action 
 * @returns {TracershopState}
 */
function tracershopReducer(state, action){
  // Note that switch statements here do not work because the typing checker
  if(action instanceof UpdateCurrentUser ){
    const newState = Object.assign(new TracershopState(), state);
    newState.logged_in_user = action.newUser;

    return newState;
  }

  if(action instanceof UpdateState ){
    const newState = Object.assign(new TracershopState(), state);

    for (const key of Object.keys(action.newState)){
      let oldStateMap = newState[key];
      if(action.refresh){
        oldStateMap = null;
      }
      const modelMap = ParseDjangoModelJson(action.newState[key], oldStateMap, key);
      newState[key] = modelMap;
      db.set(key, modelMap);
    }

    return newState;
  }
  if(action instanceof DeleteState){
    const newState = Object.assign(new TracershopState(), state);
    const newStateMap = new Map(newState[action.dataType]);
    if (action.element_id instanceof Array){
      for(const id of action.element_id){
        newStateMap.delete(id);
      }
    } else {
      newStateMap.delete(action.element_id);
    }
    newState[action.dataType] = newStateMap;
    return newState;
  }

  throw "Unknown action";
}


export function TracerShopContext({children}){
  function getDatabaseMap(databaseField){
    const /**@type {Map} */ dbMap = db.get(databaseField);
    if(!dbMap){
      return new Map();
    }

    if(databaseField in MODELS){
      const Model = MODELS[databaseField];
      const serializedMap = new Map();
      for(const rawObject of dbMap.values()){
        const serializedObject = new Model();
        Object.assign(serializedObject, rawObject);
        serializedMap.set(serializedObject.id, serializedObject);
      }

      return serializedMap;
    } else {
      return dbMap;
    }
  }


  let user = db.get(DATABASE_CURRENT_USER);
  if(user && !(user instanceof User)){
    user = new User(user, user.id ,user.username, user.user_group, user.active);
  } else {
    user = new User();
  }
  const initial_state = new TracershopState(user);

  for(const keyword of Object.keys(MODELS)){
    initial_state[keyword] = getDatabaseMap(keyword);
  }
  const [state, dispatch] = useReducer(tracershopReducer, initial_state);
  // You have to use a useRef and a useEffect to ensure that the websocket is recreated
  // or can be refereed to, if there's a rerender.
  let websocket = useRef(null);
  useEffect(() => { websocket.current = new TracerWebSocket(
    new WebSocket("ws://" + window.location.host + "/ws/"),
    dispatch)},[]);

  return(
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <WebsocketContext.Provider value={websocket.current}>
          {children}
        </WebsocketContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

