import React, { JSX } from 'react';
import { ClickableIcon } from "~/components/injectable/icons";
import { ActivityOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order";
import { datify } from "~/lib/chronomancy";
import { ORDER_STATUS } from "~/lib/constants";
import { openActivityReleasePDF } from "~/lib/utils";

import { ShopActionButtonArgs } from "~/lib/types"
import { CommitButton } from '~/components/injectable/commit_button';
import { DATA_ACTIVITY_ORDER } from '~/lib/shared_constants';
import { DeleteButton } from '~/components/injectable/delete_button';

export class ActivityOrderReference extends Order<ActivityOrder> {

  constructor(order: ActivityOrder){
    super(order);
  }

  get datatype() {
    return DATA_ACTIVITY_ORDER;
  }

  get releaseOnClick(){
    return openActivityReleasePDF(
            this.order.ordered_activity,
            datify(this.order.delivery_date)
          );
  }

  shopActionButton({label, validate, callback, is_dirty, canEdit=false} : ShopActionButtonArgs) : React.ReactNode {
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
