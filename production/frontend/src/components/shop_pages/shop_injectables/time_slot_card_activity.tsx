import React, { useEffect, useRef, useState } from "react";
import { Card, Collapse, Col, Row } from "react-bootstrap";
import { ActivityDeliveryTimeSlot, ActivityOrder } from "../../../dataclasses/dataclasses";
import { dateToDateString, nullParser, renderDateTime } from "../../../lib/formatting";
import { ORDER_STATUS, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE } from "../../../lib/constants";
import { cssAlignRight, cssCenter } from "~/lib/styles";
import { DATA_ACTIVITY_ORDER, DATA_ISOTOPE } from "../../../lib/shared_constants.js"
import { ActivityDeliveryIcon, CalculatorIcon, ClickableIcon, StatusIcon } from "~/components/injectable/icons"
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { CalculatorModal } from "../../modals/calculator_modal";
import { combineDateAndTimeStamp } from "~/lib/chronomancy";
import { compareLoosely, dataClassExists, nullify, toMapping } from "~/lib/utils";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { ActivityOrderCollection } from "~/lib/data_structures/activity_order_collection";
import { Optional } from "~/components/injectable/optional";
import { CommitButton } from "~/components/injectable/commit_button";
import { setStateToEvent } from "~/lib/state_management";
import { useUpdatingEffect } from "~/effects/updating_effect";
import { makeBlankActivityOrder } from "~/lib/blanks";
import { useErrorState } from "~/lib/error_handling";


type ShowOrderRowProps = {
  order : ActivityOrder,
  calculatorActivity : number
}

function ShopOrderRow({order, calculatorActivity}: ShowOrderRowProps){
  const websocket = useWebsocket();
  const state = useTracershopState();

  const [displayActivity, setDisplayActivity] = useState(() => {
    if (dataClassExists(order)){
      return String(order.ordered_activity);
    }

    return String(calculatorActivity);
  });
  const [displayComment, setDisplayComment] = useState(() => {
    if(dataClassExists(order)){
      return nullParser(order.comment);
    }

    return "";
  });

  const [activityError, setActivityError] = useErrorState();
    // Functions
  function validate(){
    const [validActivity, numberActivity] = parseDanishPositiveNumberInput(displayActivity, "Aktiviten");

    if(!validActivity){
      setActivityError(numberActivity);
      return [false, {}];
    }
    setActivityError("");

    return [true, {
      ...order,
      ordered_activity : numberActivity,
      comment : nullify(displayComment),
      status : ORDER_STATUS.ORDERED,
    }];
  }

  function deleteOrder(){
    websocket.sendDeleteModel(DATA_ACTIVITY_ORDER, [order]);
  }

  // Rewrite
  function commitCallBack(){
    setDisplayActivity("0");
    setDisplayComment("");
  }

  useUpdatingEffect(function RefreshOrder(){
    if(dataClassExists(order)){
      setDisplayActivity(order.ordered_activity);
      setDisplayComment(nullParser(order.comment));
    } else {
      setDisplayActivity(String(calculatorActivity));
    }
  }, [calculatorActivity, order]);

  const ordered = order.status > 0;
  const canEdit = order.status <= 1;
  const changedTemp = state.activity_orders.has(order.id) ?
                        String(order.ordered_activity) === displayActivity
                      : true;

  const statusIcon = (() => {
    if(!dataClassExists(order)){
      return <div></div>
    }
    return <StatusIcon order={order}/>
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
    <Row>
      <Col xs={1} style={cssCenter}>
        {statusIcon}
      </Col>
      <Col style={cssCenter} xs={1}>
        {statusInfo}
      </Col>
      <Col>
        <TracershopInputGroup label="Aktivitet" error={activityError} tail={"MBq"}>
          <EditableInput
            canEdit={canEdit}
            data-testid={`activity-${order.id}`}
            value={displayActivity}
            onChange={setStateToEvent(setDisplayActivity)}
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
          value={displayComment}
          onChange={(setStateToEvent(setDisplayComment))}
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
}

type CardProps = {
  orderCollection? : ActivityOrderCollection,
  openCalculator? : () => void,
  canOrder? : boolean
}

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

function TimeSlotCardHeaderEmpty({canOrder, openCalculator, orderCollection}){
  if(canOrder){
    return <Row >
      <Col>Der er ikke bestilt sporestof</Col>
      <Col style={{
        flex : "0 0 fit-content"
      }}>
        <CalculatorIcon data-testid={`open-calculator-${orderCollection.delivering_time_slot.id}`} openCalculator={openCalculator}/>
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
function TimeSlotCardHeaderOrdered({orderCollection, openCalculator}: CardProps){
  return (
    <Row>
      <Col>Bestilt: {orderCollection.ordered_activity} MBq</Col>
      <Col style={{ flex : "0 0 fit-content" }}>
        <CalculatorIcon data-testid={`open-calculator-${orderCollection.delivering_time_slot.id}`} openCalculator={openCalculator}/>
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
            data-testid={`delivery-${orderCollection.delivering_time_slot.id}`}
            orderCollection={orderCollection}
          />
        </Optional>
      </Col>
    </Row>
  );
}


type TimeSlotCardActivityProps = {
  timeSlot : ActivityDeliveryTimeSlot,
  overhead : number,
  activityDeadlineValid : Boolean,
  activityOrders : Array<ActivityOrder>
};


/**
* This is a card, representing the users view of ActivityDeliveryTimeSlot
* It contains all ordered
*/
export function TimeSlotCardActivity({
  timeSlot,
  activityOrders,
  overhead,
  activityDeadlineValid,
} : TimeSlotCardActivityProps){
  // State
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorActivity, setCalculatorActivity] = useState(0);

  // Contexts
  const state = useTracershopState();

  // Prop extraction
  const active_date = state.today;
  const dateString = dateToDateString(active_date);
  const production = state.production.get(timeSlot.production_run);
  const tracer = state.tracer.get(production.tracer);
  const canOrder = activityDeadlineValid;

  const blankOrder = makeBlankActivityOrder(timeSlot)

  // IMPLICIT ASSUMPTION! -- You can only move orders between time slots of the
  //same endpoint and tracer (and day, but that assumption is not used here!)
  const displayActivityOrders = activityOrders.filter((order) =>
    order.ordered_time_slot === timeSlot.id);

  const orderCollection = new ActivityOrderCollection(activityOrders, dateString, timeSlot, state, overhead);


  // This Component displays all order in their original positions
  const orderRows = displayActivityOrders.map((order, i) =>
    <ShopOrderRow order={order} key={i} calculatorActivity={calculatorActivity}/>);

  if(canOrder){
    orderRows.push(
      <ShopOrderRow order={blankOrder} key={-1} calculatorActivity={calculatorActivity}/>
    );
  }

  function openCalculator(){
    setShowCalculator(true)
  }

  const calculatorProps = {
    [PROP_ACTIVE_DATE] : combineDateAndTimeStamp(active_date,
                                                 timeSlot.delivery_time),
    [DATA_ISOTOPE] : state.isotopes,
    [PROP_ON_CLOSE] : () => {setShowCalculator(false);},
    [PROP_ACTIVE_TRACER] : tracer,
    [PROP_COMMIT] : (activity : number) => {
        setCalculatorActivity(
          Math.floor(activity)
        );

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
        return <TimeSlotCardHeaderCancelled/>;
      case ORDER_STATUS.ACCEPTED:
        return <TimeSlotCardHeaderAccepted orderCollection={orderCollection}/>;
      case ORDER_STATUS.ORDERED:
        return <TimeSlotCardHeaderOrdered orderCollection={orderCollection} openCalculator={openCalculator}/>;
      case ORDER_STATUS.EMPTY:
        return <TimeSlotCardHeaderEmpty orderCollection={orderCollection} canOrder={canOrder} openCalculator={openCalculator}/>;
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
