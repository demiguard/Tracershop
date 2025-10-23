import { ORDER_STATUS, valueof } from "../constants";
import { OrdersType, ValueOf } from "../types";

export class OrderCollection {
  orders: OrdersType

  #minimum_status: number

  constructor(orders : OrdersType){
    this.orders = orders;

    this.#minimum_status = ORDER_STATUS.EMPTY
    for(const order of orders){
      this.#minimum_status = Math.min(this.#minimum_status, order.status);
    }
  }


  /**
   * @desc the minimum status among {@link orders} with the ordering:
   * AVAILABLE < ORDERED < ACCEPTED < RELEASED < CANCELLED < UNAVAILABLE
   */
  get minimum_status(){
    return this.#minimum_status;
  }
}