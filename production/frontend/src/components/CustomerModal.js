import { ajax } from "jquery";
import React, { Component } from "react";
import { Modal, Button, Table, Row, FormControl } from "react-bootstrap";
import { FormatNumber, FormatTime } from "./lib/formatting"

export { CustomerModal }

const defaulState = {
  email1 : "",
  email2 : "",
  email3 : "",
  email4 : "",
  overhead :"",
  kundenr : "",
  tlf     : "",
  contant : "",
  max    : [],
  days   : [],
  repeat : [],
  dtime  : [],
  run    : [],
  DTID   : [],
  new_day : 1,
  new_run : 1,
  new_dtime : null,
  new_max   : null,
  new_repeat : 1
}


export default class CustomerModal extends Component {
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
      const NewModalState = {...this.state, 
        email1 : res["EMail1"],
        email2 : res["EMail2"],
        email3 : res["EMail3"],
        email4 : res["EMail4"],
        overhead : res["overhead"],
        kundenr : res["kundenr"],
        tlf     : res["tlf"],
        contact : res["contact"],
        max : res["max"],
        days : res["days"],
        repeat : res["repeat_t"],
        dtime : res["dtime"],
        run   : res["run"],
        DTID  : res["DTID"]
      }
      this.setState(NewModalState);
    });
  }

  AddOrder() {
    if (null === FormatTime(this.state.new_dtime)) return
    if (null === FormatNumber(this.state.new_max)) return

    // While i could use and perhaps should use POST / PUT / DELETE request, the problem is
    const message = {
      type : 1,
      max : this.state.new_max,
      run : this.state.new_run,
      dtime : this.state.new_dtime,
      repeat : this.state.new_repeat,
      day : this.state.new_day
    }

    ajax({
      url: "api/delivertimes",
      data:JSON.stringify(message),
      dataType : "json"
    }).then((res) => {
      const newState = {...this.state};
      newState["DTID"].push(1) //READ THIS VALUE FROM RES 
      newState["run"].push(this.state.new_run);
      newState["max"].push(this.state.new_max);
      newState["days"].push(this.state.new_day);
      newState["dtime"].push(this.state.new_dtime);
      newState["repeat"].push(this.state.new_repeat);

      newState["new_day"] = 1;
      newState["new_run"] = 1
      newState["new_dtime"] = null;
      newState["new_max"] = null;
      newState["new_repeat"] = 1;

      this.setState(newState)
    })
  }

  changeState(value, state) {
    const newState =  {...this.state};
    newState[state] = value;
    this.setState(newState);
  }

  changeStateList(value, state, i) {
    const newState =  {...this.state}
    const newStateList = newState[state];
    newStateList[i] = value;
    this.setState(newState);
  }


  renderDatePicker(defaultValue,i) {
    return (
      <select 
        defaultValue={defaultValue} 
        onChange={(event) => this.changeStateList(Number(event.target.value),"days",i)}
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

  renderRunPicker(defaultValue,i) {
    return (
      <select 
        defaultValue={defaultValue} 
        onChange={(event) => this.changeStateList(Number(event.target.value),"run",i) }
      >
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    );
  }

  renderReceiveTime(defaultValue,i) {
    return(
      <FormControl 
        defaultValue={defaultValue}
        onChange={(event) => {
          if (FormatTime(event.target.value) !== null) this.changeStateList(event.target.value, "dtime", i)
        }}
      />
    );
  }

  renderMaxOrder(defaultValue, i) {
    return(
      <FormControl 
        defaultValue={defaultValue} 
        onChange={(event) => {
          if (!isNaN(Number(event.target.value))) this.changeStateList(Number(event.target.value),"max",i)
        }}
      />
    );
  }

  renderRepeat(defaultValue, i) {
    return(
      <select 
        defaultValue={defaultValue} 
        onChange={
          (event) => this.changeStateList(Number(event.target.value),"repeat",i)
        }
      >
        <option value="1">Hver Uge</option>
        <option value="2">Lige Uger</option>
        <option value="3">Ulige Uger</option>
      </select>
    );
  } 
  
  renderRow (i) {
    const dts = this.state;
    return (
      <tr key={dts.DTID[i]}>
        <td>{this.renderDatePicker(dts.days[i],   i)}</td>
        <td>{this.renderRunPicker(dts.run[i],     i)}</td>
        <td>{this.renderReceiveTime(dts.dtime[i], i)}</td>
        <td>{this.renderMaxOrder(dts.max[i],      i)}</td>
        <td>{this.renderRepeat(dts.repeat[i],     i)}</td>
        <td><img src="static/images/decline.svg" className="tableButton" /></td>
      </tr>
    )
  }

  renderAddRow() {
    // Yeah there's dublicate code, that could be solved by some dependency injection & composition magic
    // Sorry for the bad code
    return(
      <tr key={0}>
        <td>
          <select onChange={(event) => this.changeState(Number(event.target.value),"new_day")}>
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
          <select onChange={(event) => this.changeState(Number(event.target.value),"new_run")}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </td>
        <td>
          <FormControl onChange={(event) => {if (FormatTime(event.target.value) !== null) this.changeState(event.target.value,"new_dtime")}}/>
        </td>
        <td>
          <FormControl onChange={(event) => {if (!isNaN(Number(event.target.value))) this.changeState(Number(event.target.value),"new_max")}}/>
        </td>
        <td>
          <select 
            onChange={(event) => this.changeState(Number(event.target.value),"new_repeat")}
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
    const Delivertimes = [];
    const info    = this.state;    
    for(let i=0; i < this.state.max.length; i++) {
      Delivertimes.push(this.renderRow(i));
    }
    Delivertimes.push(this.renderAddRow())

    return (
      <div>
        <Row>
          Kunde nummer: {info.kundenr}
        </Row>
        <Row>
          Kontakt: {info.contact}
        </Row>
        <Row>
          Telefon : {info.tlf}
        </Row>
        <Row>
          Email 1: {info.email1}
        </Row>
        <Row>
          Email 2: {info.email2}
        </Row>
        <Row>
          Email 3: {info.email3}
        </Row>
        <Row>
          Email 4: {info.email4}
        </Row>
        <Row>
          Overhead : 
            <FormControl 
              defaultValue={info.overhead}
              onChange={(event) => this.changeStateNumber(event, "overhead")}
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
            {Delivertimes}
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
          <Button onClick={ () => {
            // Never have a more hacky solution been made
            // I'm accutally proud at just how "unreact" this feels
            // They said state belongs to the child, they were wrong
            const state = this.state;
            this.props.saveModal(state)}
          }>
            Gem
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

/*
      


*/
