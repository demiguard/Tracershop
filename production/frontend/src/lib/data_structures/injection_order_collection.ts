import { InjectionOrder } from "~/dataclasses/dataclasses";
import { OrderCollection } from "./order_collection";

export class InjectionOrderCollection extends OrderCollection {
  declare orders : Array<InjectionOrder>
}