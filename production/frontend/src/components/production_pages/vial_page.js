
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Container, Table, Row, Col, Button, FormControl, Form } from "react-bootstrap";

//
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_ORDERS, WEBSOCKET_MESSAGE_RESTART_VIAL_DOG, WEBSOCKET_MESSAGE_TYPE} from "~/lib/shared_constants"
import { dateToDateString, parseDateToDanishDate } from "../../lib/formatting";
import { setStateToEvent } from "../../lib/state_management";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { DateInput } from "../injectable/inputs/date_input";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { ErrorInput } from "../injectable/inputs/error_input";
import { parseDateInput } from "~/lib/user_input";
import { MarginButton } from "~/components/injectable/buttons";
import { UpdateToday } from "~/lib/state_actions";
import { clamp } from "~/lib/utils";
import { ClickableIcon, IdempotentIcon } from "~/components/injectable/icons";
import { HoverBox } from "~/components/injectable/hover_box";
import { Option, Select, toOptions } from "~/components/injectable/select";
import { cssCenter } from "~/lib/constants";
import { Optional } from "~/components/injectable/optional";


const vialRowHeight = 41; // in pixels

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

function VialRow({vial}){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const server_config = state.server_config.get(1);
  const customer = state.customer.get(vial.owner);
  const customerName = customer === undefined ?
                                 "Ukendt ejer"
                                 : customer.short_name;

  const labelPrinter = state.printer.get(server_config.active_label_printer);
  const printer = state.printer.get(server_config.active_printer);

  const labelPrinterName = labelPrinter ? labelPrinter.name : "";
  const printerName = printer ? printer.name : ""

  function printVial(){
    return
  }

  return <tr style={{ height : `${vialRowHeight}px` }} key={vial.id}>
    <td data-testid="id_field">{vial.id}</td>
    <td data-testid="lot_field">{vial.lot_number}</td>
    <td data-testid="date_field">{parseDateToDanishDate(vial.fill_date)}</td>
    <td data-testid="time_field">{vial.fill_time}</td>
    <td data-testid="volume_field">{vial.volume}</td>
    <td data-testid="activity_field">{vial.activity}</td>
    <td data-testid="owner_field">{customerName}</td>
    <td data-testid="order_field">{vial.assigned_to}</td>
    <td data-testid="print">
      <HoverBox
        displayType={"block ruby"}
        Base={
          <ClickableIcon src={"static/images/printer.svg"}/>
        }
        Hover={
          <Container>
            <Row>
              <Optional exists={printer !== undefined} alternative={<div>Der er ingen normal printer sat op</div>}>
                <Col>Føgleseddel - {printerName}</Col>
                <Col xs={2}>
                  <ClickableIcon src={"static/images/printer.svg"}/>
                </Col>
              </Optional>

            </Row>
            <Row>
              <Optional exists={labelPrinter !== undefined} alternative={<div>Der er ingen label printer sat op</div>}>
                <Col>Label - {labelPrinterName}</Col>
                <Col xs={2}>
                  <ClickableIcon src={"static/images/printer.svg"}/>
                </Col>
              </Optional>
            </Row>
          </Container>
        }
      >

      </HoverBox>

    </td>
  </tr>
}


export function VialPage(){
  const state = useTracershopState();
  const dispatch = useTracershopDispatch();
  const websocket = useWebsocket();
  // State
  const [lotNumber, setLotNumber] = useState("");
  const [customerID, setCustomer] = useState("");
  const [vialDay, setVialDay] = useState("");
  const [sortingOption, setSortingOption] = useState(SortingOptions.DATE);
  const [sortingInverted, setSortingInverted] = useState(true);
  const [dateError, setDateError] = useState("");

  const overflowDivRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [heightOffset, setHeightOffset] = useState(0);
  const contentHeight = state.vial.size * vialRowHeight;


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

  function restartVialDog() {
    websocket.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_RESTART_VIAL_DOG
    });
  }

  function fetchVials(){
    const [validDate, date] = parseDateInput(vialDay, "Søge datoen");
    if(validDate){
      dispatch(new UpdateToday(date, websocket));
    } else {
      setDateError(date)
    }
  }

  function wheel_trigger_function(event){
    setScrollOffset((oldOffset) => clamp(oldOffset + event.deltaY, 0, contentHeight));
  }

  useEffect(() => {
    window.addEventListener('wheel', wheel_trigger_function)
    return () => {window.removeEventListener('wheel', wheel_trigger_function)};
  }, [])

  useEffect(() => {
    if(overflowDivRef.current){
      const { y } = overflowDivRef.current.getBoundingClientRect();
      setHeightOffset(y);
    }
  },[overflowDivRef.current]);

  const filteredSortedVials = useMemo(() => {
    return [...state.vial.values()].filter(
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
        const [validDate, date] = parseDateInput(vialDay)
        if(validDate){
          if(dateToDateString(date) !== vial.fill_date){
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
            if(date1 != date2){
              return (
                isFinite(date1) && isFinite(date2) ?
                invertedSearchFactor*((date1>date2) - (date1<date2)) :
                NaN
              );
            } else {
              return invertedSearchFactor*((vial1.fill_time > vial2.fill_time) - (vial1.fill_time < vial2.fill_time));
            }
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
      });
  }, [state.vial, customerID, vialDay, lotNumber, sortingInverted, sortingOption]);

  const VialRows = useMemo(() => {
    if (!overflowDivRef.current){
      return [];
    }
    const containerHeight = overflowDivRef.current.clientHeight;

    const visibleRowCount = Math.ceil(containerHeight / vialRowHeight);
    const startIndex = clamp(Math.floor(scrollOffset / vialRowHeight), 0, filteredSortedVials.length - visibleRowCount);
    const endIndex = Math.min(startIndex + visibleRowCount + 2, filteredSortedVials.length);
    return filteredSortedVials.slice(startIndex, endIndex).map(
      (vial, index) => <VialRow vial={vial} key={index + startIndex}/>
    );
  }, [overflowDivRef.current, filteredSortedVials, scrollOffset]);

  const overflowDivHeight = `calc(100vh - ${heightOffset + 4 * vialRowHeight}px)`;

  return (
    <div>
      <Row className="justify-content-center">
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
            <div style={{
              display : "ruby"
            }}>
              <TracershopInputGroup label="Kunde Filter">
                <CustomerSelect
                  data-testid="customer-select"
                  value={customerID}
                  customers={state.customer}
                  emptyCustomer
                  onChange={setStateToEvent(setCustomer)}
                  />
              </TracershopInputGroup>
          </div>
        </Col>
        <Col>
          <TracershopInputGroup label="Dato" error={dateError}>
              <DateInput
                data-testid="date-input"
                value={vialDay}
                placeholder="DD/MM/YYYY"
                stateFunction={setVialDay}
              />
          </TracershopInputGroup>
        </Col>
        <Col>
          <MarginButton onMouseDown={fetchVials}>Søg</MarginButton>
          <MarginButton onMouseDown={restartVialDog}>Hent manglende glas</MarginButton>
        </Col>
      </Row>
      <div ref={overflowDivRef} style={{height : overflowDivHeight}}>
        <Table>
          <thead>
            <tr>
              <th data-testid="header-ID" onClick={changeSearch(SortingOptions.ID)}>ID</th>
              <th data-testid="header-CHARGE" onClick={changeSearch(SortingOptions.CHARGE)}>Lot nummer</th>
              <th data-testid="header-DATE" onClick={changeSearch(SortingOptions.DATE)}>Dato</th>
              <th data-testid="header-TIME" onClick={changeSearch(SortingOptions.TIME)}>Tappe tidspunkt</th>
              <th data-testid="header-VOLUME" onClick={changeSearch(SortingOptions.VOLUME)}>Volumen</th>
              <th data-testid="header-ACTIVITY" onClick={changeSearch(SortingOptions.ACTIVITY)}>Aktivitet</th>
              <th data-testid="header-OWNER" onClick={changeSearch(SortingOptions.OWNER)}>Ejer</th>
              <th data-testid="header-ORDER" onClick={changeSearch(SortingOptions.ORDER)}>Ordre</th>
              <th data-testid="header-print">Print</th>
            </tr>
          </thead>
          <tbody style={{overflow: "auto"}}>
            {VialRows}
          </tbody>
        </Table>
      </div>
  </div>);
}