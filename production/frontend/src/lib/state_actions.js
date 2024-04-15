import { TracerWebSocket } from "~/lib/tracer_websocket";

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

export class UpdateToday extends ReducerAction {
  /**
   * Updated the today attribute of the TracershopState
   * @param {Date} updatedToday
   * @param {TracerWebSocket?} websocket
   */
  constructor(updatedToday, websocket) {
    super()
    this.updatedToday = updatedToday
    this.websocket = websocket
  }
}