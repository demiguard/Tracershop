import React, { Component, useState } from "react";
import { Button, FormControl, Modal, Spinner, Row, Col} from "react-bootstrap";
import { CSVLink } from "react-csv";
import { CloseButton } from "../injectable/buttons.js"
import { WEBSOCKET_DATA, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_HISTORY } from "~/lib/shared_constants";
import { FormatDateStr } from "~/lib/formatting";
import { changeState, setStateToEvent } from "~/lib/state_management";
import propTypes from "prop-types";
import { Select, toOptions } from "../injectable/select.js";

import { PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE } from "~/lib/constants.js";
import { useTracershopState, useWebsocket } from "../tracer_shop_context.js";
import { FONT } from "~/lib/styles.js";

const Months = toOptions([
  {name : "Januar", id : 1},
  {name : "Februar", id : 2},
  {name : "Marts", id : 3},
  {name : "April", id : 4},
  {name : "Maj", id : 5},
  {name : "Juni", id : 6},
  {name : "Juli", id : 7},
  {name : "August", id : 8},
  {name : "September", id : 9},
  {name : "Oktober", id : 10},
  {name : "November", id : 11},
  {name : "December", id : 12},
]);

/**
 * @enum
 */
const LOADING_STATES = {
  GET_MONTH : 1,
  LOADING  : 2,
  DOWNLOAD : 3,
}

/** Modal for user to get order history / reciepts of a user.
   *    The modal have 3 states
   *      - Get Month / Year (Initial)
   *      - Loading Data
   *      - Data is ready to download
   *
   * There's no Price calculations in this
   *
   * @param {Object} props - Object with attributes:
   *    - onClose function - Callable, Closes this modal
   *    - Tracers - Map<int, Object>, Map over all the Tracers objects
   *    - ActiveCustomer - Object, Customer
   *    - websocket - TracerWebsocket, Websocket to do communication over
   */
export function HistoryModal({active_customer, on_close}) {
  const websocket = useWebsocket();
  const state = useTracershopState()
  const customer = state.customer.get(active_customer)
  const [loadingState, setLoadingState] = useState(LOADING_STATES.GET_MONTH)
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // Note there is a hidden -1
  // this is because javascript consider january the 0'th month.
  const [history, setHistory] = useState([]);


  function getHistory(){
    // Error Handling

    // Action
    setLoadingState(LOADING_STATES.LOADING);
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_HISTORY);
    message[WEBSOCKET_DATE] = `${year}-${FormatDateStr(month)}-01`;
    message[WEBSOCKET_DATA] = active_customer;
    websocket.send(message).then((response) => {
      const history = response[WEBSOCKET_DATA]
      const data = [];
      for (const TracerIDstr of Object.keys(history)){
        const tracer = state.tracer.get(Number(TracerIDstr));
        for(const OrderList of history[TracerIDstr]){
          data.push([
            customer.short_name,
            tracer.shortname,
          ].concat(OrderList))
        }
      }
      setHistory(data);
      setLoadingState(LOADING_STATES.DOWNLOAD);
    });
  }

  function resetModal(){
    setHistory([]);
    setLoadingState(LOADING_STATES.GET_MONTH);
  }

  // States:
  function GetMonthModalBody(){
    return (
      <Row>
        <Col>
          <Select
            aria-label={"month-selector"}
            options={Months}

            onChange={setStateToEvent(setMonth)}
            value={month}/>
        </Col>
        <Col>
          <FormControl
            aria-label="year-selector"
            value={year}
            onChange={setStateToEvent(setYear)}
          />
        </Col>
        <Col>
          <Button onClick={getHistory}>Hent historik</Button>
        </Col>
    </Row>);
  }

  function LoadingModalBody(){
    return (
    <div className="text-center">
      <Spinner animation="border">
        <span className="visually-hidden">Loading</span>
      </Spinner>
    </div>);
  }

  function DownloadModalBody() {
    const noOrderStr = `Der er ingen ordre i ${month}/${year}`

    const Download = history.length ? <p><CSVLink data={history}><Button>Download</Button></CSVLink></p> :
     <p>{noOrderStr}</p>;

    return (<div>
      {Download}
      <Button onClick={resetModal}>Ny Historik</Button>
      </div>);
    }

    const HistoricModalBody = (() => {
      switch (loadingState) {
        case LOADING_STATES.GET_MONTH:
          return GetMonthModalBody
        case LOADING_STATES.LOADING:
          return LoadingModalBody
        case LOADING_STATES.DOWNLOAD:
          return DownloadModalBody
        default:
          throw "undefined loading state!";
      }
    })()


    return (
      <Modal
        onHide={on_close}
        show={true}
        style={FONT.light}
      >
        <Modal.Header>
          Bestilling historik for {customer.short_name}
        </Modal.Header>
        <Modal.Body>
          <HistoricModalBody/>
        </Modal.Body>
        <Modal.Footer>
          <CloseButton onClick={on_close}/>
        </Modal.Footer>
      </Modal>);
}

HistoryModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [PROP_ACTIVE_CUSTOMER] : propTypes.number.isRequired,
}