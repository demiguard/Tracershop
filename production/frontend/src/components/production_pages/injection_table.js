
import React, { Component } from "react";
import { Row, Col, Table, Tab, Button, Container, Modal } from 'react-bootstrap';

import { WEBSOCKET_MESSAGE_EDIT_STATE, WEBSOCKET_DATATYPE, WEBSOCKET_DATA, JSON_INJECTION_ORDER, INJECTION_USAGE, JSON_TRACER, JSON_CUSTOMER, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_MODAL_ORDER, PROP_WEBSOCKET, JSON_ENDPOINT } from "../../lib/constants.js";
import { FormatDateStr, ParseJSONstr, dateToDateString, parseDateToDanishDate } from "../../lib/formatting.js";
import { renderTableRow, renderComment } from '../../lib/rendering.js';
import { compareDates } from "../../lib/utils.js";
import { CreateInjectionOrderModal } from "../modals/create_injection_modal.js";
import { InjectionModal } from "../modals/injection_modal.js";
import { StatusIcon, ClickableIcon } from "../injectable/icons.js";
import { InjectionOrder, Tracer, DeliveryEndpoint, Customer } from "../../dataclasses/dataclasses.js";


const /**@Enum methods to sort the injection orders */ SortingMethods = {
  STATUS : 0,
  ORDER_ID : 1,
  DESTINATION : 2,
  TRACER : 3,
  INJECTIONS : 4,
  ORDERED_TIME : 5,
  USAGE : 6,
}


const /** Contains the components of the different modals this page can display  @Enum */ Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal,
  InjectionStatus : InjectionModal
}
/** Page that contains all injections orders
 *
 */
export class InjectionTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modal : Modals.NoModal,
      orderID : undefined,
      sortingMethod : SortingMethods.ORDER_ID,
      invertedSorting : false,
    };
  }

  openCreateOrderModal(){
    this.setState({...this.state, modal : Modals.CreateOrder});
  }

  closeModal(){
    this.setState({...this.state, modal : Modals.NoModal, order : undefined});
  }

  setSortingMethod(newMethod){
    return () => {
      if(newMethod === this.state.sortingMethod){
        this.setState({...this.state,  invertedSorting : !this.state.invertedSorting})
        return
      }

      this.setState({...this.state, sortingMethod : newMethod, invertedSorting : false})
    }
  }

  /**
   * Opens the injection modal for an order.
   * @param {Object} order - Injection order that will open modal
   */
  openOrderModal(order){
    this.setState({
      ...this.state,
      modal : Modals.InjectionStatus,
      orderID : order.id,
    })
  }

  /**
   * 
   * @param {InjectionOrder} order 
   * @returns 
   */
  renderIncompleteOrder(order) {
    const /**@type {Tracer} */ tracer = this.props[JSON_TRACER].get(order.tracer);
    const /**@type {DeliveryEndpoint} */ endpoint = this.props[JSON_ENDPOINT].get(order.endpoint)
    const /**@type {Customer} */ customer = this.props[JSON_CUSTOMER].get(endpoint.owner)
    const TracerName = tracer.shortname;

    return renderTableRow(
      order.id,[
        <StatusIcon
          status={order.status}
          onClick={() => this.openOrderModal(order)}
        />,
        order.id,
        `${customer.short_name} - ${endpoint.name}`,
        TracerName,
        order.injections,
        order.delivery_time,
        INJECTION_USAGE[String(order.tracer_usage)],
        renderComment(order.comment),
      ]
    )
  }


  render() {
    const /**@type {Array<InjectionOrder>} */ orders = [];

    for(const [_oid, _injectionOrder] of this.props[JSON_INJECTION_ORDER]){
      const /**@type {InjectionOrder} */ injectionOrder = _injectionOrder
      const orderDate = new Date(injectionOrder.delivery_date)
      if (compareDates(this.props[PROP_ACTIVE_DATE], orderDate)){
        orders.push(injectionOrder);
      }
    }

    const sortingMethod = this.state.sortingMethod;
    const invertedSorting = this.state.invertedSorting

    orders.sort((a, b) => {
      switch(sortingMethod){
        case SortingMethods.STATUS:
          return invertedSorting ? b.status - a.status : a.status - b.status
        case SortingMethods.ORDER_ID:
          return invertedSorting ? b.id - a.id : a.id - b.id
        case SortingMethods.DESTINATION: {
          const /**@type {DeliveryEndpoint} */ aEndpoint = this.props[JSON_ENDPOINT].get(a.endpoint);
          const /**@type {Customer} */ aCustomer = this.props[JSON_CUSTOMER].get(aEndpoint.owner);
          const /**@type {DeliveryEndpoint} */ bEndpoint = this.props[JSON_ENDPOINT].get(b.endpoint);
          const /**@type {Customer} */ bCustomer = this.props[JSON_CUSTOMER].get(bEndpoint.owner);

          if(aCustomer.id != bCustomer.id){
            return invertedSorting ? bCustomer.id - aCustomer.id : aCustomer.id - bCustomer.id
          } else {
            return invertedSorting ? bEndpoint.id - aEndpoint.id : aEndpoint.id - bEndpoint.id
          }
        }
        case SortingMethods.TRACER:
          return invertedSorting ? b.tracer - a.tracer : a.tracer - b.tracer
        case SortingMethods.INJECTIONS:
          return invertedSorting ? b.injections - a.injections : a.injections - b.injections
        case SortingMethods.USAGE:
          return invertedSorting ? b.tracer_usage - a.tracer_usage : a.tracer_usage - b.tracer_usage
      }
    })


    const modalProps ={...this.props};

    modalProps[PROP_ON_CLOSE] = this.closeModal.bind(this);
    modalProps[PROP_MODAL_ORDER] = this.state.orderID;

    return (
      <Container>
        <Row>
          <Col sm={10}>Produktion - {parseDateToDanishDate(dateToDateString(this.props[PROP_ACTIVE_DATE]))}</Col>
          <Col sm={2}>
            <Button onClick={this.openCreateOrderModal.bind(this)}>Opret ny ordre</Button>
          </Col>
        </Row>
      { orders.length > 0 ?
        <Table>
          <thead>
            <tr>
              <th onClick={this.setSortingMethod(SortingMethods.STATUS).bind(this)}>Status</th>
              <th onClick={this.setSortingMethod(SortingMethods.ORDER_ID).bind(this)}>Order ID</th>
              <th onClick={this.setSortingMethod(SortingMethods.DESTINATION).bind(this)}>Destination</th>
              <th onClick={this.setSortingMethod(SortingMethods.TRACER).bind(this)}>Tracer</th>
              <th onClick={this.setSortingMethod(SortingMethods.INJECTIONS).bind(this)}>Injektioner</th>
              <th onClick={this.setSortingMethod(SortingMethods.ORDERED_TIME).bind(this)}>Bestilt Til</th>
              <th onClick={this.setSortingMethod(SortingMethods.USAGE).bind(this)}>Anvendelse</th>
              <th>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(this.renderIncompleteOrder.bind(this))}
          </tbody>
        </Table> :
          <div>
            <p>Der er ingen Special ordre af vise til {this.props[PROP_ACTIVE_DATE].getDate()}/{this.props[PROP_ACTIVE_DATE].getMonth() + 1}/{this.props[PROP_ACTIVE_DATE].getFullYear()}</p>
          </div>
      }

      {this.state.modal != Modals.NoModal ?
        <this.state.modal
          {...modalProps}
        ></this.state.modal> : ""}
      </Container>
    );
  }
}