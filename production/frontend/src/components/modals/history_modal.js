import React, { Component } from "react";
import { Button, Form, FormControl, Modal, Spinner, Row, Col} from "react-bootstrap";
import { CSVDownload, CSVLink } from "react-csv";
import { TRACER_TYPE_ACTIVITY, WEBSOCKET_DATA, WEBSOCKET_DATE, WEBSOCKET_MESSAGE_GET_HISTORY } from "../../lib/constants";
import { FormatDateStr } from "../../lib/formatting";
import { renderOnClose, renderSelect } from "../../lib/rendering";
import { changeState } from "../../lib/state_management";

import styles from '../../css/Site.module.css';

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
  constructor(props){
    super(props);

    const today = new Date();

    this.state = {
      month : today.getMonth() + 1, // Note this uses a non-zero indexed month format
      year  : today.getFullYear(),
      state : "GETMONTH",
      hisotry : [],
    }
  }

  states = {
    GETMONTH : this.renderGetMonth,
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
        console.log(TracerIDstr)
        const Tracer = this.props.tracers.get(Number(TracerIDstr));
        for(const OrderList of history[TracerIDstr]){
          data.push([
              this.props.activeCustomer.UserName,
              Tracer.name,
            ].concat(OrderList))
        }
        data.push([])
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
      state : "GETMONTH",
      hisotry : [],
    })
  }

  // States:
  renderGetMonth(){
    return (
      <Row>
        <Col>
          {renderSelect(Months, "val", "name", changeState("month", this), this.state.month)}

        </Col>
        <Col>
          <FormControl value={this.state.year} onChange={changeState("year", this)}></FormControl>
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
    const Download = this.state.history.length ? <p><CSVLink data={this.state.history}><Button>Download</Button></CSVLink></p> : <p>Der er ingen Ordre i {this.state.month}/{this.state.year}</p>;

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
          {renderOnClose(this.props.onClose)}
        </Modal.Footer>
      </Modal>);
  }
}