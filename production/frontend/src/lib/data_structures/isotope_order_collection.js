import { IsotopeDelivery, IsotopeOrder, TracershopState } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";


export class IsotopeOrderCollection {
  #minimum_status // Minimum status of all the orders
  delivery

  /** A collection of Isotope orders, that
   *
   * @param {Array<IsotopeOrder>} orders
   * @param {IsotopeDelivery} delivery
   * @param {TracershopState} state
   */
  constructor(orders, delivery, state){
    this.#minimum_status = ORDER_STATUS.EMPTY;
    this.delivery = delivery;

    for(const order of orders){
      this.#minimum_status = Math.min(order.status, this.#minimum_status);
    }
  }

  get minimum_status(){
    return this.#minimum_status;
  }
}