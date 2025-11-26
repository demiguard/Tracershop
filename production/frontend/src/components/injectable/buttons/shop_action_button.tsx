/** So my class with class method doesn't work, dunno if it's just react or
 * what ever.
 *
 * So we got a lot duplicated code...
 *
 */

import React from "react";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { DeleteButton } from "~/components/injectable/delete_button";
import { ClickableIcon, DeliveryIcon } from "~/components/injectable/icons";
import { ActivityOrder, InjectionOrder, IsotopeOrder } from "~/dataclasses/dataclasses";
import { datify } from "~/lib/chronomancy";
import { ORDER_STATUS } from "~/lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_INJECTION_ORDER, DATA_ISOTOPE_ORDER } from "~/lib/shared_constants";
import { OrderType } from "~/lib/types";
import { openActivityReleasePDF, openInjectionReleasePDF } from "~/lib/utils";

function BaseActionButton({
  releaseOnClick,
  canEdit,
  isDirty,
  callback,
  validate,
  order,
  datatype,
  ...rest
}){
  switch(order.status){
    case ORDER_STATUS.RELEASED:
      return <DeliveryIcon order={order} {...rest} />
    case ORDER_STATUS.ORDERED:
      if(!canEdit){
        return (<div {...rest}></div>)
      }

      if(!isDirty){
        return (<DeleteButton
          object={order}
          object_type={datatype}
          {...rest}
        />);
      }
      // DELIBERATE FALL THROUGH!
    case ORDER_STATUS.AVAILABLE:
      return <CommitIcon
        validate={validate}
        callback={callback}
        temp_object={order}
        object_type={datatype}
        add_image="/static/images/cart.svg"
        {...rest}
      />
    default:
      return (<div {...rest}></div>);
  }
}


function IsotopeActionButton({order, validate, callback, isDirty, canEdit, ...rest}){
  return (
    <BaseActionButton
      order={order}
      datatype={DATA_ISOTOPE_ORDER}
      releaseOnClick={() => {}}
      validate={validate}
      callback={callback}
      isDirty={isDirty}
      canEdit={canEdit}
      {...rest}
    />
  );
}

function ActivityActionButton({
  order,
  validate,
  callback,
  isDirty,
  canEdit,
  ...rest
}){
  function onRelease(){
    openActivityReleasePDF(
      order.ordered_activity,
      datify(order.delivery_date)
    );
  }

  return <BaseActionButton
    order={order}
    datatype={DATA_ACTIVITY_ORDER}
    releaseOnClick={onRelease}
    validate={validate}
    callback={callback}
    isDirty={isDirty}
    canEdit={canEdit}
    {...rest}
  />;
}

function InjectionActionButton({
  order, validate, callback, isDirty, canEdit, ...rest
}){
  function onRelease(){
    openInjectionReleasePDF(order);
  }

  return <BaseActionButton
    order={order}
    datatype={DATA_INJECTION_ORDER}
    releaseOnClick={onRelease}
    validate={validate}
    callback={callback}
    isDirty={isDirty}
    canEdit={canEdit}
    {...rest}
  />
}

type ShopActionButtonProps = {
  order : OrderType
  validate : any,
  callback? : any,
  isDirty : boolean,
  canEdit? : boolean,
}

export function ShopActionButton({
    order,
    validate,
    isDirty,
    callback = () => Promise.resolve(),
    canEdit = false,
    ...rest
  } : ShopActionButtonProps) {

  switch (true) {
    case order instanceof IsotopeOrder: {
      return <IsotopeActionButton
        order={order}
        validate={validate}
        callback={callback}
        isDirty={isDirty}
        canEdit={canEdit}
        {...rest}
      />
    }
    case order instanceof ActivityOrder: {
      return <ActivityActionButton
        order={order}
        validate={validate}
        callback={callback}

        isDirty={isDirty}
        canEdit={canEdit}
        {...rest}
      />
    }
    case order instanceof InjectionOrder: {
      return (
      <InjectionActionButton
        order={order}
        validate={validate}
        callback={callback}
        isDirty={isDirty}
        canEdit={canEdit}
        {...rest}
      />)
    }
    default:
      throw { error : "Order is not an order" };
  }
}