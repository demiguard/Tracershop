import { TracerWebSocket } from "~/lib/tracer_websocket";

/** Empty base class / interface for typing  */
export class ReducerAction {}

/** Message for updating the active user using the site */
export class UpdateCurrentUser extends ReducerAction {
  /** @type {User} */ newUser

  constructor(newUser) {
    super();
    this.newUser = newUser;
  }
}

/** Message for making a local update to the TracershopState */
export class UpdateState extends ReducerAction {
  /** @type {Object} Object with a DATA_XXX and a list of those objects */ newState
  /** @type {Boolean} Flag indicating to discard old data */ refresh

  /**
   * An action to update the global tracershop state
   * @param {Object} newState - the new state
   * @param {Boolean} refresh - if
   */
  constructor(newState, refresh){
    super();
    this.newState = newState;
    this.refresh = refresh;
  }
}

/** Message for deleting instances in the Tracershop State  */
export class DeleteState extends ReducerAction {
  /** @type {String} @desc DATA_XXXX keyword for determining which type of object to delete */ dataType

  /**
   *
   * @param {String} dataType
   * @param {Array<Number>} element_id
   */
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

export class UpdateWebsocketConnectionState extends ReducerAction {
  constructor(newReadyState){
    super();
    this.readyState = newReadyState;
  }
}

export class UpdateError extends ReducerAction {
  constructor(error){
    super();
    this.error = error;
  }
}
