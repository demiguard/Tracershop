import React, { Component } from "react";
import { Col, Container, Row, Button, FormGroup, FormControl, FormLabel, Table, OverlayTrigger, Tooltip, Popover } from "react-bootstrap";
import { JSON_ACTIVITY_ORDER, KEYWORD_AMOUNT, KEYWORD_AMOUNT_O, KEYWORD_BATCHNR, KEYWORD_BID, KEYWORD_COID, KEYWORD_COMMENT, KEYWORD_CUSTOMER, KEYWORD_DELIVER_DATETIME, KEYWORD_RUN, KEYWORD_STATUS, KEYWORD_TOTAL_AMOUNT, KEYWORD_TOTAL_AMOUNT_O, KEYWORD_TRACER, KEYWORD_USERNAME, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CREATE_DATA_CLASS, WEBSOCKET_MESSAGE_SHOP_CREATE_ORDER } from "../../lib/constants";
import { FormatDateStr } from "../../lib/formatting";
import { renderClickableIcon, renderStatusImage, renderTableRow } from "../../lib/Rendering";

export { OrderReview }

const DeliverTimeStatus = {
  AVAILBLE_FOR_ORDER : 0,
  ALREADY_ORDERED : 1,
  UNAVAILABLE_FOR_ORDER : 2,
}

const newOrderObject = {
  newActivity : "",
  newComment : "",
  errorActivity : "",
  errorComment : "",
}


class OrderReview extends Component {
  constructor(props){
    super(props)

    // This map may contain redundant information, however it's trivially small
    const newOrdersMap = new Map();
    for(const [DTID, _DT] of this.props.deliverTimes) newOrdersMap.set(DTID, newOrderObject);

    this.state = {
      newOrders : newOrdersMap // Maps for containing informaiton on new Orders.
    }
  }

  componentDidUpdate(prevProps){
    if(this.props.deliverTimes != prevProps.deliverTimes){
      const newOrdersMap = new Map();
      for(const [DTID, _DT] of this.props.deliverTimes) newOrdersMap.set(DTID, newOrderObject);

      this.setState({
        ...this.state,
        newOrders : newOrdersMap // Maps for containing informaiton on new Orders.
      });
    }
  }

  // NewOrder Functions
  sendNewOrder(DTID, This){
    const retfunc = (_event) => { // On click event - It contains no information
      if (!This.validateNewOrder(DTID)){ // This function creates a state change with error message
        return;
      }

      const deliverTime = This.props.deliverTimes.get(DTID);
      const newOrder = This.state.newOrders.get(DTID);
      const customer = This.props.customers.get(This.props.activeCustomer)
      const deliverDateTimeStr = `${This.props.date.getFullYear()}-${
        FormatDateStr(This.props.date.getMonth() + 1)}-${
        FormatDateStr(This.props.date.getDate())} ${deliverTime.dtime}`;

      const baseActivtiy = Number(newOrder.newActivity); // Validated in this.validateNewOrder()
      const overheadActivity = baseActivtiy * (1 + customer.overhead / 100);


      const data = {};
      data[KEYWORD_DELIVER_DATETIME] = deliverDateTimeStr;
      data[KEYWORD_STATUS] = 1;
      data[KEYWORD_AMOUNT] = baseActivtiy;
      data[KEYWORD_TOTAL_AMOUNT] = baseActivtiy;
      data[KEYWORD_AMOUNT_O] = overheadActivity;
      data[KEYWORD_TOTAL_AMOUNT_O] = overheadActivity;
      data[KEYWORD_TRACER] = This.props.activeTracer;
      data[KEYWORD_RUN] = deliverTime.run;
      data[KEYWORD_BID] = This.props.activeCustomer;
      data[KEYWORD_BATCHNR] = "";
      data[KEYWORD_COID] = -1;
      data[KEYWORD_COMMENT] = newOrder.newComment;
      data[KEYWORD_USERNAME] = This.props.user.username;

      const message = This.props.websocket.getMessage(WEBSOCKET_MESSAGE_CREATE_DATA_CLASS);
      message[WEBSOCKET_DATA] = data;
      message[WEBSOCKET_DATATYPE] = JSON_ACTIVITY_ORDER;

      This.props.websocket.send(message);
    }
    return retfunc;
  }

  setNewOrder(DTID, KW, This){
    const retfunc = (event) => {
      const newOrder = {...This.state.newOrders.get(DTID)};
      newOrder[KW] = event.target.value;
      const newNewOrdersMap = new Map(This.state.newOrders);
      newNewOrdersMap.set(DTID, newOrder)
      This.setState({...This.state,
        newOrders : newNewOrdersMap
      });
    }
    return retfunc;
  }

  validateNewOrder(DTID){
    const newOrderData = this.state.newOrders.get(DTID);

  }

  renderDeliverTime(deliverTime){
    const calibrationTime = deliverTime.dtime.substr(0,5);
    const DeliverTimeOrders = Array.from(this.dailyOrders.values()).filter(
      (order) => order.deliver_datetime.substr(11,5) == calibrationTime
    );
    if (DeliverTimeOrders.length == 0){
      var newOrder = this.state.newOrders.get(deliverTime.DTID);
      if(newOrder == undefined){
        newOrder = newOrderObject;
      }

      const showActivityError = newOrder.errorActivity != "";
      const showCommentError = newOrder.errorcomment != "";


      return (
        <Row key={deliverTime.run}>
        <Row>
          <strong>Levering {deliverTime.run} - Kalibreret til Kl: {calibrationTime}</strong>
        </Row>
        <Row>
          <Col>
            <OverlayTrigger
              show={showActivityError}
              placement="top"
              overlay={
                <Popover>
                  <Popover.Header as="h3">Aktivitets fejl</Popover.Header>
                  <Popover.Body>{newOrder.errorActivity}</Popover.Body>
                </Popover>
              }
              delay={{
                show : 0,
                hide : 0
              }}>
              <FormGroup className="input-group">
                <FormGroup className="input-group-prepend">
                  <label className="input-group-text">Aktivitet</label>
                </FormGroup>
                <FormControl
                  value={newOrder.newActivity}
                  onChange={this.setNewOrder(deliverTime.DTID, "newActivity", this)}
                  />
                <FormGroup className="input-group-append">
                  <label className="input-group-text">MBq</label>
                </FormGroup>
              </FormGroup>
            </OverlayTrigger>
          </Col>
          <Col>
          <OverlayTrigger
              show={showCommentError}
              placement="top"
              overlay={
                <Popover>
                  <Popover.Header as="h3">Kommentar fejl</Popover.Header>
                  <Popover.Body>{newOrder.errorComment}</Popover.Body>
                </Popover>
              }
              delay={{
                show : 0,
                hide : 0
              }}>
            <FormGroup className="input-group">
              <FormGroup className="input-group-prepend">
                <label className="input-group-text">Kommentar</label>
              </FormGroup>
              <textarea
                rows={1}
                className="form-control"
                value={newOrder.newComment}
                onChange={this.setNewOrder(deliverTime.DTID, "newComment", this)}
                />
            </FormGroup>
            </OverlayTrigger>
          </Col>
          <Col><Button>Bestil</Button></Col>
        </Row>
      </Row>)
  } else {
    const renderedOrders = [];
    for(const order of DeliverTimeOrders){
      const batchNumStr = order.batchnr ? order.batchnr : "-";
      const freeAmountStr = order.frigivet_amount ? order.frigivet_amount : "-";
      const freeDateTimeStr = order.frigivet_datetime ? order.frigivet_datetime : "-";
      const CommnentBubble = order.comment ? <OverlayTrigger
          placement="top"
          delay={{
            show : 50, hide : 100
          }}
          overlay={
            <Popover>
              <Popover.Body>{order.comment}</Popover.Body>
            </Popover>
          }
        >{renderClickableIcon("/static/images/comment.svg")}
        </OverlayTrigger> : "-";
      renderedOrders.push(
        renderTableRow(order.oid, [
          renderStatusImage(order.status),
          order.oid,
          order.amount,
          order.total_amount,
          batchNumStr,
          freeAmountStr,
          freeDateTimeStr,
          CommnentBubble
        ])
      );
    }

    // The DeliverTime Row should be made into a small component.
    return (
      <Row key={deliverTime.run}>
        <Row >
          <strong>Levering {deliverTime.run} - Kalibreret til Kl: {calibrationTime}</strong>
        </Row>
        <Table>
          <thead>
            <tr>
              <th>Status</th>
              <th>order ID</th>
              <th>Bestilt Aktivitet</th>
              <th>Samlet MBq</th>
              <th>Batch-nr</th>
              <th>Frigivet MBq</th>
              <th>Frigivet</th>
              <th>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {renderedOrders}
          </tbody>
        </Table>
      </Row>
    )
  }
}

  render(){
    const orderPoints = [];
    const todayStr = `${this.props.date.getFullYear()}-${
      FormatDateStr(this.props.date.getMonth() + 1)}-${
      FormatDateStr(this.props.date.getDate())}`;

    // Setting dependant properties.

    const todaysOrders = Array.from(this.props.orders.values()).filter((order) => {
      return order.deliver_datetime.substr(0,10) == todayStr;
    });
    this.dailyOrders = new Map(todaysOrders.map((order) => [order.oid, order]));
    const todaysTOrders = Array.from(this.props.tOrders.values()).filter((t_order) => {
      return t_order.deliver_datetime.substr(0,10) == todayStr;
    });
    this.dailyTOrders = new Map(todaysTOrders.map((order) => [order.oid, order]));

    //

    for(const [_DTID, DT] of this.props.deliverTimes){
      orderPoints.push(this.renderDeliverTime(DT))
    }

    return(
    <Container>
      {orderPoints}
    </Container>)
  }

}