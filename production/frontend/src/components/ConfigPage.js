import React, { Component } from "react";
import { Container, Table, FormControl } from "react-bootstrap";
import { ajax } from "jquery";
import TracerModal from "./TracerModal";

export {ConfigPage}

export default class ConfigPage extends Component {
  constructor(props){
    super(props)

    this.state = {
      tracerID : null,
      showModal : false,
      ModalTracerMap : new Map(),

      customers : new Map(),
      tracerCustomer : new Map(),
      tracers : new Map(),
      isotope : []
    }

  Promise.all([this.getCustomers(), this.getTracers(), this.getTracerCustomers()]).then(([
    customerJSON, TracerJSON, TracerCustomers
  ]) => {
    const TracerInfo = TracerJSON["tracer"];
    const Isotopes   = TracerJSON["isotope"]
      
    const newCustomerMap = new Map();
    const TracerMap = new Map(); 
    const TracerCustomerMap = new Map();

    for (const tracer of TracerInfo) {
      TracerMap.set(tracer.id, tracer); 
    }
    for(const Customer of customerJSON["customers"]){
      newCustomerMap.set(Customer.ID, Customer)
    }
    
    for(const tracerCustomer of TracerCustomers["data"]){
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

    console.log(this.state);
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

  getTracerCustomers(){
    return ajax({
      url:"api/getTracerCustomer"
    })
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


  renderIsotopeSelect(tracer) {
    const options = [];
    for (const isotope of this.state.isotope) {
      options.push((<option key={isotope.ID} value={isotope.ID}>{isotope.name}</option>))
    }

    return (
      <select 
        value={tracer.isotope} 
        onChange={(event) => {this.updateTracer(tracer, "isotope", Number(event.target.value))}}>
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

  renderTracer(tracer) {
    return(
    <tr key={tracer.id}>
      <td>
        <FormControl value={tracer.name} onChange={(event) => {this.updateTracer(tracer, "name", event.target.value)}}/>
      </td>
      <td>
        {this.renderIsotopeSelect(tracer)}
      </td>
      <td>
        <FormControl value={tracer.n_injections}  onChange={(event) => {this.updateTracer(tracer, "n_injections", event.target.value)}}/>
      </td>
      <td>
        <FormControl value={tracer.order_block}  onChange={(event) => {this.updateTracer(tracer, "order_block", event.target.value)}}/>
      </td>
      <td>
        <img src="/static/images/setting2.png" className="statusIcon" onClick={(_event) => this.showTracerModal(tracer.id)}></img>
      </td>
    </tr>
    );
  }

  render() {
    const Tracers = []
    for (const [_tracerID, tracer] of this.state.tracers) {
      Tracers.push(this.renderTracer(tracer));
    }

    return (
    <Container>
      <Table>
        <thead>
          <tr>
            <th>Tracer</th>
            <th>Isotope</th>
            <th>Injektioner</th>
            <th>Lås bestilling</th>
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
      />
    </Container>);
  }
}