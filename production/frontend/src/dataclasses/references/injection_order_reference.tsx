import { ActivityOrder, InjectionOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order";
import { DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { openInjectionReleasePDF } from "~/lib/utils";

export class InjectionOrderReference extends Order<InjectionOrder> {
  constructor(order: InjectionOrder){
    super(order.status);
  }

  get datatype () {
    return DATA_ISOTOPE_ORDER;
  }

  get releaseOnClick(){
    return openInjectionReleasePDF(this.order);
  }
}
