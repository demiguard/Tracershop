/** So my class with class method doesn't work, dunno if it's just react or
 * what ever.
 *
 * So we got a lot duplicated code...
 *
 */

import React from "react";
import { CommitButton } from "~/components/injectable/commit_button";
import { DeleteButton } from "~/components/injectable/delete_button";
import { ClickableIcon } from "~/components/injectable/icons";
import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses";
import { datify } from "~/lib/chronomancy";
import { ORDER_STATUS } from "~/lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { OrderType } from "~/lib/types";
import { openActivityReleasePDF } from "~/lib/utils";

function BaseActionButton({
  label,
  releaseOnClick,
  canEdit,
  isDirty,
  callback,
  validate,
  order,
  datatype
}){
  switch(order.status){
    case ORDER_STATUS.RELEASED:
      return <ClickableIcon
        label={label}
        src="/static/images/delivery.svg"
        onClick={releaseOnClick}
      />
    case ORDER_STATUS.ORDERED:
      if(!canEdit){
        return (<div aria-label={label}></div>)
      }

      if(!isDirty){
        return (<DeleteButton
          label={label}
          object={order}
          object_type={datatype}
        />);
      }
      // DELIBERATE FALL THROUGH!
    case ORDER_STATUS.AVAILABLE:
      return <CommitButton
        label={label}
        validate={validate}
        callback={callback}
        temp_object={order}
        object_type={datatype}
        add_image="/static/images/cart.svg"
      />
    default:
      return (<div aria-label={label}></div>);
  }
}


function IsotopeActionButton({order, label, validate, callback, isDirty, canEdit}){
  return (
    <BaseActionButton
      order={order}
      datatype={DATA_ISOTOPE_ORDER}
      label={label}
      releaseOnClick={() => {}}
      validate={validate}
      callback={callback}
      isDirty={isDirty}
      canEdit={canEdit}
    />
  );
}

function ActivityActionButton({order, label, validate, callback, isDirty, canEdit}){
  function onRelease(){
    openActivityReleasePDF(
      order.ordered_activity,
      datify(order.delivery_date)
    );
  }

  return <BaseActionButton
    order={order}
    datatype={DATA_ACTIVITY_ORDER}
    label={label}
    releaseOnClick={onRelease}
    validate={validate}
    callback={callback}
    isDirty={isDirty}
    canEdit={canEdit}
  />;
}


type ShopActionButtonProps = {
  order : OrderType
  label? : any,
  validate : any,
  callback? : any,
  isDirty : boolean,
  canEdit? : boolean,
}

export function ShopActionButton({order,
    label,
    validate,
    isDirty,
    callback = () => {},
    canEdit = false,
  } : ShopActionButtonProps) {

  switch (true) {
    case order instanceof IsotopeOrder: {
      return <IsotopeActionButton
        order={order}
        validate={validate}
        callback={callback}
        label={label}
        isDirty={isDirty}
        canEdit={canEdit}
      />
    }
    case order instanceof ActivityOrder: {
      return <ActivityActionButton
        order={order}
        validate={validate}
        callback={callback}
        label={label}
        isDirty={isDirty}
        canEdit={canEdit}
      />
    }
    default:
      throw { error : "Order is not an order" };
  }
}