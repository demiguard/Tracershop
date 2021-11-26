import React, { Component } from "react";
import { Container, Table, FormControl, Form } from "react-bootstrap";
import { ajax } from "jquery";
import TracerModal from "./TracerModal";
import { BooleanMapping } from "./lib/utils";
import { JSON_CUSTOMER, JSON_ISOTOPE, JSON_TRACER, JSON_TRACER_MAPPING, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE } from "./lib/constants";
import { ParseJSONstr } from "./lib/formatting";

export {ConfigPage}

export default class ConfigPage extends Component {
  constructor(props){
    super(props)

    this.state = {
      filter : "",
      tracerID : null,
      showModal : false,
      ModalTracerMap : new Map(),

      customers : new Map(),
      tracerCustomer : new Map(),
      tracers : new Map(),
      isotope : [],

      newTracerName : "",
      newIsotope    : 1,
      newInjections : 0,
      newOrderBlock : 0


    }

  Promise.all([this.getCustomers(), this.getTracers(), this.getTracerCustomersMapping()]).then(([
    customerJSON, TracerJSON, TracerCustomers
  ]) => {
    const TracerInfo = TracerJSON[JSON_TRACER];
    
    const newCustomerMap = new Map();
    const TracerMap = new Map(); 
    const TracerCustomerMap = new Map();

    for (const tracerString of TracerInfo) {
      const tracer = ParseJSONstr(tracerString);
      TracerMap.set(tracer.id, tracer); 
    }
    for(const CustomerString of customerJSON[JSON_CUSTOMER]){
      const Customer = ParseJSONstr(CustomerString);
      newCustomerMap.set(Customer.ID, Customer);
    }
    
    const Isotopes = [];
    for (const IsotopeString of TracerJSON[JSON_ISOTOPE]){
      Isotopes.push(ParseJSONstr(IsotopeString));
    }


    for(const tracerCustomerString of TracerCustomers[JSON_TRACER_MAPPING]){
      const tracerCustomer = ParseJSONstr(tracerCustomerString)
      if (TracerCustomerMap.has(tracerCustomer.tracer_id)) {
        const TracerMapping = TracerCustomerMap.get(tracerCustomer.tracer_id)
        TracerMapping.set(tracerCustomer.customer_id, true)
      } else {
        const TracerMapping = new Map();
        TracerMapping.set(tracerCustomer.customer_id, true);
        TracerCustomerMap.set(tracerCustomer.tracer_id, TracerMapping);
      }
    }

    this.setState({
      ...this.state,
      tracers : TracerMap,
      isotope : Isotopes,
      customers : newCustomerMap,
      tracerCustomer : TracerCustomerMap
      });
    });    
  }

  //Ajax getters
  getTracers(){
    return ajax({
      url:"api/gettracers"
    })
  }

  getCustomers(){
    return ajax({
      url:"api/getCustomers"
    })
  }

  getTracerCustomersMapping(){
    return ajax({
      url:"api/getTracerCustomerMapping"
    })
  }

  updateFilter(event) {
    const newState = {
      ...this.state,
      filter : event.target.value
    }
    this.setState(newState);
  }

  updateTracer(tracer, key, newValue ) {
    if (key == "n_injections" || key == "order_block") {
      newValue = Number(newValue);
      if (isNaN(newValue)) return;
    }
    ajax({
      url:"api/updateTracer",
      type:"post",
      dataType:"json",
      data : JSON.stringify({
        "tracer" : tracer.id,
        "key"    : key,
        "newValue" : newValue 
      })
    }).then(() => {
      const NewTracerMap = new Map(this.state.tracers);
      const newTracer = {...tracer}
      newTracer[key] = newValue;
      NewTracerMap.set(newTracer.id, newTracer);
      
      this.setState({...this.state,
        tracers : NewTracerMap
      })
    });
  }

  deleteTracer(){
    ajax({
      url:"api/deleteTracer",
      type:"POST", 
      dataType:"json",
      data:JSON.stringify({
        tracerID : this.state.tracerID
      })
    });

    const NewTracerMap = new Map(this.state.tracers);
    newTracerMap.delete(this.state.tracerID);

    const newState = { ...this.state,
      tracers : NewTracerMap,
      showModal : false,
      tracerID  : null
    };
    this.setState(newState);
  }


  //Curried Functions : https://stackoverflow.com/questions/36314/what-is-currying
  curriedIsotopeUpdateTracer(tracer){
    return function(event) {
      this.updateTracer(tracer, "isotope", Number(event.target.value))
    }.bind(this);
  }


  renderIsotopeSelect(initialValue, eventFunction) {
    const options = [];
    for (const isotope of this.state.isotope) {
      options.push((<option key={isotope.ID} value={isotope.ID}>{isotope.name}</option>))
    }

    return (
      <select 
        value={initialValue} 
        onChange={(event) => {eventFunction(event)}}>
        {options}
      </select>
    ) 
  }

  showTracerModal(tracerID){
    const ModalMap = (this.state.tracerCustomer.has(tracerID)) ? this.state.tracerCustomer.get(tracerID) : new Map();
    const newState = {...this.state,
      showModal : true,
      ModalTracerMap : ModalMap,
      tracerID : tracerID
    };
    this.setState(newState);
  }

  closeModal(){
    const newState = {...this.state,
      showModal : false
    };
    this.setState(newState);
  }


  createNewTracer(){
    ajax({
      url:"api/createNewTracer",
      method: "POST",
      dataType:"json",
      data: JSON.stringify({
        newTracerName : this.state.newTracerName,
        newIsotope : this.state.newIsotope,
        newInjections : this.state.newInjections,
        newOrderBlock : this.state.newOrderBlock
      })
    }).then((res) => {
      const newTracerMap = new Map();
      for (const tracer of res["tracers"]) {
        newTracerMap.set(tracer.id, tracer); 
      }
      
      
    
      const newState = {...this.state,
        tracers : newTracerMap,
        newTracerName : "",
        newIsotope : 1,
        newInjections : 0,
        newOrderBlock : 0
      };
      this.setState(newState)

    })

  }


  curriedChangeNewValue(){
    return function(event){
      this.changeNewValue("newIsotope", event);
    }.bind(this)
  }

  changeNewValue(key, event) {
    const newState = {...this.state}
    if (key == "newInjections" || key =="newIsotope" || key == "newOrderBlock"){
      const NumKey = Number(event.target.value);
      if (!isNaN(NumKey)){
        newState[key] = NumKey;
      }
    } else {
      newState[key] = event.target.value;
    }
    this.setState(newState);
  }

  renderNewTracer() {
    return(
    <tr key={-1}>
      <td><FormControl value={this.state.newTracerName} onChange={(event)=> this.changeNewValue("newTracerName", event)}/></td> 
      <td>{this.renderIsotopeSelect(this.state.newIsotope, this.curriedChangeNewValue())}</td> 
      <td><FormControl value={this.state.newInjections} onChange={(event)=> this.changeNewValue("newInjections", event)} /></td> 
      <td><FormControl value={this.state.newOrderBlock} onChange={(event)=> this.changeNewValue("newOrderBlock", event)}/></td> 
      <td></td>
      <td><img src="/static/images/accept.svg" className="statusIcon" onClick={()=>this.createNewTracer()}/></td>
    </tr>);
  }


  renderTracer(tracer) {
    const checked = tracer.in_use > 0;
    return(
    <tr key={tracer.id}>
      <td>
        <FormControl value={tracer.name} onChange={(event) => {this.updateTracer(tracer, "name", event.target.value)}}/>
      </td>
      <td>
        {this.renderIsotopeSelect(tracer.isotope, this.curriedIsotopeUpdateTracer(tracer))}
      </td>
      <td>
        <FormControl value={tracer.n_injections}  onChange={(event) => {this.updateTracer(tracer, "n_injections", event.target.value)}}/>
      </td>
      <td>
        <FormControl value={tracer.order_block}  onChange={(event) => {this.updateTracer(tracer, "order_block", event.target.value)}}/>
      </td>
      <td>
        <Form.Check
          defaultChecked={checked}
          type="checkbox"
          className="mb-2"
          onClick={(event) =>{
            this.updateTracer(tracer, "in_use", BooleanMapping(event.target.checked))
          }}
        />
      </td>
      <td>
          <select value={tracer.tracer_type} onChange={(event) => {this.updateTracer(tracer, "tracer_type", event.target.value)}}>
            <option value={TRACER_TYPE_ACTIVITY}>Activitet</option>
            <option value={TRACER_TYPE_DOSE}>Dose</option>
          </select>
      </td>
      <td>
        <img src="/static/images/setting2.png" className="statusIcon" onClick={(_event) => this.showTracerModal(tracer.id)}></img>
      </td>
    </tr>
    );
  }

  render() {
    const Tracers = []
    const filter = new RegExp(this.state.filter, 'g');
    for (const [_tracerID, tracer] of this.state.tracers) {
      if (filter.test(tracer.name)) Tracers.push(this.renderTracer(tracer));
    }
    Tracers.push(this.renderNewTracer());

    return (
    <Container>
      Tracer Filter: <FormControl value={this.state.filter} onChange={(event) => this.updateFilter(event)}/>
      <Table>
        <thead>
          <tr>
            <th>Tracer</th>
            <th>Isotope</th>
            <th>Injektioner</th>
            <th>Lås bestilling</th>
            <th>I brug</th>
            <th>Konfiguration</th>
          </tr>
        </thead>
        <tbody>
          {Tracers}
        </tbody>
      </Table>
      <TracerModal
        show           = {this.state.showModal}
        ModalTracerMap = {this.state.ModalTracerMap}
        customers      = {this.state.customers}
        onClose        = {this.closeModal.bind(this)} 
        tracerID       = {this.state.tracerID}
        deleteTracer   = {this.deleteTracer.bind(this)}
      />
    </Container>);
  }
}