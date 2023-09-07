import React, { Component } from "react";
import { Container, Table, FormControl, Form } from "react-bootstrap";

import { TracerModal } from "../../modals/tracer_modal.js";
import { BooleanMapping } from "../../../lib/utils.js";
import { renderTableRow } from "../../../lib/rendering.js";
import { changeState } from "../../../lib/state_management.js";
import { renderClickableIcon, renderSelect } from "../../../lib/rendering.js";
import { JSON_TRACER,WEBSOCKET_MESSAGE_EDIT_STATE, TRACER_TYPE_ACTIVITY,
  TRACER_TYPE_DOSE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_TRACER_MAPPING, JSON_CUSTOMER, PROP_WEBSOCKET, JSON_ISOTOPE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE, WEBSOCKET_MESSAGE_MODEL_EDIT } from "../../../lib/constants.js";
import { Isotope, Tracer } from "../../../dataclasses/dataclasses.js";
import { ClickableIcon } from "../../injectable/icons.js";
import { Select } from "../../injectable/select.js";
import { HoverBox } from "../../injectable/hover_box.js";
import { Hover } from "react-hover";

export {TracerPage}

export default class TracerPage extends Component {
  constructor(props){
    super(props)


    this.TracerTypeOptions = [{
      id : TRACER_TYPE_ACTIVITY,
      name : "Aktivitet"
    },{
      id : TRACER_TYPE_DOSE,
      name : "Injektioner"
    }]

    this.isotopeOptions = []
    for(const _isotope of this.props[JSON_ISOTOPE].values()){
      const /**@type {Isotope} */ isotope = _isotope

      this.isotopeOptions.push({
        id : isotope.id,
        name : `${isotope.atomic_letter}-${isotope.atomic_mass}${isotope.metastable ? "m" : ""}`
      })
    }


    this.state = {
      filter : "",
      tracerID : null,
      showModal : false,

      tracers : new Map(this.props[JSON_TRACER]),

      newTracerName : "",
      newClinicalName : "",
      newIsotope    : 1,
      newInjections : 0,
      newOrderBlock : 0

    }
  }

  /** This checks if the tracer is maintains the data constains
   *
   * @param {Tracer} tracer - TracerDataclass object
   *
   */
  validateTracer(tracer){
    // Yes you could one line this, but its unreadable and not as maintainable, FIGHT ME
    if (tracer.shortname === 0) return false;

    tracer.isotope = Number(tracer.isotope);
    if (isNaN(tracer.isotope)) return false;

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
      const message = this.props.websocket.getMessage(WEBSOCKET_MESSAGE_MODEL_EDIT);
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
    return <Select
              options={this.isotopeOptions}
              valueKey="id"
              nameKey="name"
              onChange={eventFunction}
              value={initialValue}/>
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
      <td></td>
      <td><img src="/static/images/accept.svg" className="statusIcon" onClick={()=>this.createNewTracer()}/></td>
    </tr>);
  }

  /**
   * Render a Tracer Row
   * @param {Tracer} tracer tracer to be rendered
   * @returns {Element}
   */
  renderTracer(tracer) {
    const checked = tracer.in_use > 0;


    let catalog = <div/>;

    if(tracer.tracer_type == TRACER_TYPE_DOSE){
      catalog = <ClickableIcon
        src={"/static/images/setting.png"}
        onClick={() => {this.showTracerModal(tracer.id)}
      }/>
    }

    return renderTableRow(tracer.id,[
      <FormControl value={tracer.shortname} onChange={(event) =>
        {this.updateTracer(tracer.id, "shortname", event.target.value)}}/>,
      <FormControl value={tracer.clinical_name} onChange={(event) =>
        {this.updateTracer(tracer.id, "clinical_name", event.target.value)}}/>,
      this.renderIsotopeSelect(tracer.isotope, (event) =>
        {this.updateTracer(tracer.id, "isotope", event.target.value)}),
      <Select
        options={this.TracerTypeOptions}
        valueKey={"id"}
        nameKey={"name"}
        onChange={(event) => {this.updateTracer(tracer.id, "tracer_type", event.target.value)}}
        value={tracer.tracer_type}/>,
        catalog
    ]);
  }

  render() {
    const Tracers = []
    const filter = new RegExp(this.state.filter, 'g');
    for (const [_tracerID, _tracer] of this.state.tracers) {
      const /**@type {Tracer} */ tracer = _tracer
      if (filter.test(tracer.shortname)) Tracers.push(this.renderTracer(tracer));
    }
    Tracers.push(this.renderNewTracer());

    const tracerModalProps = {...this.props}

    tracerModalProps[PROP_ACTIVE_TRACER] = this.state.tracerID
    tracerModalProps[PROP_ON_CLOSE] = this.closeModal.bind(this)


    return (
    <Container>
      <FormControl 
        placeholder="Tracer Filter: "
        value={this.state.filter} onChange={changeState("filter", this).bind(this)}/>
      <Table>
        <thead>
          <tr>
            <th>
              <HoverBox
                Base={<div>Tracer</div>}
                Hover={<div>Dette er et kort navn brugt i daglig tale til at beskrive traceren.</div>}
              />
            </th>
            <th>
              <HoverBox
                Base={<div>Clinisk Navn</div>}
                Hover={<div>Dette er fulde navn på tracer, som bruges på føglesedlen.</div>}
              />
            </th>
            <th>
              <HoverBox
                Base={<div>Isotop</div>}
                Hover={<div>Dette er den radioaktive isotop, som benyttes i traceren</div>}
              />
            </th>
            <th>
              <HoverBox
                Base={<div>Tracer type</div>}
                Hover={<div>Bestemer om traceren bestilles som Aktivitet eller Injektioner tracer</div>}
              />
              </th>

            <th>
              <HoverBox
                Base={<div>Injektion Catalog</div>}
                Hover={<div>Her Konfigures hvilke kunder der kan bestille injektion tracer, Aktivitets Tracer bestillings tider konfigureres under kunder.</div>}
              />
              </th>
          </tr>
        </thead>
        <tbody>
          {Tracers}
        </tbody>
      </Table>
      { this.state.showModal ?
      <TracerModal
        {...tracerModalProps}
      /> : ""
    }
    </Container>);
  }
}