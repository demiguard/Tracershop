
import React, { useMemo, useState } from "react";
import { Row, Col, Table, Button, Container, FormCheck } from 'react-bootstrap';
import { PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_MODAL_ORDER, ORDER_STATUS, PROP_SELECTED } from "~/lib/constants";
import { dateToDateString, parseDateToDanishDate } from "~/lib/formatting";
import { compareDates } from "~/lib/utils";
import { CreateInjectionOrderModal } from "../modals/create_injection_modal";
import { InjectionModal } from "../modals/injection_modal";
import { AcceptIcon, InjectionDeliveryIcon, StatusIcon } from "~/components/injectable/icons";
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { useTracershopState } from "../../contexts/tracer_shop_context";
import { InjectionUsage } from "../injectable/data_displays/injection_usage";
import { Comment } from "../injectable/data_displays/comment";
import { TracerDisplay } from "../injectable/data_displays/tracer_display";
import { TimeDisplay } from "../injectable/data_displays/time_display";
import { IsotopeDisplay } from "~/components/injectable/data_displays/isotope_display";
import { EndpointDisplay } from "~/components/injectable/data_displays/endpoint";
import { InjectionOrderSortingMethods, sortInjectionOrders } from "~/lib/sorting";
import { Optional } from "~/components/injectable/optional";
import { ReleaseManyInjectionOrdersModal } from "~/components/modals/release_many_injections_orders";
import { DISPLAY, MARGIN } from "~/lib/styles";
import { useUserReleaseRights } from "~/contexts/user_release_right";


/** @enum */
const Modals  = {
  NoModal : "",
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
function InjectionOrderRow({order, isSelected, onSelect, disabled, openOrderModal}) {
  const state = useTracershopState();

  const tracer = state.tracer.get(order.tracer);
  const isotope = state.isotopes.get(tracer.isotope);
  const endpoint = state.delivery_endpoint.get(order.endpoint);

  const actionButton = (() => {
    switch (order.status){
      case ORDER_STATUS.ORDERED:
        return <AcceptIcon data-testid={`accept-${order.id}`} orders={[order]}/>
      case ORDER_STATUS.ACCEPTED:
        return <FormCheck data-testid={`check-${order.id}`} disabled={disabled} checked={isSelected} onChange={onSelect}/>
      case ORDER_STATUS.RELEASED:
        return <InjectionDeliveryIcon data-testid={`delivery-${order.id}`} order={order}/>
      default:
        return "";
    }
  })();

  return (
   <tr>
     <td>
        <StatusIcon
           aria-label={`status-icon-${order.id}`}
           order={order}
           onClick={openOrderModal}
        />
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
export function InjectionTable() {
  const state = useTracershopState();
  const active_date = state.today
  const userReleaseRight = useUserReleaseRights();

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

    }, [active_date, state.injection_orders]
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
    setModalState(old => ({
      ...old,
      modal : Modals.FreeManyInjection,
    }));
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
  }, [orders, sortingMethod, invertedSorting]);

  const renderInjectedOrders = sorted_orders.map(order => {
    const isSelected = selection.selected.has(order.id);
    const canRelease = userReleaseRight.permissionForTracer(order.tracer);

    const disabled = canRelease && selection.acceptingTracer ? order.tracer !== selection.acceptingTracer : false;
    function onSelect(){
      // I Don't even care if this is guaranteed by the runtime, it's a free check
      if(disabled){ return; }

      if(isSelected){
        setSelection(oldSelection => {
          const newSelection = {...oldSelection,
            selected : new Set(oldSelection.selected)
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
            selected : new Set(oldSelection.selected),
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

  const modalExists = !!ModalState.modal;

  return (
    <div>
      <Row>
        <Col sm={6}><h3>Produktion - {danishDate}</h3></Col>
        <Col style={{...DISPLAY.FLEX}} className="flex-row-reverse flex" sm={6}>
          <Row style={MARGIN.leftRight.px15}>
            <Button onClick={openCreateOrderModal}>Opret ny ordre</Button>
          </Row>
          <Optional exists={0 < selection.selected.size}>
            <Row style={MARGIN.leftRight.px15}>
              <Button onClick={releaseMultipleOrdersButtonPressed}>
                Frigiv flere ordre
              </Button>
            </Row>
          </Optional>
        </Col>
      </Row>
      <Optional exists={0 < orders.length} alternative={noOrdersHTML}>
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
    <Optional exists={modalExists}>
      <ModalState.modal {...modalProps}/>
    </Optional>
    </div>
  );
}
