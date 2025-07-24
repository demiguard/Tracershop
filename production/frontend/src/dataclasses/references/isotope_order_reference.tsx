
import React, { JSX } from "react";
import { CommitButton } from "~/components/injectable/commit_button";
import { DeleteButton } from "~/components/injectable/delete_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { IsotopeOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order";
import { ORDER_STATUS } from "~/lib/constants";
import { DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { ShopActionButtonArgs } from "~/lib/types";

export class IsotopeOrderReference extends Order<IsotopeOrder> {
  constructor(order : IsotopeOrder ){
    super(order);
  }

  get datatype(): string {
    return DATA_ISOTOPE_ORDER;
  }

  shopActionButton({
    label, canEdit, is_dirty, validate, callback
  }: ShopActionButtonArgs): JSX.Element {
    switch (this.status) {
      case ORDER_STATUS.RELEASED:
        return <ClickableIcon
          label={label}
          src="/static/images/delivery.svg"
          onClick={() => {}}
        />
      case ORDER_STATUS.ORDERED:
        if(!canEdit){
          return (<div aria-label={label}></div>)
        }
        if(!is_dirty){
          return (<DeleteButton
            label={label}
            object={this.order}
            object_type={DATA_ISOTOPE_ORDER}
          />);
        }
      // DELIBERATE FALL THROUGH!
      case ORDER_STATUS.AVAILABLE:
        return <CommitButton
          label={label}
          validate={validate}
          callback={callback}
          temp_object={this.order}
          object_type={DATA_ISOTOPE_ORDER}
          add_image="/static/images/cart.svg"
        />
      default:
        return (<div aria-label={label}></div>);
    }
  }

}
