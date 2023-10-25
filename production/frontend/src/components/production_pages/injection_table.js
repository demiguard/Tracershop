
import React, { useState } from "react";
import { Row, Col, Table, Button, Container } from 'react-bootstrap';
import propTypes from "prop-types"

import { INJECTION_USAGE,  PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_MODAL_ORDER } from "../../lib/constants.js";
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting.js";
import { renderTableRow, renderComment } from '~/lib/rendering.js';
import { compareDates } from "../../lib/utils.js";
import { CreateInjectionOrderModal } from "../modals/create_injection_modal.js";
import { InjectionModal } from "../modals/injection_modal.js";
import { StatusIcon } from "../injectable/icons.js";
import { InjectionOrder } from "~/dataclasses/dataclasses.js";
import { useTracershopState } from "../tracer_shop_context.js";
import { InjectionUsage } from "../injectable/data_displays/injection_usage.js";
import { Comment } from "../injectable/data_displays/comment.js";
import { TracerDisplay } from "../injectable/data_displays/tracer_display.js";
import { TimeDisplay } from "../injectable/data_displays/time_display.js";


const /**@Enum methods to sort the injection orders */ SortingMethods = {
  STATUS : 0,
  ORDER_ID : 1,
  DESTINATION : 2,
  TRACER : 3,
  INJECTIONS : 4,
  ORDERED_TIME : 5,
  USAGE : 6,
}

/** @enum */
const Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal,
  InjectionStatus : InjectionModal
}
/** Page that contains all injections orders
 *
 */
export function InjectionTable({active_date}) {
  const state = useTracershopState();
  const danishDate = parseDateToDanishDate(dateToDateString(active_date))

  const [ModalState, setModalState] = useState({
    modal : Modals.NoModal,
    modalOrder : "",
  });
  const [sortingMethod, _setSortingMethod] = useState(SortingMethods.ORDERED_TIME);
  const [invertedSorting, setInvertedSorting] = useState(false);

  function openCreateOrderModal(){
    setModalState({
      modal : Modals.CreateOrder
    });
  }

  function closeModal(){
    setModalState({
      modal : Modals.NoModal,
      modalOrder : "",
    });
  }

  function setSortingMethod(newMethod){
    return () => {
      if(newMethod === sortingMethod){
        setInvertedSorting(!invertedSorting);
        return;
      } else {
        _setSortingMethod(newMethod);
      }
    }
  }

  /**
   * Opens the injection modal for an order.
   * @param {InjectionOrder} order - Injection order that will open modal
   */
  function openOrderModal(order){
    setModalState({
      modal : Modals.InjectionStatus,
      modalOrder : order.id,
    });
  }

  /**
   * 
   * @param {{ 
   *    order : InjectionOrder
   * }} props 
   * @returns 
   */
  function OrderRow({order}) {
    const tracer = state.tracer.get(order.tracer);
    const endpoint = state.delivery_endpoint.get(order.endpoint)
    const customer = state.customer.get(endpoint.owner)

    return (
      <tr>
        <td><StatusIcon status={order.status} onClick={() => openOrderModal(order)}/></td>
        <td>{order.id}</td>
        <td>{customer.short_name} - {endpoint.name}</td>
        <td><TracerDisplay tracer={tracer}/></td>
        <td>{order.injections}</td>
        <td><TimeDisplay time={order.delivery_time}/> </td>
        <td><InjectionUsage usage={order.tracer_usage}/></td>
        <td><Comment comment={order.comment}/></td>
      </tr>
    );

  }


    const /**@type {Array<InjectionOrder>} */ orders = [];

    for(const injectionOrder of state.injection_orders.values()){
      const orderDate = new Date(injectionOrder.delivery_date)
      if (compareDates(active_date, orderDate)){
        orders.push(injectionOrder);
      }
    }

    orders.sort((a, b) => {
      switch(sortingMethod){
        case SortingMethods.STATUS:
          return invertedSorting ? b.status - a.status : a.status - b.status
        case SortingMethods.ORDER_ID:
          return invertedSorting ? b.id - a.id : a.id - b.id
        case SortingMethods.DESTINATION: {
          const aEndpoint = state.delivery_endpoint.get(a.endpoint);
          const aCustomer = state.customer.get(aEndpoint.owner);
          const bEndpoint = state.delivery_endpoint.get(b.endpoint);
          const bCustomer = state.customer.get(bEndpoint.owner);

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

    const modalProps = {
      [PROP_ACTIVE_DATE] : active_date,
      [PROP_ON_CLOSE] : closeModal,
      [PROP_MODAL_ORDER] : ModalState.modalOrder,
    };

    return (
      <Container>
        <Row>
          <Col sm={10}>Produktion - {danishDate}</Col>
          <Col sm={2}>
            <Button onClick={openCreateOrderModal}>Opret ny ordre</Button>
          </Col>
        </Row>
      { orders.length > 0 ?
        <Table>
          <thead>
            <tr>
              <th onClick={() => {setSortingMethod(SortingMethods.STATUS)}}>Status</th>
              <th onClick={() => {setSortingMethod(SortingMethods.ORDER_ID)}}>Order ID</th>
              <th onClick={() => {setSortingMethod(SortingMethods.DESTINATION)}}>Destination</th>
              <th onClick={() => {setSortingMethod(SortingMethods.TRACER)}}>Tracer</th>
              <th onClick={() => {setSortingMethod(SortingMethods.INJECTIONS)}}>Injektioner</th>
              <th onClick={() => {setSortingMethod(SortingMethods.ORDERED_TIME)}}>Bestilt Til</th>
              <th onClick={() => {setSortingMethod(SortingMethods.USAGE)}}>Anvendelse</th>
              <th>Kommentar</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => <OrderRow key={order.id} order={order}/>)}
          </tbody>
        </Table> :
          <div>
            <p>Der er ingen Special ordre af vise til {danishDate}</p>
          </div>
      }

      {ModalState.modal != Modals.NoModal ?
        <ModalState.modal
          {...modalProps}
        ></ModalState.modal> : ""}
      </Container>
    );
}

InjectionTable.propTypes = {
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}
