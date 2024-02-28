
import React, { useState } from "react";
import { Container, Table, Row, Col, Button, FormControl, Form } from "react-bootstrap";
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS} from "~/lib/shared_constants"
import { parseDate, parseDateToDanishDate } from "../../lib/formatting";

import { setStateToEvent } from "../../lib/state_management";

import { Vial } from "../../dataclasses/dataclasses";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { DateInput } from "../injectable/inputs/date_input";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { ErrorInput } from "../injectable/inputs/error_input";
import { parseDateInput } from "~/lib/user_input";


/**
 * Enum for different sorting options for vial table
 * @readonly
 * @enum {number}
 */
const SortingOptions = {
  ID: 0,
  CHARGE : 1,
  DATE : 2,
  TIME : 3,
  VOLUME : 4,
  ACTIVITY : 5,
  OWNER : 6,
  ORDER : 7,
}


export function VialPage(){
  const state = useTracershopState()
  const websocket = useWebsocket();
  // State
  const [lotNumber, setLotNumber] = useState("");
  const [customerID, setCustomer] = useState("");
  const [vialDay, setVialDay] = useState("");
  const [sortingOption, setSortingOption] = useState(SortingOptions.DATE);
  const [sortingInverted, setSortingInverted] = useState(true);
  const [dateError, setDateError] = useState("");
  /**
   * A row in the table
  * @param {{
    *   vial : Vial
    * }} param0
  * @returns {Element.JSX}
  */
 function VialRow({
   vial,
 }){
   const customer = state.customer.get(vial.owner)
   const customerName = customer === undefined ?
                            "Ukendt ejer"
                            : customer.short_name;

   return <tr>
     <td data-testid="id_field">{vial.id}</td>
     <td data-testid="lot_field">{vial.lot_number}</td>
     <td data-testid="date_field">{parseDateToDanishDate(vial.fill_date)}</td>
     <td data-testid="time_field">{vial.fill_time}</td>
     <td data-testid="volume_field">{vial.volume}</td>
     <td data-testid="activity_field">{vial.activity}</td>
     <td data-testid="owner_field">{customerName}</td>
     <td data-testid="order_field">{vial.assigned_to}</td>
   </tr>
}


  /**
   * Changes the sorting algorithm for the table, called when a user click on a header.
   * @param {SortingOptions} searchOption
   * @returns
   */
  function changeSearch(newSortingOption){
    return (_) => {
      if(sortingOption == newSortingOption){
        setSortingInverted(!sortingInverted);
      } else {
        setSortingOption(newSortingOption);
      }
    }
  }

  function fetchVials(){
    const [validDate, date] = parseDateInput(vialDay, "Søge datoen")
    if(validDate){
      setDateError("");
      const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS);
      message[WEBSOCKET_DATE] = date;
      websocket.send(message);
    } else {
      setDateError(date)
    }

  }

  const VialRows = [...state.vial.values()].filter(
    (vial) => {
      if(lotNumber !== "") {
        const regex = RegExp(lotNumber, 'g')
        if (!regex.test(vial.lot_number)){
          return false;
        }
      }
      if(customerID !== "") {
        const customerNumber = Number(customerID);
        if (customerNumber !== vial.owner){
          return false;
        }
      }
      return true;
    }).sort((vial1, vial2) => {
      const invertedSearchFactor = (sortingInverted) ? -1 : 1;
      switch (sortingOption) {
        case SortingOptions.ID:
          return invertedSearchFactor*(vial1.id - vial2.id);
        case SortingOptions.CHARGE:
          return invertedSearchFactor*((vial1.lot_number > vial2.lot_number) - (vial1.lot_number < vial2.lot_number));
        case SortingOptions.DATE:
          const date1 = new Date(vial1.fill_date).valueOf();
          const date2 = new Date(vial2.fill_date).valueOf();
          return (
            isFinite(date1) && isFinite(date2) ?
            invertedSearchFactor*((date1>date2) - (date1<date2)) :
            NaN
        );
        case SortingOptions.TIME:
          return invertedSearchFactor*((vial1.fill_time > vial2.fill_time) - (vial1.fill_time < vial2.fill_time));
        case SortingOptions.VOLUME:
          return invertedSearchFactor*(vial1.volume - vial2.volume);
        case SortingOptions.ACTIVITY:
          return invertedSearchFactor*(vial1.activity - vial2.activity);
        case SortingOptions.OWNER:
          return invertedSearchFactor*(vial1.customer - vial2.customer);
        case SortingOptions.ORDER:
          return invertedSearchFactor*(vial1.order_map - vial2.order_map)
        default:
          /*istanbul ignore next */
          throw "Unknown Search Option:" + sortingOption
      }
    }).map(
    (vial) => <VialRow key={vial.id} vial={vial}/>);

  return (
    <Container>
      <Row>
        <Col>
          <TracershopInputGroup label="Lot nummer Filter">
            <FormControl
              data-testid="lot_filter"
              value={lotNumber}
              onChange={setStateToEvent(setLotNumber)}
              placeholder="lot nummer"
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label="Kunde Filter">
            <CustomerSelect
              data-testid="customer-select"
              value={customerID}
              customers={state.customer}
              emptyCustomer
              onChange={setStateToEvent(setCustomer)}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label="Dato">
            <ErrorInput error={dateError}>
              <DateInput
                data-testid="date-input"
                value={vialDay}
                placeholder="DD/MM/YYYY"
                stateFunction={setVialDay}
              />
            </ErrorInput>
          </TracershopInputGroup>
        </Col>
        <Col>
          <Button  onClick={fetchVials}>Søg</Button>
        </Col>
      </Row>
      <Table>
        <thead>
          <tr>
            <th data-testid="header-ID" onClick={changeSearch(SortingOptions.ID)}>ID</th>
            <th data-testid="header-CHARGE" onClick={changeSearch(SortingOptions.CHARGE)}>Lot nummer</th>
            <th data-testid="header-DATE" onClick={changeSearch(SortingOptions.DATE)}>Dato</th>
            <th data-testid="header-TIME" onClick={changeSearch(SortingOptions.TIME)}>Tappe tidspunkt</th>
            <th data-testid="header-VOLUME" onClick={changeSearch(SortingOptions.VOLUME)}>Volume</th>
            <th data-testid="header-ACTIVITY" onClick={changeSearch(SortingOptions.ACTIVITY)}>Aktivitet</th>
            <th data-testid="header-OWNER" onClick={changeSearch(SortingOptions.OWNER)}>Ejer</th>
            <th data-testid="header-ORDER" onClick={changeSearch(SortingOptions.ORDER)}>Ordre</th>
          </tr>
        </thead>
        <tbody>
          {VialRows}
        </tbody>
      </Table>
    </Container>);
}