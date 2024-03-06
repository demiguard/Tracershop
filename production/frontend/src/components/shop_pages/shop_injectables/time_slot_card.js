import React, { useEffect, useRef, useState } from "react";
import { Card, Collapse, Col, Form, FormControl, InputGroup, Row } from "react-bootstrap";

import { ActivityOrder, ActivityDeliveryTimeSlot, Vial, Isotope, TracershopState } from "../../../dataclasses/dataclasses";
import { dateToDateString, nullParser } from "../../../lib/formatting";

import { ORDER_STATUS, PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE, cssAlignRight, cssCenter } from "../../../lib/constants";
import { DATA_ACTIVITY_ORDER, DATA_ISOTOPE } from "../../../lib/shared_constants.js"
import { ActivityDeliveryIcon, ClickableIcon, StatusIcon } from "../../injectable/icons";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";

import SiteStyles from '../../../css/Site.module.css'
import { CalculatorModal } from "../../modals/calculator_modal";
import { combineDateAndTimeStamp, getTimeString } from "~/lib/chronomancy";
import { compareLoosely, nullify, toMapping } from "~/lib/utils";
import { useTracershopState } from "~/components/tracer_shop_context";
import { parseDanishPositiveNumberInput } from "~/lib/user_input";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { EditableInput } from "~/components/injectable/inputs/editable_input";
import { ActivityOrderCollection } from "~/lib/data_structures";
import { Optional } from "~/components/injectable/optional";
import { CommitButton } from "~/components/injectable/commit_button";
import { appendNewObject, reset_error, setTempMapToEvent, set_state_error } from "~/lib/state_management";


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
export function TimeSlotCard({
  timeSlotID,
  activityOrders,
  active_date,
  overhead,
  activityDeadlineValid,
}){
  const state = useTracershopState();

  // Prop extraction
  const timeSlot = state.deliver_times.get(timeSlotID);
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
        timeSlotID,
        null,
        null,
        null,
        null
      );
    } else {
      return null;
    }
  }

  // IMPLICIT ASSUMPTION! -- You can only move orders between time slots of the same endpoint and tracer
  //(and day, but that assumption is not used here!)
  const orderedActivityOrders = activityOrders.filter((order) =>
    order.ordered_time_slot === timeSlotID);

  const orderCollection = new ActivityOrderCollection(orderedActivityOrders, state, overhead);

  // Filter out irrelevant orders
  const /**@type {Array<ActivityOrder>} */ deliverableActivityOrders = activityOrders.filter((_order) => {
    const /**@type {ActivityOrder} */ order = _order
    const orderedHere = order.ordered_time_slot === timeSlot.id && (order.moved_to_time_slot === null)
    const movedToHere = order.moved_to_time_slot === timeSlot.id

    return orderedHere || movedToHere;
  });

  // State
  const [collapsed, setCollapsed] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [errors, setErrors] = useState(new Map());
  const [orders, setOrders] = useState(
    appendNewObject(toMapping(deliverableActivityOrders), newOrderFunction)
  ); // I really feel like this is not very readable, but it is compose-able

  // Effects
  useEffect(() => {
    const /**@type {Array<ActivityOrder>} */ deliverableActivityOrders = activityOrders.filter((_order) => {
      const /**@type {ActivityOrder} */ order = _order
      const orderedHere = order.ordered_time_slot === timeSlot.id && (order.moved_to_time_slot === null)
      const movedToHere = order.moved_to_time_slot === timeSlot.id

      return orderedHere || movedToHere;
    });
    setOrders(appendNewObject(toMapping(deliverableActivityOrders), newOrderFunction))
  }, [activityOrders]); // Refresh on other users input

  // This Component displays all order in their original positions
  const orderRows = [...orders.values()].map((order, i) => {
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
        </Col>
      </Row>);
  });

  //  Card Content
  const [thirdColumnContent, fourthColumnContent] = (() => {
    if(orderCollection.minimum_status == ORDER_STATUS.RELEASED){
      const freed_time = (orderCollection.freed_time != null) ?
                        orderCollection.freed_time : "Ukendt tidspunk!";
      return [
        `Udleveret ${orderCollection.delivered_activity} MBq`,
        `Frigivet kl: ${freed_time}`,
      ]
    } else if (canOrder) {
      return [
        `Bestilt: ${orderCollection.ordered_activity} MBq`,
        `Til Udlevering: ${Math.floor(orderCollection.deliver_activity)} MBq`,
      ]
      } else {
        return [
          `Bestilt: ${orderCollection.ordered_activity} MBq`,
          `Til Udlevering: ${Math.floor(orderCollection.deliver_activity)} MBq`,
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
      },
    initial_MBq : 300,
  };

  return (
  <Card style={{padding : '0px'}}>
    <Optional exists={showCalculator}>
      <CalculatorModal {...calculatorProps}/>
    </Optional>
  <Card.Header>
    <Row>
      <Col xs={1} style={cssCenter}>
        <Optional exists={!!orderedActivityOrders.length}>
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
          <ClickableIcon
            label={`open-calculator-${timeSlot.id}`}
            src="/static/images/calculator.svg"
            onClick={() => {setShowCalculator(true);}}
          />
        </Optional>
        <Optional exists={orderCollection.minimum_status === ORDER_STATUS.RELEASED}>
          <ActivityDeliveryIcon
            label={`delivery-${timeSlot.id}`}
            orderCollection={orderCollection}
          />
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
