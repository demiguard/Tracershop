
import React, { useState } from "react";
import { Row, Col, Table, Button, Container } from 'react-bootstrap';
import propTypes from "prop-types"

import { PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_MODAL_ORDER } from "../../lib/constants.js";
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting.js";
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
import { IsotopeDisplay } from "~/components/injectable/data_displays/isotope_display.js";
import { EndpointDisplay } from "~/components/injectable/data_displays/endpoint.js";
import { InjectionOrderSortingMethods, sortInjectionOrders } from "~/lib/sorting.js";


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
  const [sortingMethod, _setSortingMethod] = useState(InjectionOrderSortingMethods.ORDERED_TIME);
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
    if(newMethod === sortingMethod){
      setInvertedSorting(!invertedSorting);
      return;
    } else {
      _setSortingMethod(newMethod);
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
    const isotope = state.isotopes.get(tracer.isotope);
    const endpoint = state.delivery_endpoint.get(order.endpoint)

    return (
      <tr>
        <td><StatusIcon
              label={`status-icon-${order.id}`}
              order={order}
              onClick={() => openOrderModal(order)}/>
        </td>
        <td>{order.id}</td>
        <td><EndpointDisplay endpoint={endpoint}/></td>
        <td><IsotopeDisplay isotope={isotope}/></td>
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

    orders.sort(sortInjectionOrders(sortingMethod, invertedSorting, state))

    const modalProps = {
      [PROP_ACTIVE_DATE] : active_date,
      [PROP_ON_CLOSE] : closeModal,
      [PROP_MODAL_ORDER] : ModalState.modalOrder,
    };

    return (
      <div>
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
              <th aria-label="sort-status"
                  onClick={() => {setSortingMethod(InjectionOrderSortingMethods.STATUS)}}>
                    Status
              </th>
              <th aria-label="sort-order-id"
                  onClick={() => {setSortingMethod(InjectionOrderSortingMethods.ORDER_ID)}}>
                    Order ID
              </th>
              <th aria-label="sort-destination"
                  onClick={() => {setSortingMethod(InjectionOrderSortingMethods.DESTINATION)}}>
                  Destination
              </th>
              <th aria-label="sort-isotope"
                  onClick={() => {setSortingMethod(InjectionOrderSortingMethods.ISOTOPE)}}>
                Isotop
              </th>
              <th
                aria-label="sort-tracer"
                onClick={() => {setSortingMethod(InjectionOrderSortingMethods.TRACER)}}>
                  Tracer
              </th>
              <th
                aria-label="sort-injections"
                onClick={() => {setSortingMethod(InjectionOrderSortingMethods.INJECTIONS)}}>
                  Injektioner
              </th>
              <th
                aria-label="sort-deliver-time"
                onClick={() => {setSortingMethod(InjectionOrderSortingMethods.ORDERED_TIME)}}>
                  Bestilt Til
              </th>
              <th
                aria-label="sort-usage"
                onClick={() => {setSortingMethod(InjectionOrderSortingMethods.USAGE)}}>
                  Anvendelse
              </th>
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
      </div>
    );
}

InjectionTable.propTypes = {
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}
