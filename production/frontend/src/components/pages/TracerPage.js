import React, { Component } from "react";
import { Container, Table, FormControl, Form } from "react-bootstrap";
import { ajax } from "jquery";
import TracerModal from "/src/components/modals/TracerModal";
import { BooleanMapping } from "/src/lib/utils";
import { JSON_TRACER,WEBSOCKET_MESSAGE_EDIT_STATE, TRACER_TYPE_ACTIVITY, TRACER_TYPE_DOSE } from "/src/lib/constants";
import { renderTableRow } from "/src/lib/Rendering";

export {TracerPage}

export default class TracerPage extends Component {
  constructor(props){
    super(props)

    this.state = {
      filter : "",
      tracerID : null,
      showModal : false,

      tracers : new Map(this.props.tracers),

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
    const ModalMap = (this.state.tracerCustomer.has(tracerID)) ? this.state.tracerCustomer.get(tracerID) : new Map();
    const newState = {...this.state,
      showModal : true,
      ModalTracerMap : ModalMap,
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
    const options = [];

    for (const [_, isotope] of this.props.isotopes) {
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
            tracer, "in_use", BooleanMapping(event.target.checked))
          }}
      />,
      <select value={tracer.tracer_type} onChange={(event) =>
        {this.updateTracer(tracer, "tracer_type", event.target.value)}}>
        <option value={TRACER_TYPE_ACTIVITY}>Activitet</option>
        <option value={TRACER_TYPE_DOSE}>Dose</option>
      </select>,
      <img src="/static/images/setting2.png" className="statusIcon"
        onClick={(_event) => this.showTracerModal(tracer.id)}></img>
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
      { this.state.showModal ?
      <TracerModal
      show           = {this.state.showModal}
      ModalTracerMap = {this.state.ModalTracerMap}
      customers      = {this.props.customer}
      onClose        = {this.closeModal.bind(this)}
      tracerID       = {this.state.tracerID}
      /> : ""
    }
    </Container>);
  }
}