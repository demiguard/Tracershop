import React, { useEffect, useState } from "react";
import { Card, Collapse, Col, Form, FormControl, InputGroup, Row } from "react-bootstrap";

import { ActivityOrder, ActivityDeliveryTimeSlot, Vial, Isotope } from "../../../dataclasses/dataclasses";
import { dateToDateString, nullParser } from "../../../lib/formatting";

import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE, cssAlignRight, cssCenter } from "../../../lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_ISOTOPE } from "../../../lib/shared_constants.js"
import { ClickableIcon, StatusIcon } from "../../injectable/icons";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";

import SiteStyles from '../../../css/Site.module.css'
import { CalculatorModal } from "../../modals/calculator_modal";
import { combineDateAndTimeStamp, getTimeString } from "../../../lib/chronomancy";
import { getPDFUrls } from "../../../lib/utils";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { setStateToEvent } from "~/lib/state_management";
import { ErrorInput } from "~/components/injectable/inputs/error_input";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { ActivityOrderCollection } from "~/lib/data_structures";
import { Optional } from "~/components/injectable/optional";
import { CommitButton } from "~/components/injectable/commit_button";



/**
* This is a card, representing the users view of ActivityDeliveryTimeSlot
* It contains all ordered
* @param {{
*  timeSlot : ActivityProduction,
*  active_date : Date
*  overhead : Number
*  activityOrders: Array<ActivityOrder>,
*  activityDeadlineExpired : Boolean
* }} props - Input props
* @returns {Element}
*/
export function TimeSlotCard({
  timeSlotID,
  activityOrders,
  active_date,
  overhead,
  activityDeadlineExpired,

}){
  const state = useTracershopState();
  const websocket = useWebsocket();

  // Prop extraction
  const timeSlot = state.deliver_times.get(timeSlotID);
  const production = state.production.get(timeSlot.production_run);
  const tracer = state.tracer.get(production.tracer);
  const canOrder = !activityDeadlineExpired;
  // IMPLICIT ASSUMPTION! -- You can only move orders between time slots of the same endpoint and tracer
  //(and day, but that assumption is not used here!)
  const endpoint = state.delivery_endpoint.get(timeSlot.destination);

  // State
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [newOrder, _setNewOrderActivity] = useState({
    status : "",
    ordered_activity : "",
    comment : "",
    moved_to_time_slot : "",
  }); // This is a new object because otherwise react rendering engine fucks up

  function setNewOrderActivity(newActivity){
    _setNewOrderActivity({...newOrder, ordered_activity : Math.floor(newActivity)});
  }
  // Filter out irrelevant orders

  const orderedActivityOrders = activityOrders.filter((order) =>
    order.ordered_time_slot === timeSlotID);

  const orderCollection = new ActivityOrderCollection(orderedActivityOrders, state)

  const /**@type {Array<ActivityOrder>} */ deliverableActivityOrders = activityOrders.filter((_order) => {
    const /**@type {ActivityOrder} */ order = _order
    const orderedHere = order.ordered_time_slot === timeSlot.id && (order.moved_to_time_slot === null)
    const movedToHere = order.moved_to_time_slot === timeSlot.id

    return orderedHere || movedToHere;
  });

  /**
 * This component is a row in the card of the activity timeSlot
 * @param {{
*  timeSlots : Map<Number, ActivityDeliveryTimeSlot>
* }} props
* @returns { Element }
*/
function ActivityOrderRow({order}){
  const [tempOrder, setTempOrder] = useState(order)
  // State
  const [activity, setActivity] = useState(order.ordered_activity);
  const [comment, setComment] = useState(nullParser(order.comment));
  const [errorActivity, setErrorActivity] = useState("");

  // Functions
  function validate(){
    const [validActivity, numberActivity] = parseDanishPositiveNumberInput(activity, "Aktiviten");
    if(!validActivity){
      setErrorActivity(numberActivity);
      return false, {};
    }

    return true, {
      ...order,
      ordered_activity : activity
    }
  }

  function commitCallBack(){
    setTempOrder(order => {return {...order, ordered_activity : "", comment : ""};})
  }

  function createOrder() {
    const [validActivity, numberActivity] = parseDanishPositiveNumberInput(activity, "Aktiviten");
    if(!validActivity){
      setErrorActivity(numberActivity);
      return;
    }

    websocket.sendCreateModel(DATA_ACTIVITY_ORDER,
      new ActivityOrder(
        undefined, // activity_order_id
        numberActivity, // ordered_activity
        dateToDateString(active_date), // deliveryDate
        1, // Status
        comment, // comment
        timeSlot.id, // ordered_time_slot
        null,
        null,
        null,
        null,
      ));
    setActivity("");
    setComment("");
    setErrorActivity("");
  }

  function updateOrder() {
    const [validActivity, numberActivity] = parseDanishPositiveNumberInput(activity)
    if(!validActivity){
      setErrorActivity(numberActivity)
      return
    }
    const newOrder = {
      ...order,
      ordered_activity : numberActivity,
      comment : comment
    };

    websocket.sendEditModel(DATA_ACTIVITY_ORDER, newOrder);
  }

  const orderID = (order.id !== undefined) ? order.id : "new";
  const ordered = order.status > 0;
  const canEdit = order.status <= 1;
  const changedActivity = !(order.ordered_activity === activity);
  const changedComment = !(nullParser(order.comment) === comment);

  if(canEdit){ // React flips out if it can't update, which i guess is fair.
    useEffect(() => {
      setActivity(order.ordered_activity);
      setComment(order.comment);
    }, [order]); // we need this to ensure that calculator updates...
  }

  const statusIcon = (() => {
    if(order.moved_to_time_slot){
      return (<ClickableIcon src="static/images/move_top.svg"/>);
    } else if (ordered) {
      return (<StatusIcon order={order}/>);
    } else {
      return <div/>
    };
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

  const ActionImage = ordered ?
      <ClickableIcon
        label={`update-${orderID}`}
        src="/static/images/update.svg"
        onClick={updateOrder}
      /> : <ClickableIcon
        label={`create-${orderID}`}
        src="/static/images/cart.svg"
        onClick={createOrder}
      />;

  return (
    <Row>
      <Col xs={1} style={cssCenter}>
        {statusIcon}
      </Col>
      <Col style={cssCenter} xs={1}>
        {statusInfo}
      </Col>
      <Col>
        <TracershopInputGroup label="Aktivitet">
          <ErrorInput error={errorActivity}>
            <EditableInput
              canEdit={canEdit}
              data-testid={`activity-${orderID}`}
              value={activity}
              onChange={setStateToEvent(setActivity)}
            />
          </ErrorInput>
          <InputGroup.Text>MBq</InputGroup.Text>
        </TracershopInputGroup>
      </Col>
      <Col>
        <TracershopInputGroup label="Kommentar">
        <EditableInput
          canEdit={canEdit}
          data-testid={`comment-${orderID}`}
          as="textarea"
          rows={1}
          value={comment}
          onChange={setStateToEvent(setComment)}
        />
        </TracershopInputGroup></Col>
      <Col xs={1} style={cssAlignRight}>
        <Optional exists={canEdit && (changedActivity || changedComment)}>
          <CommitButton
            temp_object={tempOrder}
            validate={validate}
            callback={commitCallBack}
            add_image="/static/images/cart.svg"
            object_type={DATA_ACTIVITY_ORDER}
          />
        </Optional>
      </Col>
    </Row>);
  }

  // This Component displays all order in their original positions
  const orderRows = orderedActivityOrders.map((order) => {
    return <ActivityOrderRow
      key={order.id}
      order={order}
    />
  })

  let header = <div></div>
  let timeSlotActivity = 0
  let minimumStatus = 5;
  if(orderedActivityOrders.length){
    for(const order of orderedActivityOrders){
      timeSlotActivity += order.ordered_activity
      minimumStatus = Math.min(minimumStatus, order.status);
    }
  }

  if(!activityDeadlineExpired){
    orderRows.push(<ActivityOrderRow
      key={-1}
      order={newOrder}
    />)
  }

  const orderIds = [];
  let deliveryActivity = 0;
  let freedActivity = 0;
  let freedTime = ""
  const DeliveryHour = Number(timeSlot.delivery_time.substring(0,2))
  const DeliveryMinute = Number(timeSlot.delivery_time.substring(3,5))
  for(const order of deliverableActivityOrders){
    if(freedTime === "" && order.status === 3){
      freedTime = getTimeString(order.freed_datetime)
    }
    orderIds.push(order.id);

    if(order.moved_to_time_slot === null){
      deliveryActivity += overhead * order.ordered_activity;
    } else {
      const originalTimeSlot = state.deliver_times.get(order.ordered_time_slot);
      const originalHour = Number(originalTimeSlot.delivery_time.substring(0,2))
      const originalMinute = Number(originalTimeSlot.delivery_time.substring(3,5))

      const minuteDifference = (originalHour - DeliveryHour) * 60 + (originalMinute - DeliveryMinute)
    }
  }

  for(const vial of state.vial.values()){
    if(orderIds.includes(vial.assigned_to)){
      freedActivity += vial.activity;
    }
  }

  //  Card Content
  const [thirdColumnContent, fourthColumnContent, fifthColumnContent] = (() => {
    if(minimumStatus == 3){
      return [
        `Udleveret ${freedActivity} MBq`,
        `Frigivet kl ${freedTime}`,
        <ClickableIcon
          label={`delivery-${timeSlot.id}`}
          src="static/images/delivery.svg"
          onClick={() => {
            window.location = getPDFUrls(endpoint, tracer, active_date);
          }}
        />
      ]
    } else if (!activityDeadlineExpired) {
      return [
        `Bestilt: ${timeSlotActivity} MBq`,
        `Til Udlevering: ${Math.floor(deliveryActivity)} MBq`,
        <ClickableIcon
          label="open-calculator"
          style={{
            display : "inline-block",
            marginLeft : "15px",
            marginRight : "15px",
          }}
          className={SiteStyles.Margin15lr}
          key={-1}
          onClick={() => {setShowCalculator(!showCalculator)}}
          src="static/images/calculator.svg"/>,
      ]
      } else {
        return [
          `Bestilt: ${timeSlotActivity} MBq`,
          `Til Udlevering: ${Math.floor(deliveryActivity)} MBq`,
          ""
        ];
      }
    })();

  const calculatorProps = {
    [PROP_ACTIVE_DATE] : combineDateAndTimeStamp(active_date,
                                                 timeSlot.delivery_time),
    [DATA_ISOTOPE] : state.isotopes,
    [PROP_ON_CLOSE] : () => {setShowCalculator(false);},
    [PROP_ACTIVE_TRACER] : tracer,
    [PROP_COMMIT] : (activity) => {
        setNewOrderActivity(String(activity));
        setShowCalculator(false);
      },
    initial_MBq : 300,
  };

  return (
  <Card style={{padding : '0px'}}>
    {showCalculator ? <CalculatorModal
                        {...calculatorProps}
    /> : ""}
  <Card.Header>
    <Row>
      <Col xs={1} style={cssCenter}>
        <Optional exists={orderedActivityOrders.length}>
          <StatusIcon
            label={`status-icon-time-slot-${timeSlot.id}`}
            orderCollection={orderCollection}
          />
        </Optional>
      </Col>
      <Col xs={2} style={cssCenter}>{timeSlot.delivery_time}</Col>
      <Col xs={3} style={cssCenter}>{thirdColumnContent}</Col>
      <Col xs={3} style={cssCenter}>{fourthColumnContent}</Col>
      <Col style={cssCenter}>
        <Optional exists={canOrder}>

        </Optional>
        <Optional exists={orderCollection.minimumStatus}>
          
        </Optional>
      </Col>
        <Col style={{
         justifyContent : 'right',
         display : 'flex',
       }}>
         <OpenCloseButton
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

