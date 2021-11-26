import { ajax } from "jquery";
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl } from "react-bootstrap";
import { FormatNumber, FormatTime, ParseJSONstr } from "./lib/formatting.js"
import { JSON_CUSTOMER, JSON_DELIVERTIMES } from "./lib/constants.js"


export { CustomerModal }

const defaulState = {
  customer : {
    email1 : "",
    email2 : "",
    email3 : "",
    email4 : "",
    contact : "",
    tlf     : "",
    kundenr : "",
    overhead : 0
  },

  deliverTimes : new Map(),

  new_day : 1,
  new_run : 1,
  new_dtime : "",
  new_max   : 0,
  new_repeat : 1
}


class CustomerModal extends Component {
  constructor(props) {
    super(props)
    this.state = defaulState;
  }

  componentDidUpdate(prevProps) {
    if (this.props.userid !== prevProps.userid && this.props.userid !== null) {
      this.updateState(this.props.userid)
    }
  }

  updateState(key) {
    ajax({
      url: "/api/getCustomer/" + key, 
      type: "get"
    }).then((res) =>{ 
      const newDeliverTimeMap = new Map();
      for (const deliverTimeString of res[JSON_DELIVERTIMES]) {
        const deliverTime = ParseJSONstr(deliverTimeString);
        newDeliverTimeMap.set(deliverTime.DTID, deliverTime);
      }

      const NewModalState = {...this.state, 
        customer : ParseJSONstr(res[JSON_CUSTOMER]),
        deliverTimes : newDeliverTimeMap,
      }
      this.setState(NewModalState);
    });
  }

  AddOrder() {
    const newTime = FormatTime(this.state.new_dtime)
    if (null === newTime) return
    if (null === FormatNumber(this.state.new_max)) return


    // While i could use and perhaps should use POST / PUT / DELETE request, the problem is
    const message = {
      type : 1,
      max : this.state.new_max,
      run : this.state.new_run,
      dtime : newTime,
      repeat : this.state.new_repeat,
      day : this.state.new_day,
      customer : this.props.userid
    };

    ajax({
      url: "api/delivertimes",
      type:"POST",
      data:JSON.stringify(message),
      dataType : "json"
    }).then((resStr) => {
      const res = ParseJSONstr(resStr)
      const newDTID = res.newID;
      const newDeliverTimeMap = new Map(this.state.deliverTimes);
      newDeliverTimeMap.set(newDTID,{
        max    : this.state.new_max,
        run    : this.state.new_run,
        dtime  : newTime,
        repeat : this.state.new_repeat,
        day    : this.state.new_day,
        DTID   : newDTID
      });
      const newState = {...this.state,
        deliverTimes : newDeliverTimeMap,
        new_day : 1,
        new_run : 1,
        new_dtime : null,
        new_max : null,
        new_repeat : 1,
      };
      
      this.setState(newState);

      console.log(this.state);
    })
  }

  deleteRow(deliverTime){
    const newDeliverTimeMap = new Map(this.state.deliverTimes);
    newDeliverTimeMap.delete(deliverTime.DTID);
    const newState = {...this.state, 
      deliverTimes : newDeliverTimeMap
    };
    this.setState(newState);

    ajax({
      url:"api/delivertimes",
      type:"DELETE",
      datatype:"json",
      data:JSON.stringify({
        DTID : deliverTime.DTID
      })
    });
  }

  //Helper functions for NewState
  changeState(value, stateField) {
    const newState =  {...this.state};
    newState[stateField] = value;
    this.setState(newState);
  }

  changeDeliverTime(newValue, alteredFieldName, deliverTime){
    const newDeliverTime = {...deliverTime};
    newDeliverTime[alteredFieldName] = newValue;
    
    const newDeliverTimeMap = new Map(this.state.deliverTimes);
    newDeliverTimeMap.set(newDeliverTime.DTID, newDeliverTime);
    const newState = {...this.state, 
      deliverTimes : newDeliverTimeMap
    };
    this.setState(newState);
    //This sends the data 
    switch (alteredFieldName) {
      case "max":
        const newMax = Number(newValue);  
        if (isNaN(newMax)) return;
        newDeliverTime[alteredFieldName] = newMax; 
        break;
      case "dtime":
        const newDTime = FormatTime(newValue);
        if (newDTime === null) return;
        newDeliverTime[alteredFieldName] = newDTime;
        break;
    }
      
    ajax({
      url: "api/delivertimes",
      type:"PUT",
      dataType:"json",
      data:JSON.stringify(newDeliverTime)
    });
  }
  
  changeCustomer(event){
    const newOverheadValue = event.target.value;
    const isValidNumber = !isNaN(Number(newOverheadValue));
    const newOverhead = (isValidNumber) ? Number(newOverheadValue) : newOverheadValue;

    const newCustomer = {...this.state.customer,
      overhead : newOverhead
    };
    const newState = {...this.state, 
      customer : newCustomer
    };
    this.setState(newState);
    
    if (isValidNumber) ajax({
      url:"api/changeOverhead",
      type:"PUT",
      datatype:"json",
      data:JSON.stringify({
        UserID : this.props.userid,
        overhead : newOverhead
      })
    });

   
  }
  

  // Rendering Functions
  renderDatePicker(deliverTime) {
    return (
      <select 
        value={deliverTime.day} 
        onChange={(event) => this.changeDeliverTime(Number(event.target.value),"day", deliverTime)}
      >
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>
    );
  }

  renderRunPicker(deliverTime) {
    return (
      <select 
        value={deliverTime.run} 
        onChange={(event) => this.changeDeliverTime(Number(event.target.value),"run", deliverTime) }
      >
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    );
  }

  renderReceiveTime(deliverTime) {
    return(
      <FormControl 
        value={deliverTime.dtime}
        onChange={(event) => {
          this.changeDeliverTime(FormatTime(event.target.value), "dtime", deliverTime) 
        }}
      />
    );
  }

  renderMaxOrder(deliverTime) {
    return(
      <FormControl 
        value={deliverTime.max} 
        onChange={(event) => {
          this.changeDeliverTime(Number(event.target.value),"max", deliverTime)
        }}
      />
    );
  }

  renderRepeat(deliverTime) {
    return(
      <select 
        value={deliverTime.repeat} 
        onChange={
          (event) => this.changeDeliverTime(Number(event.target.value),"repeat", deliverTime)
        }
      >
        <option value="1">Hver Uge</option>
        <option value="2">Lige Uger</option>
        <option value="3">Ulige Uger</option>
      </select>
    );
  } 
 
  
  renderRow (deliverTime) {
    return (
      <tr key={deliverTime.DTID}>
        <td>{this.renderDatePicker(deliverTime)}</td>
        <td>{this.renderRunPicker(deliverTime)}</td>
        <td>{this.renderReceiveTime(deliverTime)}</td>
        <td>{this.renderMaxOrder(deliverTime)}</td>
        <td>{this.renderRepeat(deliverTime)}</td>
        <td><img src="static/images/decline.svg" className="tableButton" onClick={() => this.deleteRow(deliverTime)} /></td>
      </tr>
    )
  }

  renderAddRow() {
    // Yeah there's dublicate code, that could be solved by some dependency injection & composition magic
    // Sorry for the bad code
    return(
      <tr key={-1}>
        <td>
          <select
            onChange={(event) => this.changeState(Number(event.target.value),"new_day")}
            value={this.state.new_day}
            >
        <option value="1">Mandag</option>
        <option value="2">Tirsdag</option>
        <option value="3">Onsdag</option>
        <option value="4">Torsdag</option>
        <option value="5">Fredag</option>
        <option value="6">Lørdag</option>
        <option value="7">Søndag</option>
      </select>
        </td>
        <td>
          <select 
            onChange={(event) => this.changeState(Number(event.target.value),"new_run")}
            value={this.state.new_run}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </td>
        <td>
          <FormControl 
            onChange={(event) => {this.changeState(event.target.value,"new_dtime")}}
            value={this.state.new_dtime}
            />
        </td>
        <td>
          <FormControl 
            onChange={(event) => {this.changeState(Number(event.target.value),"new_max")}}
            value={this.state.new_max}
          />
        </td>
        <td>
          <select 
            onChange={(event) => this.changeState(Number(event.target.value),"new_repeat")}
            value={this.state.new_repeat}
          >
            <option value="1">Hver Uge</option>
            <option value="2">Lige Uger</option>
            <option value="3">Ulige Uger</option>
          </select>  
        </td>
        <td><img src="static/images/accept.svg" className="tableButton" onClick={this.AddOrder.bind(this)} /></td>
      </tr>
    );
  }

  renderbody(){
    const renderedDeliverTimes = [];
    for(const [_DTID, deliverTime] of this.state.deliverTimes.entries()) {
      renderedDeliverTimes.push(this.renderRow(deliverTime));
    }
    renderedDeliverTimes.push(this.renderAddRow());

    return (
      <div>
        <Row> Kunde nummer: {this.state.customer.kundenr} </Row>
        <Row> Kontakt:      {this.state.customer.contact} </Row>
        <Row> Telefon :     {this.state.customer.tlf} </Row>
        <Row> Email 1:      {this.state.customer.email1} </Row>
        <Row> Email 2:      {this.state.customer.email2} </Row>
        <Row> Email 3:      {this.state.customer.email3} </Row>
        <Row> Email 4:      {this.state.customer.email4}  </Row>
        <Row> Overhead : 
            <FormControl 
              value={this.state.customer.overhead}
              onChange={this.changeCustomer.bind(this)}
            />
        </Row>
        <Table>
          <thead>
            <tr>
              <th>Ugedag</th>
              <th>Kørsel</th>
              <th>Modtagetid</th>
              <th>Max (MBQ)</th>
              <th>Gentage</th>
              <th/>
            </tr>
          </thead>
          <tbody>
            {renderedDeliverTimes}
          </tbody>
        </Table>
      </div>
    );
  }
  
  render() {
    return (
      <Modal 
        show={this.props.show} 
        size="lg"
        onHide ={this.props.onClose}
      >
        <Modal.Header>
          <Modal.Title>Kunde Konfigurering</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderbody()}        
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onClose}>
            Luk
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
