import React, { JSX } from "react";
import { CommitButton } from "~/components/injectable/commit_button";
import { DeleteButton } from "~/components/injectable/delete_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses";
import { ActivityOrderReference } from "~/dataclasses/references/activity_order_reference";
import { InjectionOrderReference } from "~/dataclasses/references/injection_order_reference";
import { IsotopeOrderReference } from "~/dataclasses/references/isotope_order_reference";
import { ORDER_STATUS } from "~/lib/constants";
import { ShopActionButtonArgs, OrderType } from "~/lib/types";

export class Order<T = any> {

  constructor(orderArg: T){
    this.order = orderArg;
    console.log(this);
  }
  order: T // Overwritten by subclasses

  get status() {
    //@ts-ignore
    return this.order.status;
  }

  get datatype (): string {
    throw {error : "INTERFACE CLASS DO NOT a datatype"}
  }

  get releaseOnClick(){
    return () => {};
  }

  //#region INTERFACE
  /**
   *
   * Creates the button / Icon that a shop user can click on to do.
   * something: i.e. Order, See the Release document page, Edit the order
   */
  shopActionButton({label, validate, callback, is_dirty, canEdit=false}: ShopActionButtonArgs) : React.ReactNode {
    switch(this.status){
      case ORDER_STATUS.RELEASED:
        return <ClickableIcon
          label={label}
          src="/static/images/delivery.svg"
          onClick={this.releaseOnClick}
        />
      case ORDER_STATUS.ORDERED:
        if(!canEdit){
          return (<div aria-label={label}></div>)
        }

        if(!is_dirty){
          return (<DeleteButton
            label={label}
            object={this.order}
            object_type={this.datatype}
          />);
        }
        // DELIBERATE FALL THROUGH!
      case ORDER_STATUS.AVAILABLE:
        return <CommitButton
          label={label}
          validate={validate}
          callback={callback}
          temp_object={this.order}
          object_type={this.datatype}
          add_image="/static/images/cart.svg"
        />
      default:
        return (<div aria-label={label}></div>);
    }
  }
}
