
import React, {Component, useState } from "react";
import { Container, Table, Row, Col, Button, FormControl, Form } from "react-bootstrap";
import { JSON_CUSTOMER, JSON_VIAL, PROP_WEBSOCKET, WEBSOCKET_DATATYPE, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_SUCCESS } from "../../lib/constants";
import { parseDate, parseDateToDanishDate, ParseJSONstr } from "../../lib/formatting";
import { addCharacter } from "../../lib/utils";
import { changeState, setStateToEvent } from "../../lib/state_management";
import propTypes from 'prop-types'
import { Tracer, Vial } from "../../dataclasses/dataclasses";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";
import { DateInput } from "../injectable/date_input";
import { TracerWebSocket } from "../../lib/tracer_websocket";


/**
 * Enum for different sorting options for vial table
 * @readonly
 * @enum {number}
 */
const SearchOptions = {
  ID: 0,
  CHARGE : 1,
  DATE : 2,
  TIME : 3,
  VOLUME : 4,
  ACTIVITY : 5,
  OWNER : 6,
  ORDER : 7,
}

/**
 * 
 * @param {{
 *   customers : Map<Number, Customer>
 *   vial : Vial
 * }} param0 
 * @returns 
 */
function VialRow({
  customers,
  vial,
}){
  const customer = customers.get(vial.owner)
  const customerName = customer === undefined ?
                          "Ukendt ejer" :
                          customer.short_name;

  return <tr>
    <td>{vial.id}</td>
    <td>{vial.lot_number}</td>
    <td>{parseDateToDanishDate(vial.fill_date)}</td>
    <td>{vial.fill_time}</td>
    <td>{vial.volume}</td>
    <td>{vial.activity}</td>
    <td>{customerName}</td>
    <td>{vial.assigned_to}</td>
  </tr>
}

export function VialPage(props){
  // State
  const [lotNumber, setLotNumber] = useState("");
  const [customerID, setCustomer] = useState("");
  const [vialDay, setVialDay] = useState("");
  const [searchOption, setSearchOption] = useState(SearchOptions.DATE);
  const [searchInverted, setSearchInverted] = useState(false);

  /**
   * 
   * @param {SearchOptions} searchOption 
   * @returns 
   */
  function changeSearch(newSearchOption){
    return (_) => {
      if(searchOption == newSearchOption){
        setSearchInverted(!searchInverted);
      } else {
        setSearchOption(newSearchOption);
      }
    }
  }

  function fetchVials(_){
    try {
      const date = parseDate(vialDay)
      if(!isNaN(date)) { // YEAH THIS WORK WITH DATES
        // I ASSUME IT*S BECAUSE JAVASCRIPT TREATS DAYS AS OBJECT AS AN INT SINCE 1970
        const /**@type {TracerWebSocket} */ websocket = props[PROP_WEBSOCKET];
        const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_ORDERS)
        message[WEBSOCKET_DATE] = date;
        websocket.send(message)
      }
    } catch {
      return
    }
  }

  const VialRows = [...props[JSON_VIAL].values()].filter(
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
      const invertedSearchFactor = (searchInverted) ? -1 : 1;
      switch (searchOption) {
        case SearchOptions.ID:
          return invertedSearchFactor*(vial1.id - vial2.id);
        case SearchOptions.CHARGE:
          return invertedSearchFactor*((vial1.lot_number > vial2.lot_number) - (vial1.lot_number < vial2.lot_number));
        case SearchOptions.DATE:
          const date1 = new Date(vial1.fill_date).valueOf();
          const date2 = new Date(vial2.fill_date).valueOf();
          return (
            isFinite(date1) && isFinite(date2) ?
            invertedSearchFactor*((date1>date2) - (date1<date2)) :
            NaN
        );
        case SearchOptions.TIME:
          return invertedSearchFactor*((vial1.fill_time > vial2.fill_time) - (vial1.fill_time < vial2.fill_time));
        case SearchOptions.VOLUME:
          return invertedSearchFactor*(vial1.volume - vial2.volume);
        case SearchOptions.ACTIVITY:
          return invertedSearchFactor*(vial1.activity - vial2.activity);
        case SearchOptions.OWNER:
          return invertedSearchFactor*(vial1.customer - vial2.customer);
        case SearchOptions.ORDER:
          return invertedSearchFactor*(vial1.order_map - vial2.order_map)
        default:
          /*istanbul ignore next */
          throw "Unknown Search Option:" + searchOption
      }
    }).map(
    (vial) => <VialRow
      key={vial.id}
      customers={props[JSON_CUSTOMER]}
      vial={vial}
  />);

  return (
    <Container>
      <Row>
        <Col>
          <TracershopInputGroup label="Lot nummer Filter">
            <FormControl
              value={lotNumber}
              onChange={setStateToEvent(setLotNumber)}
              placeholder="lot nummer"
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label="Kunde Filter">
            <CustomerSelect
              value={customerID}
              customer={props[JSON_CUSTOMER]}
              emptyCustomer
              onChange={setStateToEvent(setCustomer)}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
        <TracershopInputGroup label="Dato">
          <DateInput
            value={vialDay}
            placeholder="DD/MM/YYYY"
            stateFunction={setVialDay}
          />
          </TracershopInputGroup>
        </Col>
        <Col>
          <Button  onClick={fetchVials}>Søg</Button>
        </Col>
      </Row>
      <Table>
        <thead>
          <tr>
            <th onClick={changeSearch(SearchOptions.ID)}>ID</th>
            <th onClick={changeSearch(SearchOptions.CHARGE)}>Batch nummer</th>
            <th onClick={changeSearch(SearchOptions.DATE)}>Dato</th>
            <th onClick={changeSearch(SearchOptions.TIME)}>Tappe tidspunkt</th>
            <th onClick={changeSearch(SearchOptions.VOLUME)}>Volume</th>
            <th onClick={changeSearch(SearchOptions.ACTIVITY)}>Aktivitet</th>
            <th onClick={changeSearch(SearchOptions.OWNER)}>Ejer</th>
            <th onClick={changeSearch(SearchOptions.ORDER)}>Ordre</th>
          </tr>
        </thead>
        <tbody>
          {VialRows}
        </tbody>
      </Table>
    </Container>);
}