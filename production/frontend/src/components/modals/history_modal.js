import React, { Component } from "react";
import { Button, FormControl, Modal, Spinner, Row, Col} from "react-bootstrap";
import { CSVLink } from "react-csv";
import { CloseButton } from "../injectable/buttons.js"
import { WEBSOCKET_DATA, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_HISTORY } from "~/lib/shared_constants";
import { FormatDateStr } from "~/lib/formatting";
import { changeState } from "~/lib/state_management";
import propTypes from "prop-types";
import { Select } from "../injectable/select.js";

import styles from '~/css/Site.module.css';

export { HistoryModal }

const Months = [
  {name : "Januar", val : 1},
  {name : "Februar", val : 2},
  {name : "Marts", val : 3},
  {name : "April", val : 4},
  {name : "Maj", val : 5},
  {name : "Juni", val : 6},
  {name : "Juli", val : 7},
  {name : "August", val : 8},
  {name : "September", val : 9},
  {name : "Oktober", val : 10},
  {name : "November", val : 11},
  {name : "December", val : 12},
]

class HistoryModal extends Component {
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
  static propTypes = {
    onClose : propTypes.func.isRequired,
    tracers : propTypes.objectOf(Map).isRequired,
    activeCustomer : propTypes.object.isRequired,
    //websocket
  }

  constructor(props){
    super(props);

    const today = new Date();

    this.state = {
      month : today.getMonth() + 1, // Note this uses a non-zero indexed month format
      year  : today.getFullYear(),
      state : "GET_MONTH",
      history : [],
    }
  }

  states = {
    GET_MONTH : this.renderGetMonth,
    LOADING  : this.renderLoading,
    DOWNLOAD : this.renderDownload
  }

  getHistory(){
    this.setState({...this.state, state : "LOADING"})
    const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_GET_HISTORY);
    message[WEBSOCKET_DATE] = `${this.state.year}-${FormatDateStr(this.state.month)}-01`;
    message[WEBSOCKET_DATA] = this.props.activeCustomer.ID;
    this.props.websocket.send(message).then(((response) => {
      const history = response[WEBSOCKET_DATA]
      const data = [];

      for (const TracerIDstr of Object.keys(history)){
        const Tracer = this.props.tracers.get(Number(TracerIDstr));
        for(const OrderList of history[TracerIDstr]){
          data.push([
              this.props.activeCustomer.UserName,
              Tracer.name,
            ].concat(OrderList))
        }
      }

      this.setState({
        state : "DOWNLOAD",
        history : data,
      })
    }));
  }

  resetModal(){
    this.setState({
      ...this.state,
      state : "GET_MONTH",
      history : [],
    })
  }

  // States:
  renderGetMonth(){
    return (
      <Row>
        <Col>
          <Select
            aria-label={"month-selector"}
            options={Months}
            valueKey="val"
            nameKey="name"
            onChange={changeState("month", this)}
            value={this.state.month}/>
        </Col>
        <Col>
          <FormControl aria-label="year-selector" value={this.state.year} onChange={changeState("year", this)}></FormControl>
        </Col>
        <Col>
          <Button onClick={this.getHistory.bind(this)}>Hent historik</Button>
        </Col>
    </Row>);
  }

  renderLoading(){
    return (
    <div className="text-center">
      <Spinner animation="border">
        <span className="visually-hidden">Loading</span>
      </Spinner>
    </div>);
  }

  renderDownload() {
    const noOrderStr = `Der er ingen ordre i ${this.state.month}/${this.state.year}`

    const Download = this.state.history.length ? <p><CSVLink data={this.state.history}><Button>Download</Button></CSVLink></p> :
     <p>{noOrderStr}</p>;

    return (<div>
      {Download}
      <Button onClick={this.resetModal.bind(this)}>Ny Historik</Button>
    </div>);
  }


  render(){
    const stateRenderingFunction = this.states[this.state.state].bind(this);

    return (
      <Modal
        onHide={this.props.onClose}
        show={true}
        className = {styles.mariLight}
      >
        <Modal.Header>
          Bestilling historik for {this.props.activeCustomer.UserName}
        </Modal.Header>
        <Modal.Body>
          {stateRenderingFunction()}
        </Modal.Body>
        <Modal.Footer>
          <CloseButton onClick={this.props.onClose}/>
        </Modal.Footer>
      </Modal>);
  }
}