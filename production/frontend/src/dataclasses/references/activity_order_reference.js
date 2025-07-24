import React from 'react';
import { ClickableIcon } from "~/components/injectable/icons";
import { ActivityOrder } from "~/dataclasses/dataclasses";
import { Order } from "~/dataclasses/references/order_reference";
import { datify } from "~/lib/chronomancy";
import { ORDER_STATUS } from "~/lib/constants";
import { openActivityReleasePDF } from "~/lib/utils";

import { CommitButtonArgs } from "~/lib/types"

export class ActivityOrderReference extends Order {
  /**
   *
   * @param {ActivityOrder} order
   */
  constructor(order){
    super(order.status);
    this.order = order;
  }

  commitButton(props){
    const {label} = props;
    switch(this.status){
      case ORDER_STATUS.RELEASED:
        return <ClickableIcon
          label={label}
          src="/static/images/delivery.svg"
          onClick={openActivityReleasePDF(
            this.order.ordered_activity, datify(this.order.delivery_date))}
        />
      default:
        return (<div aria-label={label}></div>);

    }
  }
}
