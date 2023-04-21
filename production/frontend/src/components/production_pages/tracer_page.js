import React, { Component } from "react";
import { Container, Table, FormControl, Form } from "react-bootstrap";

import { TracerModal } from "../modals/tracer_modal.js";
import { BooleanMapping } from "../../lib/utils.js";
import { renderTableRow } from "../../lib/rendering.js";
import { changeState } from "../../lib/state_management.js";
import { renderClickableIcon, renderSelect } from "../../lib/rendering.js";
import { JSON_TRACER,WEBSOCKET_MESSAGE_EDIT_STATE, TRACER_TYPE_ACTIVITY,
  TRACER_TYPE_DOSE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_TRACER_MAPPING, JSON_CUSTOMER, PROP_WEBSOCKET } from "../../lib/constants.js";

export {TracerPage}

export default class TracerPage extends Component {
  constructor(props){
    super(props)

    this.state = {
      filter : "",
      tracerID : null,
      showModal : false,

      tracers : new Map(this.props[JSON_TRACER]),

      newTracerName : "",
      newIsotope    : 1,
      newInjections : 0,
      newOrderBlock : 0

    }
  }

  /** This checks if the tracer is maintains the data constains
   *
   * @param {Object} tracer - TracerDataclass object
   *
   */
  validateTracer(tracer){
    // Yes you could one line this, but its unreadable and not as maintainable, FIGHT ME
    if (tracer.name.length === 0) return false;

    tracer.isotope = Number(tracer.isotope);
    if (isNaN(tracer.isotope)) return false;

    tracer.n_injections = Number(tracer.n_injections);
    if (isNaN(tracer.n_injections)) return false;

    tracer.order_block = Number(tracer.order_block);
    if (isNaN(tracer.order_block)) return false;

    return true;
  }


  showTracerModal(tracerID){
    const newState = {...this.state,
      showModal : true,
      tracerID : tracerID
    };
    this.setState(newState);
  }

  closeModal(){
    this.setState({...this.state, showModal : false });
  }

  updateFilter(event){
    this.setState({...this.state, filter: event.target.value});
  }

  updateTracer(tracerID, tracerKey, value){
    // make an edit locally then send it to the server
    const Tracer = this.state.tracers.get(tracerID);
    Tracer[tracerKey] = value; // this might be a string value

    const Tracers = new Map(this.state.tracers);
    Tracers.set(tracerID, {...Tracer});
    this.setState({...this.state, tracers : Tracers});

    if(this.validateTracer(Tracer)){
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_EDIT_STATE);
      message[WEBSOCKET_DATA] = Tracer;
      message[WEBSOCKET_DATATYPE] = JSON_TRACER;
      this.props.websocket.send(message);
    }
  }

  NewIsotopeChange(){
    return function(event){
      this.changeNewValue("newIsotope", event);
    }.bind(this)
  }

  renderIsotopeSelect(initialValue, eventFunction) {
    return renderSelect(this.props.isotopes.values(), "ID", "name", eventFunction, initialValue);
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
      <td>{this.renderIsotopeSelect(this.state.newIsotope, this.NewIsotopeChange())}</td>
      <td><FormControl value={this.state.newInjections} onChange={(event)=> this.changeNewValue("newInjections", event)} /></td>
      <td><FormControl value={this.state.newOrderBlock} onChange={(event)=> this.changeNewValue("newOrderBlock", event)}/></td>
      <td></td>
      <td><img src="/static/images/accept.svg" className="statusIcon" onClick={()=>this.createNewTracer()}/></td>
    </tr>);
  }


  renderTracer(tracer) {
    const checked = tracer.in_use > 0;
    const TracerTypeOptions = [{
      id : TRACER_TYPE_ACTIVITY,
      name : "Aktivitet"
    },{
      id : TRACER_TYPE_DOSE,
      name : "Injektioner"
    }]

    return renderTableRow(tracer.id,[
      <FormControl value={tracer.name} onChange={(event) =>
        {this.updateTracer(tracer.id, "name", event.target.value)}}/>,
      this.renderIsotopeSelect(tracer.isotope, (event) =>
        {this.updateTracer(tracer.id, "isotope", event.target.value)}),
      <FormControl value={tracer.n_injections}  onChange={(event) =>
        {this.updateTracer(tracer.id, "n_injections", event.target.value)}}/>,
      <FormControl value={tracer.order_block}  onChange={(event) =>
        {this.updateTracer(tracer.id, "order_block", event.target.value)}}/>,
      <Form.Check
        defaultChecked={checked} type="checkbox" className="mb-2"
          onClick={(event) => {this.updateTracer(
            tracer.id, "in_use", BooleanMapping(event.target.checked))
          }}
      />,
      renderSelect(TracerTypeOptions, "id", "name", (event) => {
        this.updateTracer(tracer.id, "tracer_type", event.target.value)
      }, tracer.tracer_type),
      renderClickableIcon("/static/images/setting.png", () => {
        this.showTracerModal(tracer.id)
      })
    ]);
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
      Tracer Filter: <FormControl value={this.state.filter} onChange={changeState("filter", this).bind(this)}/>
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
      { this.state.showModal ?
      <TracerModal
      show           = {this.state.showModal}
      tracerMapping  = {this.props[JSON_TRACER_MAPPING]}
      customers      = {this.props[JSON_CUSTOMER]}
      onClose        = {this.closeModal.bind(this)}
      tracerID       = {this.state.tracerID}
      websocket      = {this.props[PROP_WEBSOCKET]}
      /> : ""
    }
    </Container>);
  }
}