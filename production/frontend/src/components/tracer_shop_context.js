import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { TracerWebSocket } from '../lib/tracer_websocket';
import { MODELS, TracershopState, User } from '../dataclasses/dataclasses';
import { ReducerAction, UpdateCurrentUser, UpdateState, DeleteState, UpdateToday, UpdateWebsocketConnectionState } from '~/lib/state_actions';
import { db } from '~/lib/local_storage_driver';
import { DATABASE_CURRENT_USER, DATABASE_TODAY } from '~/lib/constants';
import { ParseDjangoModelJson } from '~/lib/formatting';
import { datify } from '~/lib/chronomancy';
import { DATA_BOOKING, EXCLUDED_STATE_MODELS, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE } from '~/lib/shared_constants';
import { Logs } from '~/lib/logs';

const StateContext = createContext(new TracershopState());
const DispatchContext = createContext({});
const WebsocketContext = createContext(TracerWebSocket);
const LogsContext = createContext(new Logs())

const EXCLUDED_FROM_LOCAL_STORAGE = [
  DATA_BOOKING
]

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

/** Returns the websocket that should be used throughout the site.
 *  If null, then websocket have been established yet
 * @returns {TracerWebSocket | null}
 */
export function useWebsocket(){
  return useContext(WebsocketContext);
}
/**
 *
 * @param {TracershopState} state
 * @param {ReducerAction} action
 * @returns {TracershopState}
 */
export function tracershopReducer(state, action){
  const newState = Object.assign(new TracershopState(), state);
  // Note that switch statements here do not work because the typing checker
  if(action instanceof UpdateCurrentUser){
    newState.logged_in_user = action.newUser;

    return newState;
  }

  if(action instanceof UpdateState ){
    for (const key of Object.keys(action.newState)){
      let oldStateMap = newState[key];
      if(action.refresh){
        oldStateMap = null;
      }
      const modelMap = ParseDjangoModelJson(action.newState[key], oldStateMap, key);
      newState[key] = modelMap;
      if(!EXCLUDED_FROM_LOCAL_STORAGE.includes(key)){
        db.set(key, modelMap);
      }
    }

    return newState;
  }

  if(action instanceof DeleteState){
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

  if(action instanceof UpdateToday){
    newState.today = datify(action.updatedToday);
    if(action.websocket){
      action.websocket.send({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_GET_ORDERS,
        [WEBSOCKET_DATE] : newState.today
      });
    }
    return newState;
  }
  if(action instanceof UpdateWebsocketConnectionState){
    newState.readyState = action.readyState;
    return newState;
  }

  throw "Unknown action";
}

export function TracerShopContext({children}){
  let websocket = useRef(null);
  useEffect(() => { websocket.current = new TracerWebSocket(
    new WebSocket("ws://" + window.location.host + "/ws/"),
    dispatch)
    return () => {
      if(websocket.current !== null){
        websocket.current.close();
      }
      websocket.current = null;
    }
  },[]);

  const user = (
    () => {
      const init_user = db.get(DATABASE_CURRENT_USER);
      if(init_user && !(init_user instanceof User)){
        return new User(init_user, init_user.id ,init_user.username, init_user.user_group, init_user.active);
      } else {
        return new User();
      }
    }
  )();
  const today = new Date();
  const initial_state = new TracershopState(user, today);

  for(const keyword of Object.keys(MODELS)){
    if(EXCLUDED_STATE_MODELS.includes(keyword)){
      continue;
    }
    initial_state[keyword] = getDatabaseMap(keyword);
  }
  const [state, dispatch] = useReducer(tracershopReducer, initial_state);
  // You have to use a useRef and a useEffect to ensure that the websocket is recreated
  // or can be refereed to, if there's a rerender.


  return(
    <WebsocketContext.Provider value={websocket.current}>
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    </WebsocketContext.Provider>
  );
}
