import React, { useEffect, useRef, useState } from "react";
import { Card, Collapse, Col, Row } from "react-bootstrap";

import { ActivityOrder } from "../../../dataclasses/dataclasses";
import { dateToDateString, nullParser, renderDateTime } from "../../../lib/formatting";

import { ORDER_STATUS, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE, cssAlignRight, cssCenter } from "../../../lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_ISOTOPE } from "../../../lib/shared_constants.js"
import { ActivityDeliveryIcon, CalculatorIcon, ClickableIcon, StatusIcon } from "../../injectable/icons";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";

import { CalculatorModal } from "../../modals/calculator_modal";
import { combineDateAndTimeStamp } from "~/lib/chronomancy";
import { compareLoosely, nullify, toMapping } from "~/lib/utils";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { ActivityOrderCollection } from "~/lib/data_structures/activity_order_collection";
import { Optional } from "~/components/injectable/optional";
import { CommitButton } from "~/components/injectable/commit_button";
import { appendNewObject, reset_error, setTempMapToEvent, set_state_error } from "~/lib/state_management";
import { useUpdatingEffect } from "~/effects/updating_effect";

function TimeSlotCardHeaderMoved(){
  return(
    <Row>
      <Col>Rykket til tidligere levering</Col>
    </Row>
  );
}

/**
 *
 * @param {{
 *   orderCollection : ActivityOrderCollection
 * }} props
 * @returns
 */
function TimeSlotCardHeaderCancelled({}){
  return (
    <Row>
      <Col>Ordren er Afvist</Col>
    </Row>
  )
}

function TimeSlotCardHeaderEmpty({canOrder, openCalculator}){
  if(canOrder){
    return <Row >
      <Col>Der er ikke bestilt sporestof</Col>
      <Col style={{
        flex : "0 0 fit-content"
      }}>
        <CalculatorIcon openCalculator={openCalculator}/>
      </Col>
    </Row>
  }

  return (
    <Row>
      <Col>Der er ikke bestilt sporestof og deadlinen er overskredet</Col>
    </Row>
  );
}

/**
 *
 * @param {{
 *   orderCollection : ActivityOrderCollection,
 *   openCalculator : CallableFunction
 * }} props
 * @returns
 */
function TimeSlotCardHeaderOrdered({orderCollection, openCalculator}){
  return (
    <Row>
      <Col>Bestilt: {orderCollection.ordered_activity} MBq</Col>
      <Col style={{ flex : "0 0 fit-content" }}>
        <CalculatorIcon openCalculator={openCalculator}/>
      </Col>
    </Row>
  );
}

/**
 *
 * @param {{
 *   orderCollection : ActivityOrderCollection
 * }} param0
 * @returns
 */
function TimeSlotCardHeaderAccepted({orderCollection}){
  return (
    <Row>
      <Col>Bestilt: {orderCollection.ordered_activity} MBq</Col>
    </Row>
  );
}

/**
 * The inner html of the time slot card when the order collection is released.
 * +-------------------------------------+
 * |                                     |
 * |            THIS COMPONENT           |
 * |                                     |
 * +-------------------------------------+
 * there's an assumption that this will only be rendered if
 * orderCollection.minimum_status == RELEASED
 * @param {{
 *  orderCollection : ActivityOrderCollection
 *
 * }} props
 * @returns
 */
export function TimeSlotCardHeaderReleased({
  orderCollection
}){
  let uncorrected_activity = 0;
  for(const vial of orderCollection.vials){
    uncorrected_activity += vial.activity;
  }

  const displayable_uncorrected_activity = Math.floor(uncorrected_activity);
  const displayable_release_time_stamp = (orderCollection.freed_time != null) ?
      renderDateTime(orderCollection.freed_time).substring(0,5)
    : "Ukendt tidspunk!";


  return (
    <Row>
      <Col>Udleveret: {displayable_uncorrected_activity} MBq</Col>
      <Col>Frigivet kl: {displayable_release_time_stamp}</Col>
      <Col style={{ flex : "0 0 fit-content" }}>
        <Optional exists={!orderCollection.moved}>
          <ActivityDeliveryIcon
            label={`delivery-${orderCollection.delivering_time_slot.id}`}
            orderCollection={orderCollection}
          />
        </Optional>
      </Col>
    </Row>
  );
}

function ActivityOrderRow(props){
  return (
    <div></div>
  );
}



/**
* This is a card, representing the users view of ActivityDeliveryTimeSlot
* It contains all ordered
* @param {{
*  timeSlot : ActivityProduction,
*  active_date : Date
*  overhead : Number
*  activityOrders: Array<ActivityOrder>,
*  activityDeadlineValid : Boolean
* }} props - Input props
* @returns {Element}
*/
export function TimeSlotCardActivity({
  timeSlot,
  activityOrders,
  overhead,
  activityDeadlineValid,
}){
  const state = useTracershopState();
  const active_date = state.today;
  const websocket = useWebsocket();

  // Prop extraction
  const dateString = dateToDateString(active_date);

  const production = state.production.get(timeSlot.production_run);
  const tracer = state.tracer.get(production.tracer);
  const canOrder = activityDeadlineValid;
  function newOrderFunction(){
    if(canOrder){
      return new ActivityOrder(
        -1,
        "",
        dateToDateString(active_date),
        ORDER_STATUS.AVAILABLE,
        "",
        timeSlot.id,
        null,
        null,
        null,
        null
      );
    } else {
      return null;
    }
  }

  // IMPLICIT ASSUMPTION! -- You can only move orders between time slots of the
  //same endpoint and tracer (and day, but that assumption is not used here!)
  const displayActivityOrders = activityOrders.filter((order) =>
    order.ordered_time_slot === timeSlot.ID);

  const orderCollection = new ActivityOrderCollection(activityOrders, dateString, timeSlot, state, overhead);

  // State
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [errors, setErrors] = useState(new Map());
  const [orders, setOrders] = useState(
    appendNewObject(toMapping(displayActivityOrders), newOrderFunction)
  ); // I really feel like this is not very readable, but it is compose-able

  // Effects
  useUpdatingEffect(() => {
    const deliverableActivityOrders = activityOrders.filter((order) =>
      order.ordered_time_slot === timeSlot.id
    );
    setOrders(appendNewObject(toMapping(deliverableActivityOrders), newOrderFunction))
  }, [activityOrders]); // Refresh on other users input

  // This Component displays all order in their original positions
  const orderRows = [...orders.values()].map((order, i) => {
    //#region Sub component
    // This is a kind of sub-component, that if this way due to the react engine
    // The prettier thing is probably to move this out as a private module
    //function
    // Functions
    function validate(){
      const [validActivity, numberActivity] = parseDanishPositiveNumberInput(order.ordered_activity, "Aktiviten");
      if(!validActivity){
        set_state_error(setErrors, order.id, numberActivity);
        return [false, {}];
      }

      reset_error(setErrors, order.id);

      return [true, {
        ...order,
        ordered_activity : numberActivity,
        comment : nullify(order.comment),
        status : ORDER_STATUS.ORDERED,
      }];
    }

    function deleteOrder(){
      websocket.sendDeleteModel(DATA_ACTIVITY_ORDER, [order]);
    }

    // Rewrite
    function commitCallBack(){
      setOrders(old => {
        const newOrders = new Map(old);
        const newOrder = order.copy();
        newOrder.ordered_activity = "";
        newOrder.comment = "";
        newOrders.set(order.id, order);
        return newOrders;
      })
    }

    const error = errors.has(order.id) ? errors.get(order.id) : ""
    const ordered = order.status > 0;
    const canEdit = order.status <= 1;
    const changedTemp = state.activity_orders.has(order.id) ?
                          !compareLoosely(order, state.activity_orders.get(order.id))
                        : true;

    const statusIcon = (() => {
      if(orderCollection.minimum_status == ORDER_STATUS.EMPTY){
        return <div></div>
      }
      return <StatusIcon orderCollection={orderCollection}/>
    })()

    const statusInfo = (() => {
      if (order.moved_to_time_slot){
        const movedTimeSlot = state.deliver_times.get(order.moved_to_time_slot)
        return `Rykket til ${movedTimeSlot.delivery_time}`;
      } else if (ordered) {
        return `ID: ${order.id}`;
      } else {
        return "Ny ordre";
      }
    })();


    return (
      <Row key={i}>
        <Col xs={1} style={cssCenter}>
          {statusIcon}
        </Col>
        <Col style={cssCenter} xs={1}>
          {statusInfo}
        </Col>
        <Col>
          <TracershopInputGroup label="Aktivitet" error={error} tail={"MBq"}>
            <EditableInput
              canEdit={canEdit}
              data-testid={`activity-${order.id}`}
              value={order.ordered_activity}
              onChange={setTempMapToEvent(setOrders, order.id, 'ordered_activity')}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label="Kommentar">
          <EditableInput
            canEdit={canEdit}
            data-testid={`comment-${order.id}`}
            as="textarea"
            rows={1}
            value={nullParser(order.comment)}
            onChange={setTempMapToEvent(setOrders, order.id, 'comment')}
          />
          </TracershopInputGroup></Col>
        <Col xs={1} style={cssAlignRight}>
          <Optional exists={canEdit && changedTemp}>
            <CommitButton
              label={`commit-${order.id}`}
              temp_object={order}
              validate={validate}
              callback={commitCallBack}
              add_image="/static/images/cart.svg"
              object_type={DATA_ACTIVITY_ORDER}
            />
          </Optional>
          <Optional exists={canEdit && !changedTemp && ordered}>
            <ClickableIcon
              src={"static/images/decline.svg"}
              onClick={deleteOrder}
              label={`delete-order-${order.id}`}
            />
          </Optional>
        </Col>
      </Row>);
  });
  //#region End of sub-component

  function openCalculator(){
    setShowCalculator(true)
  }

  const calculatorProps = {
    [PROP_ACTIVE_DATE] : combineDateAndTimeStamp(active_date,
                                                 timeSlot.delivery_time),
    [DATA_ISOTOPE] : state.isotopes,
    [PROP_ON_CLOSE] : () => {setShowCalculator(false);},
    [PROP_ACTIVE_TRACER] : tracer,
    [PROP_COMMIT] : (activity) => {
      if(orders.has(-1)){
        const order = orders.get(-1).copy();
        order.ordered_activity = Math.floor(activity);
        setOrders(old => {
          const newOrders = new Map(old);
          newOrders.set(-1, order);
          return newOrders;
        })
      }

      setShowCalculator(false);
      setCollapsed(true);
    },
    initial_MBq : 300,
  };

  const header = (() => {
    if(orderCollection.moved){
      return <TimeSlotCardHeaderMoved/>
    }
    switch (orderCollection.minimum_status) {
      case ORDER_STATUS.RELEASED:
        return <TimeSlotCardHeaderReleased orderCollection={orderCollection}/>;
      case ORDER_STATUS.CANCELLED:
        return <TimeSlotCardHeaderCancelled orderCollection={orderCollection}/>;
      case ORDER_STATUS.ACCEPTED:
        return <TimeSlotCardHeaderAccepted orderCollection={orderCollection}/>;
      case ORDER_STATUS.ORDERED:
        return <TimeSlotCardHeaderOrdered orderCollection={orderCollection} openCalculator={openCalculator}/>;
      case ORDER_STATUS.EMPTY:
        return <TimeSlotCardHeaderEmpty canOrder={canOrder} openCalculator={openCalculator}/>;
      default:
        console.error("Unhandled header type");
        return <div>Something should be here, but due to an error it's not</div>
    }

  })();

  return (
  <Card style={{padding : '0px'}}>
    <Optional exists={showCalculator}>
      <CalculatorModal {...calculatorProps}/>
    </Optional>
  <Card.Header>
    <Row>
      <Col xs={1} style={cssCenter}>
        <Optional exists={!!displayActivityOrders.length}>
          <StatusIcon
            label={`status-icon-time-slot-${timeSlot.id}`}
            orderCollection={orderCollection}
          />
        </Optional>
      </Col>
      <Col xs={2} style={cssCenter}>{timeSlot.delivery_time}</Col>
      <Col>
        {header}
      </Col>
      <Col xs={1} style={{
         justifyContent : 'right',
         display : 'flex',
       }}>
         <OpenCloseButton
            open={collapsed}
            label={`open-time-slot-${timeSlot.id}`}
            setOpen={setCollapsed}
         />
       </Col>
     </Row>
   </Card.Header>
   <Collapse in={collapsed}>
     <Card.Body>
       {orderRows}
     </Card.Body>
   </Collapse>
 </Card>);
}
