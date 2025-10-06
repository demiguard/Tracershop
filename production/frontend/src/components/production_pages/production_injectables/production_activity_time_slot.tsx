import React, { useState } from 'react'
import { Card, Row, Col, Collapse, Button } from 'react-bootstrap';
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context';
import { getId } from '~/lib/utils';
import { OrderMapping } from '~/lib/data_structures/order_mapping';
import { ORDER_STATUS } from '~/lib/constants';
import { cssCenter } from "~/lib/styles";
import { Optional } from '~/components/injectable/optional';
import { OpenCloseButton } from '~/components/injectable/open_close_button';
import { ActivityDeliveryIcon, ClickableIcon, IdempotentIcon, StatusIcon } from '~/components/injectable/icons';
import { Comment } from '~/components/injectable/data_displays/comment';
import { ActivityDeliveryTimeSlot } from '~/dataclasses/dataclasses';
import { TimeDisplay } from '~/components/injectable/data_displays/time_display';
import { calculateProduction, correctVialActivityToTime, fulfillmentActivity } from '~/lib/physics';
import { ActivityOrderCollection } from '~/lib/data_structures/activity_order_collection';
import { EndpointDisplay } from '~/components/injectable/data_displays/endpoint';
import { DISPLAY, JUSTIFY } from '~/lib/styles';
import { DATA_ACTIVITY_ORDER, DATA_DELIVER_TIME, WEBSOCKET_MESSAGE_MOVE_ORDERS, WEBSOCKET_MESSAGE_RESTORE_ORDERS } from '~/lib/shared_constants';
import { MBqDisplay } from '~/components/injectable/data_displays/mbq_display';
import { UserDisplay } from '~/components/injectable/data_displays/user_display';
import { DatetimeDisplay } from '~/components/injectable/data_displays/datetime_display';
import { HoverBox } from '~/components/injectable/hover_box';
import { compareTimeStamp, TimeStamp } from '~/lib/chronomancy';
import { ActivityOrderRow } from './activity_order_row';

/**
 *
 * @param {Object} param0
 * @param {Vial} param0.vial
 * @param {ActivityOrderCollection}  param0.orderCollection
 */
function VialRow({vial, orderCollection}){
  const timeSlot = orderCollection.delivering_time_slot
  const timeStampTimeSlot = new TimeStamp(timeSlot.delivery_time);
  const timeStampVial = new TimeStamp(vial.fill_time);
  const comparedTimeSlot = compareTimeStamp(timeStampVial, timeStampTimeSlot)

  const minutesBetweenVialAndTimeSlot = comparedTimeSlot.toMinutes();

  const correctedActivity = calculateProduction(
    orderCollection.isotope.halflife_seconds,
    minutesBetweenVialAndTimeSlot,
    vial.activity
  );

  const base_time = <div>Kl: {vial.fill_time}</div>;
  const hover_time = <div>Dispenseringstidspunkt</div>;
  const base_activity = <div>{vial.activity} MBq</div>;
  const hover_activity = <div>Aktivitet ved dispensering</div>;
  const base_corrected = <div>{Math.floor(correctedActivity)} MBq</div>;
  const hover_corrected = <div>Aktivitet ved kl: {timeSlot.delivery_time}</div>

  return (<Row>
    <Col xs={1}><ClickableIcon src={"/static/images/vial.svg"}/></Col>
    <Col><HoverBox Base={base_time} Hover={hover_time}></HoverBox></Col>
    <Col><HoverBox Base={base_activity} Hover={hover_activity}/></Col>
    <Col><HoverBox Base={base_corrected} Hover={hover_corrected}/></Col>
    <Col></Col>
  </Row>);
}

/**
 *
 * @param {object} props
 * @param {ActivityOrderCollection} props.orderCollection
 * @returns
 */
function ProductionInnerContentMoved({orderCollection, firstAvailableTimeSlot, moveOrders}){
  /* inline-block fits the block inside of the html:
  <div>foo<div>bar</div></div> ->
  foo
  bar

  <div>foo<div display:inline-block>bar</div></div> ->
  foobar
  */
  return (
    <Row style={{...cssCenter, ...JUSTIFY.center, marginTop: '3.1666px', marginBottom: '3.1666px'}}>
      <div style={{width : 'fit-content'}}>Rykket til: <TimeDisplay time={firstAvailableTimeSlot.delivery_time}/>
      </div>
    </Row>);
}

/**
 * @param {object} props
 * @param {ActivityOrderCollection} props.orderCollection
 * @param {firstAvailableTimeSlot}
 * @returns
 */
function ProductionInnerContentStatusORDERED({orderCollection, firstAvailableTimeSlot, moveOrders}){
  const canMove = firstAvailableTimeSlot.id !== orderCollection.delivering_time_slot.id;
  const websocket = useWebsocket();


  function acceptOrders(){
    const acceptedOrders = orderCollection.relevant_orders.filter(
      (order) => order.status === ORDER_STATUS.ORDERED
    );

    // Something something const
    for(const order of acceptedOrders){
      order.status = ORDER_STATUS.ACCEPTED;
    }

    return websocket.sendEditModel(DATA_ACTIVITY_ORDER, acceptedOrders);
  }

  return <Row>
    <Col xs={3} style={cssCenter}>
      <div>Bestilt:</div>
      <MBqDisplay activity={orderCollection.ordered_activity}/>
    </Col>

    <Col xs={3} style={cssCenter}>
      <div>Til udlevering:</div>
      <MBqDisplay activity={orderCollection.deliver_activity}/>
     </Col>
    <Col style={cssCenter}>
      <Row>
        <Optional exists={canMove}>
          <div style={{width : 'fit-content'}}>
            <IdempotentIcon
              src="/static/images/move_top.svg"
              onClick={moveOrders}
            />
          </div>
        </Optional>
        <div style={{width : 'fit-content'}}>
          <IdempotentIcon src="/static/images/thumb-up-add.svg" onClick={acceptOrders}/>
        </div>
      </Row>
    </Col>
  </Row>
}

/**
 *
 * @param {object} props
 * @param {ActivityOrderCollection} props.orderCollection
 * @returns
 */
function ProductionInnerContentStatusACCEPTED({
  orderCollection, firstAvailableTimeSlot, moveOrders
}){
  const canMove = firstAvailableTimeSlot.id !== orderCollection.delivering_time_slot.id;

  let vialActivity = 0;
  for(const vial of orderCollection.unassigned_vials){
    vialActivity += correctVialActivityToTime(
      vial,
      orderCollection.delivering_time_slot.delivery_time,
      orderCollection.isotope.halflife_seconds
    );
  }

  return <Row>
    <Col xs={3} style={cssCenter}>
      <div>Bestilt:</div>
      <MBqDisplay activity={orderCollection.ordered_activity}/>
    </Col>
    <Col>
      <div>Dispenseret:</div>
      <MBqDisplay activity={vialActivity}/>
    </Col>
    <Col xs={3} style={cssCenter}>
      <div>Til udlevering:</div>
      <MBqDisplay activity={orderCollection.deliver_activity}/>
     </Col>
    <Col style={cssCenter}>
      <Row>
        <Optional exists={canMove}>
          <div style={{width : 'fit-content'}}>
            <IdempotentIcon
              src="/static/images/move_top.svg"
              onClick={moveOrders}
            />
          </div>
        </Optional>
      </Row>
    </Col>
  </Row>
}


/**
 *
 * @param {object} props
 * @param {ActivityOrderCollection} props.orderCollection
 * @returns
 */
function ProductionInnerContentStatusRELEASED({orderCollection, moveOrders, firstAvailableTimeSlot}){
  const releasedBase = <div>
        <div>Udleveret:</div>
        <MBqDisplay activity={orderCollection.delivered_activity}/>
  </div>;
  const releasedHover = <div>
    Korrigeret til kl: {orderCollection.delivering_time_slot.delivery_time}
  </div>


  return (
    <Row>
      <Col style={cssCenter}>
        <div>Til udlevering:</div>
        <MBqDisplay activity={orderCollection.deliver_activity}/>
      </Col>
      <Col style={cssCenter}>
        <HoverBox Base={releasedBase} Hover={releasedHover}/>
      </Col>
      <Col style={cssCenter}>
        <div>Frigivet kl: <TimeDisplay time={orderCollection.freed_time}/></div>
      </Col>
      <Col style={JUSTIFY.center}>
        <ActivityDeliveryIcon orderCollection={orderCollection} />
      </Col>
    </Row>
  );
}


function ProductionInnerContentStatusCANCELED({orderCollection, moveOrders, firstAvailableTimeSlot}){
  return (
    <Row>
      <Col style={{...JUSTIFY.center, marginTop: '3.1666px', marginBottom: '3.1666px'}}>
        <div>
          Afvist af: <UserDisplay style={DISPLAY.INLINE_BLOCK} user={orderCollection.freed_by}/>
        </div>

      </Col>
      <Col style={{...JUSTIFY.center, marginTop: '3.1666px', marginBottom: '3.1666px'}}>
        Afvist kl: <DatetimeDisplay style={DISPLAY.INLINE_BLOCK} datetime={orderCollection.freed_time}/>
      </Col>
    </Row>
  );
}


function ProductionInnerContent({
    orderCollection,
    firstAvailableTimeSlot,
    moveOrders
  }){
  if(orderCollection.moved){
    return <ProductionInnerContentMoved
      orderCollection={orderCollection}
      firstAvailableTimeSlot={firstAvailableTimeSlot}
      moveOrders={moveOrders}
    />
  }

  switch(orderCollection.minimum_status){
    case ORDER_STATUS.ORDERED:
      return <ProductionInnerContentStatusORDERED
        orderCollection={orderCollection}
        firstAvailableTimeSlot={firstAvailableTimeSlot}
        moveOrders={moveOrders}
      />;
    case ORDER_STATUS.ACCEPTED:
      return <ProductionInnerContentStatusACCEPTED
        orderCollection={orderCollection}
        firstAvailableTimeSlot={firstAvailableTimeSlot}
        moveOrders={moveOrders}
      />;
    case ORDER_STATUS.RELEASED:
      return <ProductionInnerContentStatusRELEASED
        orderCollection={orderCollection}
        firstAvailableTimeSlot={firstAvailableTimeSlot}
        moveOrders={moveOrders}
      />;
    case ORDER_STATUS.CANCELLED:
      return <ProductionInnerContentStatusCANCELED
        orderCollection={orderCollection}
        firstAvailableTimeSlot={firstAvailableTimeSlot}
        moveOrders={moveOrders}
      />;
    default:
      console.error("No default available for ProductInnerContent!")
      return <div></div>
  }
}


//#region ProductionTimeSlot
/**
* This is similar to the shop side TimeSlotCard,
* however the functionality is quite different
* Creates a number of OrderRow inside of the card.
* @param {object} props
* @param {ActivityDeliveryTimeSlot} props.timeSlot - The time slot for the Row
* @param {Tracer} props.tracer - Tracer of the time slot
* @param {React.Dispatch<React.SetStateAction<null>>} props.setModalIdentifier
* Function for activating the activity modal
* @param {React.Dispatch<React.SetStateAction<null>>} props.setTimeSlotID
* Function for specifying it should be this time slot that should be opened
* @param {TimeSlotMapping} props.timeSlotMapping
* @param {OrderMapping} props.orderMapping
* @param {ActivityOrderCollection} props.orderCollection
* @returns
*/
export function ProductionActivityTimeSlot({timeSlot,
                    setTimeSlotID,
                    setModalIdentifier,
                    orderMapping,
                    timeSlotMapping,
                    orderCollection,
}){
const websocket = useWebsocket();
const firstAvailableTimeSlot = timeSlotMapping.getFirstTimeSlot(orderCollection.delivering_time_slot);
const /**@type {Number} */ firstAvailableTimeSlotID = firstAvailableTimeSlot.id;

const orders = [...orderCollection.relevant_orders]
const orderData = [];
const vialData = [];

for(const order of orders){
  const is_originalTimeSlot = order.ordered_time_slot === timeSlot.id
                           && order.moved_to_time_slot === null
                           || order.moved_to_time_slot === timeSlot.id

  if(is_originalTimeSlot){
    orderData.push(
      <ActivityOrderRow
        key={order.id}
        order={order}
        overhead={orderCollection.overhead}
      />);
  }
}

for(const vial of orderCollection.vials){
  vialData.push(<VialRow key={vial.id} vial={vial} orderCollection={orderCollection}/>);
}

const canMove = firstAvailableTimeSlot.id !== timeSlot.id
             && orderCollection.minimum_status < ORDER_STATUS.RELEASED;

// State
const [open, setOpen] = useState(false);

// Functions
function moveOrders(){
  const message = websocket.getMessage(WEBSOCKET_MESSAGE_MOVE_ORDERS);
  const firstTimeSlotOrderCollection = orderMapping.getOrders(firstAvailableTimeSlotID);

  if(firstTimeSlotOrderCollection.minimum_status === ORDER_STATUS.RELEASED &&
    ( orderCollection.minimum_status === ORDER_STATUS.ACCEPTED ||
      orderCollection.minimum_status === ORDER_STATUS.ORDERED
    )
  ){

  }

  message[DATA_DELIVER_TIME] = firstAvailableTimeSlotID;
  message[DATA_ACTIVITY_ORDER] = orders.map(getId);
  return websocket.send(message);
}

function restoreOrders(){
 const message = websocket.getMessage(WEBSOCKET_MESSAGE_RESTORE_ORDERS);
 message[DATA_ACTIVITY_ORDER] = orders.map(getId);
 return websocket.send(message);
}

function headerFunction(){
  if (orderCollection.moved && canMove) {
    restoreOrders();
  } else {
    setTimeSlotID(timeSlot.id);
    setModalIdentifier('activityModal');
  }
}


return (
 <Card key={timeSlot.id}>
    <Card.Header>
     <Row>
       <Col xs={1} style={cssCenter}>
          <StatusIcon
            label={`time-slot-icon-${timeSlot.id}`}
            orderCollection={orderCollection}
            onClick={headerFunction}
          />
       </Col>
       <Col xs={2} style={cssCenter}><EndpointDisplay endpoint={orderCollection.endpoint}/></Col>
       <Col xs={1} style={cssCenter}><TimeDisplay time={timeSlot.delivery_time}/></Col>
       <Col>
          <ProductionInnerContent
            firstAvailableTimeSlot={firstAvailableTimeSlot}
            orderCollection={orderCollection}
            moveOrders={moveOrders}
          />
       </Col>
       <Col xs={1} style={{
         justifyContent : 'right',
         display : 'flex'
       }}>
         <OpenCloseButton
           label={`open-time-slot-${timeSlot.id}`}
           open={open}
           setOpen={setOpen}
         />
       </Col>
     </Row>
   </Card.Header>
   <Collapse in={open}>
     <Card.Body>
        <Row>
          <Col xs={1}></Col>
          <Col>Ordre ID</Col>
          <Col>Uden overhead</Col>
          <Col>Med overhead</Col>
          <Col></Col>
        </Row>
        {orderData}
        <Optional exists={vialData.length > 0}>
          <Row>
            <Col xs={1}>{/* NOTHING */}</Col>
            <Col>Productions tidpunkt</Col>
            <Col>Aktivitet ved dispensering</Col>
            <Col>Aktivitet ved levering</Col>
          </Row>
        </Optional>
        {vialData}
        <Optional exists={!(orderCollection.moved)}>
          <Row style={{justifyContent : "end"}}>
            <Col xs={1}>
              <Button
                style={{
                  marginLeft : "-15px"
                }}
                onMouseDown={() => {
                  setTimeSlotID(timeSlot.id);
                  setModalIdentifier('activityModal');
                }}>
                Åben
              </Button>
            </Col>
          </Row>
        </Optional>
     </Card.Body>
   </Collapse>
 </Card>);
}
