import { ORDER_STATUS } from "~/lib/constants";

/**
 * @typedef {{
 *  label : string
 * }} CommitButtonArgs
 */


export class Order {
  /** @type {ORDER_STATUS} */ #status

  constructor(status){
    this.#status = status
  }

  get status() {
    return this.#status;
  }

  //#region INTERFACE
  /**
   *

   * This class return the button / Icon that the user can click on to do
   * something: i.e. Order, See the Release document page, Edit it
   * @param {CommitButtonArgs} props
   * @returns {React.Component}
   */
  commitButton(props){
    throw {
      error : `This class doesn't have implemented the commit button function`,
      object : this
    };
  }
}

export { CommitButtonArgs };