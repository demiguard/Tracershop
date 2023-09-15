import React, { Component, useState } from "react";
import { Container, Table, FormControl, Form, Row, Card, Collapse , Col} from "react-bootstrap";

import { TracerModal } from "../../modals/tracer_modal.js";
import { setStateToEvent } from "../../../lib/state_management.js";
import { JSON_TRACER,WEBSOCKET_MESSAGE_EDIT_STATE, TRACER_TYPE_ACTIVITY,
  TRACER_TYPE_DOSE, WEBSOCKET_DATA, WEBSOCKET_DATATYPE, JSON_TRACER_MAPPING,
  JSON_CUSTOMER, PROP_WEBSOCKET, JSON_ISOTOPE, PROP_ACTIVE_TRACER, PROP_ON_CLOSE,
  WEBSOCKET_MESSAGE_MODEL_EDIT, TracerTypeOptions, cssAlignRight} from "../../../lib/constants.js";
import { Isotope, Tracer, TracerCatalog } from "../../../dataclasses/dataclasses.js";
import { ClickableIcon } from "../../injectable/icons.js";
import { Select } from "../../injectable/select.js";
import { HoverBox } from "../../injectable/hover_box.js";
import { TracerWebSocket } from "../../../lib/tracer_websocket.js";
import { OpenCloseButton } from "../../injectable/open_close_button.js";
import { toOptions } from "../../../lib/utils.js";


export function TracerPage(props){
  const [modalTracerID, setModalTracerID] = useState(-1)
  const [openArchive, setOpenArchive] = useState(false);
  const [tracerFilter, setTracerFilter] = useState("");
  const isotopeOptions = toOptions(props[JSON_ISOTOPE],
                                   (isotope) => `${isotope.atomic_letter}-${isotope.atomic_mass}${isotope.metastable ? "m" : ""}`)

  const activeTracers = new Set();
  for(const catalogPage of props[JSON_TRACER_MAPPING].values()){
    activeTracers.add(catalogPage.tracer);
  }

  function closeModal(){
    setModalTracerID(-1);
  }

  function openModal(tracer){
    return () => {setModalTracerID(tracer.id)}
  }

  /**
   * Row for a tracer that is archived
   * Note these are here to benefit from closure
   * @param {{
  *   tracer : Tracer,
  *   websocket : TracerWebSocket
  * }} param0 - props
  * @returns {Element}
  */
  function ArchiveTracerRow({tracer, websocket}){
    function restoreTracer(){
      websocket.sendEditModel(JSON_TRACER, [{...tracer, archived : false,}]);
    }

    return (<tr>
      <td>{tracer.shortname}</td>
      <td style={cssAlignRight}>
        <ClickableIcon src="static/images/archive_up.svg" onClick={restoreTracer}/>
      </td>
    </tr>)
  }

  /**
   * Row for a tracer that is active in use
   * Note these are here to benefit from closure
   * @param {{
   *   tracer : Tracer,
   *   tracerCatalog : Map<Number, TracerCatalog>
   *   websocket : TracerWebSocket
   * }} param0 - props
   * @returns {Element}
   */
  function ActiveTracerRow({tracer,  websocket}){
    const [tracerClinicalName, setTracerClinicalName] = useState(tracer.clinical_name);
    const [tracerIsotope, setTracerIsotope] = useState(tracer.isotope);
    const [tracerType, setTracerType] = useState(tracer.tracer_type);

    let archiveAble = !activeTracers.has(tracer.id);
    const changed = tracerClinicalName !== tracer.clinical_name
                    || Number(tracerIsotope) !== tracer.isotope
                    || Number(tracerType) !== tracer.tracer_type;


    function AcceptEdits(){
      websocket.sendEditModel(JSON_TRACER, [{...tracer,
        clinical_name : tracerClinicalName,
        isotope : Number(tracerIsotope),
        tracer_type : Number(tracerType),
      }])
    }

    function ArchiveTracer(){
      websocket.sendEditModel(JSON_TRACER, [{...tracer, archived : true}])
    }

    return (<tr>
      <td>{tracer.shortname}</td>
      <td>
        <FormControl
          aria-label={`set-clinical-name-${tracer.id}`}
          value={tracerClinicalName}
          onChange={setStateToEvent(setTracerClinicalName)}
        />
      </td>
      <td>
        <Select
          aria-label={`set-isotope-${tracer.id}`}
          options={isotopeOptions}
          valueKey="value"
          nameKey="name"
          onChange={setStateToEvent(setTracerIsotope)}
          value={tracerIsotope}
        />
      </td>
      <td>
        <Select
          options={TracerTypeOptions}
          valueKey="id"
          nameKey="name"
          value={tracerType}
          onChange={setStateToEvent(setTracerType)}
        />
      </td>
      <td>
        <Row>
        { tracer.tracer_type == TRACER_TYPE_DOSE ?
            <Col><HoverBox
            Base={<ClickableIcon
              src="/static/images/setting.png"
              onClick={openModal(tracer)}
              />}
              Hover={<div>Klik her for at konfigurer hvilke kunner kan bestille den injektion tracer</div>}
              /></Col>
          : "" }
        { archiveAble ?
          <Col><HoverBox
          Base={<ClickableIcon
            src="/static/images/archive_down.svg"
            onClick={ArchiveTracer}
            />}
            Hover={<div>Klik her for arkiver Traceren</div>}
            /></Col> : ""  }
        { changed ?
          <Col>
            <HoverBox
              Base={<ClickableIcon
                  src="/static/images/save.svg"
                  onClick={AcceptEdits}
                />}
              Hover={<div>
                Klik her for at gemme ændringer
              </div>}
            />
          </Col> : ""}
        </Row>
      </td>
    </tr>)
  }

  function newTracerRow({websocket}){
    const [shortname, setShortname] = useState("");
    const [clinicalName, setClinicalName] = useState("");
    const [isotope, setIsotope] = useState();
    const [tracerType, setTracerType] = useState(TRACER_TYPE_DOSE);

    return (<tr>
      <td>
        <FormControl
          value={shortname}
          onChange={setStateToEvent(setShortname)}
          aria-label="new-tracer-shortname"
        />
      </td>
      <td>
      <FormControl
          value={clinicalName}
          onChange={setStateToEvent(setClinicalName)}
          aria-label="new-tracer-clinical-name"
        />
      </td>
      <td>
        <Select
          aria-label={`new-isotope-select`}
          options={isotopeOptions}
          valueKey="value"
          nameKey="name"
          onChange={setStateToEvent(setIsotope)}
          value={isotope}
        />
      </td>
      <td>
        <Select
          options={TracerTypeOptions}
          valueKey="id"
          nameKey="name"
          value={tracerType}
          onChange={setStateToEvent(setTracerType)}
        />
      </td>
    </tr>)
  }

  const ActiveTracerRows = [];
  const ArchiveTracerRows = [];
  const filter = new RegExp(tracerFilter, 'g');
  for(const tracer of props[JSON_TRACER].values()){
    if(filter.test(tracer.shortname)){
      if (tracer.archived){
        ArchiveTracerRows.push(
          <ArchiveTracerRow
            key={tracer.id}
            tracer={tracer}
            websocket={props[PROP_WEBSOCKET]}
          />);
      } else {
        ActiveTracerRows.push(
          <ActiveTracerRow
            key={tracer.id}
            tracer={tracer}
            websocket={props[PROP_WEBSOCKET]}
          />);
      }
    }
  }


  const tracerModalProps = {...props}
  tracerModalProps[PROP_ACTIVE_TRACER] = modalTracerID;
  tracerModalProps[PROP_ON_CLOSE] = closeModal


  return (<Container>
    <Row>
      <FormControl
        value={tracerFilter}
        onChange={setStateToEvent(setTracerFilter)}
      />
    </Row>
    <Row>
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
              Base={<div>Handlinger</div>}
              Hover={<div>Her findes knapper til forskellige handlinger</div>}
            />
          </th>
        </tr>
        </thead>
        <tbody>
          {ActiveTracerRows}
        </tbody>
      </Table>
    </Row>
    {
      ArchiveTracerRows.length > 0 ?
      <Card>
        <Card.Header>
          <Row>
            <Col>Tracer arkiv</Col>
            <Col style={cssAlignRight}>
              <OpenCloseButton
                label="open-tracer-archive"
                open={openArchive}
                setOpen={setOpenArchive}
              />
            </Col>
          </Row>
        </Card.Header>
        <Collapse in={openArchive}>
          <Table>
            <thead>
              <tr>
                <th>Tracer</th>
                <th>Genskab</th>
              </tr>
            </thead>
            <tbody>
              {ArchiveTracerRows}
            </tbody>
          </Table>
        </Collapse>
      </Card>
      : ""}
    { modalTracerID !== -1 ? <TracerModal
      {...tracerModalProps}
    /> : ""}
  </Container>)
}