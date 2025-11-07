import { ORDER_STATUS } from "../constants";
import { OrdersType } from "../types";

export class OrderCollection {
  orders: OrdersType

  #minimum_status: number

  constructor(orders : OrdersType){
    this.orders = orders;

    this.#minimum_status = ORDER_STATUS.AVAILABLE
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

  getVials(){
    return [];
  }

  getVialType(){
    return ""
  }
}