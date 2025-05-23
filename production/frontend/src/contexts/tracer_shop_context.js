import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { TracerWebSocket } from '../lib/tracer_websocket';
import { MODELS, TracershopState, User } from '../dataclasses/dataclasses';
import { ReducerAction, UpdateCurrentUser, UpdateState, DeleteState, UpdateToday, UpdateWebsocketConnectionState, UpdateError } from '~/lib/state_actions';
import { db } from '~/lib/local_storage_driver';
import { DATABASE_CURRENT_USER, DATABASE_TODAY } from '~/lib/constants';
import { ParseDjangoModelJson } from '~/lib/formatting';
import { datify } from '~/lib/chronomancy';
import { DATA_BOOKING, EXCLUDED_STATE_MODELS, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_TYPE } from '~/lib/shared_constants';
import { Logs } from '~/lib/logs';
import { DerivedContextPyramid } from '~/contexts/derived_contexts';
import { getWebsocketUrl } from '~/lib/utils';

const StateContext = createContext(new TracershopState());
const DispatchContext = createContext({});
const WebsocketContext = createContext(TracerWebSocket);
const LogsContext = createContext(new Logs())

const EXCLUDED_FROM_LOCAL_STORAGE = [
  DATA_BOOKING
]

function getDatabaseMap(databaseField){
  const /**@type {Map} */ dbMap = db.get(databaseField);
  if(!dbMap || !(databaseField in MODELS)){
    return new Map();
  } else {

    const Model = MODELS[databaseField];
    const serializedMap = new Map();
    for(const rawObject of dbMap.values()){
      const serializedObject = new Model();
      Object.assign(serializedObject, rawObject);
      serializedMap.set(serializedObject.id, serializedObject);
    }

    return serializedMap;
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

export function TracerShopContext({
  children, websocket, dispatch, tracershop_state
}){
  // HAIL THE GREAT PYRAMID!
  return(
    <WebsocketContext.Provider value={websocket}>
      <StateContext.Provider value={tracershop_state}>
        <DispatchContext.Provider value={dispatch}>
          <DerivedContextPyramid>
            {children}
          </DerivedContextPyramid>
        </DispatchContext.Provider>
      </StateContext.Provider>
    </WebsocketContext.Provider>
  );
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

  if(action instanceof UpdateState){
    for (const key of Object.keys(action.newState)){
      const modelMap = action.refresh ? new Map() : new Map(newState[key])
      for(const model of action.newState[key]){
        modelMap.set(model.id, model);
      }
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

  if(action instanceof UpdateError){
    newState.error = action.error;
    return newState;
  }

  throw "Unknown action";
}

export function TracerShopContextInitializer({children, websocket_url}){
  const today = new Date();
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
  const initial_state = new TracershopState(user, today);
  for(const keyword of Object.keys(MODELS)){
    if(EXCLUDED_STATE_MODELS.includes(keyword)){
      continue;
    }
    initial_state[keyword] = getDatabaseMap(keyword);
  }
  const [state, dispatch] = useReducer(tracershopReducer, initial_state);
  const websocket = useRef(null);

  const websocketURL = websocket_url ? websocket_url : getWebsocketUrl();

  // The websocket connection must be inside of code that only run once
  useEffect(function initializeWebsocket() {
    websocket.current = new TracerWebSocket(
      new WebSocket(websocketURL),
      dispatch
    )
    return () => {
      if(websocket.current !== null){
        websocket.current.close();
      }
      websocket.current = null;
    }
  },[]);

  return(
    <TracerShopContext
      websocket={websocket.current}
      dispatch={dispatch}
      tracershop_state={state}
      >
      {children}
    </TracerShopContext>
  );
}
