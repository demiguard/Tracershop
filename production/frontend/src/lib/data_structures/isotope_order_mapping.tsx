import { IsotopeOrder, TracershopState } from "~/dataclasses/dataclasses";
import { ArrayMap } from "~/lib/array_map";

export class IsotopeOrderMapping {
  mapping : ArrayMap<number, IsotopeOrder>

  constructor(orders: Array<IsotopeOrder>){
    this.mapping = new ArrayMap<number, IsotopeOrder>();

    for(const order of orders){
      this.mapping.set(order.destination, order);
    }
  }

  *[Symbol.iterator]() {
    for(const ret of this.mapping){
      yield ret as [number, IsotopeOrder[]];
    }
  }
}
