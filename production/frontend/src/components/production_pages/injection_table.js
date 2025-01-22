
import React, { useMemo, useState } from "react";
import { Row, Col, Table, Button, Container, FormCheck } from 'react-bootstrap';
import propTypes from "prop-types"

import { PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_MODAL_ORDER, ORDER_STATUS, PROP_SELECTED } from "../../lib/constants.js";
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting.js";
import { compareDates } from "../../lib/utils.js";
import { CreateInjectionOrderModal } from "../modals/create_injection_modal.js";
import { InjectionModal } from "../modals/injection_modal.js";
import { AcceptIconInjection, InjectionDeliveryIcon, StatusIcon } from "../injectable/icons.js";
import { InjectionOrder } from "~/dataclasses/dataclasses.js";
import { useTracershopState } from "../../contexts/tracer_shop_context.js";
import { InjectionUsage } from "../injectable/data_displays/injection_usage.js";
import { Comment } from "../injectable/data_displays/comment.js";
import { TracerDisplay } from "../injectable/data_displays/tracer_display.js";
import { TimeDisplay } from "../injectable/data_displays/time_display.js";
import { IsotopeDisplay } from "~/components/injectable/data_displays/isotope_display.js";
import { EndpointDisplay } from "~/components/injectable/data_displays/endpoint.js";
import { InjectionOrderSortingMethods, sortInjectionOrders } from "~/lib/sorting.js";
import { Optional } from "~/components/injectable/optional.js";
import { ReleaseManyInjectionOrdersModal } from "~/components/modals/release_many_injections_orders.js";
import { DATA_INJECTION_ORDER } from "~/lib/shared_constants.js";


/** @enum */
const Modals  = {
  NoModal : null,
  CreateOrder : CreateInjectionOrderModal,
  InjectionStatus : InjectionModal,
  FreeManyInjection : ReleaseManyInjectionOrdersModal,
}

/**
   *
   * @param {{
*    order : InjectionOrder,
*    openOrderModal : CallableFunction,
*    isSelected : Boolean,
*    onSelect : CallableFunction,
*    disabled : Boolean,
* }} props
* @returns
*/
function InjectionOrderRow({order, isSelected, onSelect,disabled, openOrderModal}) {
  const state = useTracershopState();

  const tracer = state.tracer.get(order.tracer);
  const isotope = state.isotopes.get(tracer.isotope);
  const endpoint = state.delivery_endpoint.get(order.endpoint);

  const actionButton = (() => {
    switch (order.status){
      case ORDER_STATUS.ORDERED:
        return <AcceptIconInjection orders={[order]}/>
      case ORDER_STATUS.ACCEPTED:
        return <FormCheck disabled={disabled} checked={isSelected} onClick={onSelect}/>
      case ORDER_STATUS.RELEASED:
        return <InjectionDeliveryIcon order={order}/>
      default:
        return null;
    }
  })();

  return (
   <tr>
     <td><StatusIcon
           label={`status-icon-${order.id}`}
           order={order}
           onClick={openOrderModal}/>
     </td>
     <td>{order.id}</td>
     <td><EndpointDisplay endpoint={endpoint}/></td>
     <td><IsotopeDisplay isotope={isotope}/></td>
     <td><TracerDisplay tracer={tracer}/></td>
     <td>{order.injections}</td>
     <td><TimeDisplay time={order.delivery_time}/> </td>
     <td><InjectionUsage usage={order.tracer_usage}/></td>
     <td><Comment comment={order.comment}/></td>
     <td>{actionButton}</td>
   </tr>
 );
}

/** Page that contains all injections orders for the active date
 *
 * @param {{
 *  active_date: str
 * }}
 */
export function InjectionTable({active_date}) {
  const state = useTracershopState();
  const danishDate = parseDateToDanishDate(dateToDateString(active_date))

  const /**@type {Array<InjectionOrder>} */ orders = useMemo(
    () => {
      const orders = [];

      for(const injectionOrder of state.injection_orders.values()){
        const orderDate = new Date(injectionOrder.delivery_date)
        if (compareDates(active_date, orderDate)){
          orders.push(injectionOrder);
        }
      }

      return orders;

    }, active_date, state.injection_orders
  );

  const [ModalState, setModalState] = useState({
    modal : Modals.NoModal,
    modalOrder : "",
  });
  const [sortingMethod, _setSortingMethod] = useState(InjectionOrderSortingMethods.ORDERED_TIME);
  const [invertedSorting, setInvertedSorting] = useState(false);
  // This is state for the id of the tracer, that the user is trying to release
  // It doesn't make sense that a user can free orders with multiple tracers
  // Also it's a single object because a single update will only trigger a
  // single rerender
  const [selection, setSelection] = useState({
    selected : new Set,
    acceptingTracer : null
  });

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

  function releaseMultipleOrdersButtonPressed(){
    setModalState({
      modal : Modals.FreeManyInjection,
    })
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
    return () => {
      setModalState({
        modal : Modals.InjectionStatus,
        modalOrder : order.id,
      });
    }
  }

  const sorted_orders = useMemo(() => {
    return [...orders].sort(sortInjectionOrders(sortingMethod, invertedSorting, state))
  }, [sortingMethod, invertedSorting, state]);

  const renderInjectedOrders = sorted_orders.map(order => {
    const isSelected = selection.selected.has(order.id);
    const disabled = selection.acceptingTracer ? order.tracer !== selection.acceptingTracer : false;
    function onSelect(){
      // I Don't even care if this is guaranteed by the runtime, it's a free check
      if(!disabled){ return; }
      if(isSelected){
        setSelection(oldSelection => {
          const newSelection = {...oldSelection,
            selected : new Set(oldSelection.oldSet)
          };

          if(oldSelection.selected.size === 1){
            newSelection.acceptingTracer = null;
          }

          newSelection.selected.delete(order.id);

          return newSelection;
        })
      } else {
        setSelection(oldSelection => {
          const newSelection = {
            selected : new Set(oldSelection.oldSet),
            acceptingTracer : order.tracer
          };

          newSelection.selected.add(order.id);
          return newSelection;
        })
      }
    }

    return <InjectionOrderRow
              key={order.id}
              order={order}
              selected={isSelected}
              disabled={disabled}
              onSelect={onSelect}
              openOrderModal={openOrderModal(order)}
           />
  });

  const modalProps = {
    [PROP_ACTIVE_DATE] : active_date,
    [PROP_ON_CLOSE] : closeModal,
    [PROP_MODAL_ORDER] : ModalState.modalOrder,
    [PROP_SELECTED] : selection.selected,
    orders : orders,
  };

  const noOrdersHTML = (
    <div>
      <p>Der er ingen Special ordre af vise til {danishDate}</p>
    </div>
  );

  return (
    <div>
      <Row>
        <Col sm={10}>Produktion - {danishDate}</Col>
        <Col sm={2}>
          <Button onClick={openCreateOrderModal}>Opret ny ordre</Button>
          <Optional exists={0 < selection.selected.size}>
            <Button onMouseDown={releaseMultipleOrdersButtonPressed}>
              Frigiv Flere ordre
            </Button>
          </Optional>
        </Col>
      </Row>
      <Optional exists={orders} alternative={noOrdersHTML}>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {renderInjectedOrders}
        </tbody>
      </Table>
    </Optional>
    <Optional exists={ModalState.modal}>
      <ModalState.modal {...modalProps}/>
    </Optional>
    </div>
  );
}

InjectionTable.propTypes = {
  [PROP_ACTIVE_DATE] : propTypes.objectOf(Date),
}
