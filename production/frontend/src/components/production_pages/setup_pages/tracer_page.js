import React, { useState } from "react";
import { Container, Table, FormControl, Row, Card, Collapse , Col} from "react-bootstrap";

import { TracerModal } from "../../modals/tracer_modal.js";
import { setStateToEvent, setTempObjectToEvent } from "~/lib/state_management.js";
import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE,
  TracerTypeOptions, cssAlignRight, TRACER_TYPE} from "~/lib/constants.js";

import { DATA_TRACER } from "~/lib/shared_constants.js"
import { Tracer, TracerCatalog } from "~/dataclasses/dataclasses.js";
import { ClickableIcon } from "../../injectable/icons.js";
import { Select,  toOptions } from "../../injectable/select.js";
import { HoverBox } from "../../injectable/hover_box.js";
import { TracerWebSocket } from "~/lib/tracer_websocket.js";
import { OpenCloseButton } from "../../injectable/open_close_button.js";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context.js";
import { CommitButton } from "~/components/injectable/commit_button.js";


export function TracerPage(){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const [modalTracerID, setModalTracerID] = useState(-1)
  const [openArchive, setOpenArchive] = useState(false);
  const [tracerFilter, setTracerFilter] = useState("");
  const isotopeOptions = toOptions(state.isotopes,
                                   (isotope) => `${isotope.atomic_letter}-${isotope.atomic_mass}${isotope.metastable ? "m" : ""}`)

  const activeTracers = new Set();
  for(const catalogPage of state.tracer_mapping.values()){
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
  *   tracer : Tracer
  * }} param0 - props
  * @returns {Element}
  */
  function ArchiveTracerRow({tracer}){
    function restoreTracer(){
      websocket.sendEditModel(DATA_TRACER, {...tracer, archived : false,});
    }

    return (<tr>
      <td>{tracer.shortname}</td>
      <td style={cssAlignRight}>
        <ClickableIcon
          label={`restore-${tracer.id}`}
          src="static/images/archive_up.svg"
          onClick={restoreTracer}
        />
      </td>
    </tr>);
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
  function ActiveTracerRow({tracer}){
    const [tempTracer, setTempTracer] = useState({...tracer})


    const archiveAble = !activeTracers.has(tracer.id) && 0 < tracer.id ;
    const changed = tempTracer.clinical_name !== tracer.clinical_name
                    || Number(tempTracer.isotope) !== tracer.isotope
                    || Number(tempTracer.tracer_type) !== tracer.tracer_type;

    function ArchiveTracer(){
      // This function cannot be called with an empty tracer
      websocket.sendEditModel(DATA_TRACER, {...tracer, archived : true});
    }

    function validate(){

      return [true, {
        ...tempTracer,
        isotope : Number(tempTracer.isotope),
        tracer_type : Number(tempTracer.tracer_type),
      }]
    }

    return (<tr>
      <td>
        {0 < tracer.id ?  <FormControl
            readOnly
            aria-label={`set-shortname-${tracer.id}`}
            value={tempTracer.shortname}
        /> :
          <FormControl
            aria-label={`set-shortname-${tracer.id}`}
            value={tempTracer.shortname}
            onChange={setTempObjectToEvent(setTempTracer, 'shortname')}
        />
        }
      </td>
      <td>
        <FormControl
          aria-label={`set-clinical-name-${tracer.id}`}
          value={tempTracer.clinical_name}
          onChange={setTempObjectToEvent(setTempTracer, 'clinical_name')}
        />
      </td>
      <td>
        <FormControl
          aria-label={`set-vial-tag-${tracer.id}`}
          value={tempTracer.vial_tag}
          onChange={setTempObjectToEvent(setTempTracer, 'vial_tag')}
        />
      </td>
      <td>
        <Select
          aria-label={`set-isotope-${tracer.id}`}
          options={isotopeOptions}
          onChange={setTempObjectToEvent(setTempTracer, 'isotope')}
          value={tempTracer.isotope}
        />
      </td>
      <td>
        <Select
          aria-label={`set-type-${tracer.id}`}
          options={toOptions(TracerTypeOptions)}
          value={tempTracer.tracer_type}
          onChange={setTempObjectToEvent(setTempTracer, 'tracer_type')}
        />
      </td>
      <td>
        <Row>
        { tempTracer.tracer_type === TRACER_TYPE.DOSE && 0 < tempTracer.id ?
            <Col><HoverBox
            Base={<ClickableIcon
              label={`open-modal-${tracer.id}`}
              src="/static/images/setting.png"
              onClick={openModal(tracer)}
              />}
              Hover={<div>Klik her for at konfigurer hvilke kunner kan bestille den injektion tracer</div>}
              /></Col>
          : "" }
        { archiveAble ?
          <Col><HoverBox
          Base={<ClickableIcon
            label={`archive-${tracer.id}`}
            src="/static/images/archive_down.svg"
            onClick={ArchiveTracer}
            />}
            Hover={<div>Klik her for arkiver Traceren</div>}
            /></Col> : ""  }
        { changed ?
          <Col>
            <HoverBox
              Base={
                <CommitButton
                  temp_object={tempTracer}
                  validate={validate}
                  object_type={DATA_TRACER}
                  label={`commit-tracer-${tracer.id}`}
                />
              }
              Hover={<div>
                Klik her for at gemme ændringer
              </div>}
            />
          </Col> : ""}
        </Row>
      </td>
    </tr>)
  }

  const activeTracerRows = [];
  const archiveTracerRows = [];
  const filter = new RegExp(tracerFilter, 'g');
  for(const tracer of state.tracer.values()){
    if(filter.test(tracer.shortname)){
      if (tracer.archived){
        archiveTracerRows.push(
          <ArchiveTracerRow
            key={tracer.id}
            tracer={tracer}
          />);
      } else {
        activeTracerRows.push(
          <ActiveTracerRow
            key={tracer.id}
            tracer={tracer}
          />);
      }
    }
  }

  activeTracerRows.push(
    <ActiveTracerRow
      key={-1}
      tracer={new Tracer(
        -1, "", "", 1, TRACER_TYPE.DOSE, null, "", false
      )}
    />
  );

  const tracerModalProps = {
    [PROP_ACTIVE_TRACER] : modalTracerID,
    [PROP_ON_CLOSE] : closeModal,
  };


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
              Base={<div>Klinisk Navn</div>}
              Hover={<div>Dette er fulde navn på tracer, som bruges på føglesedlen.</div>}
            />
          </th>
          <th>
            <HoverBox
              Base={<div>Hætte glas tag</div>}
              Hover={<div>Dette er forkortelse på lot nummer, som dispenseren skriver.
                Bemærk at traceren må ikke dele tag med en anden tracer!
              </div>}
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
          {activeTracerRows}
        </tbody>
      </Table>
    </Row>
    {
      archiveTracerRows.length > 0 ?
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
              {archiveTracerRows}
            </tbody>
          </Table>
        </Collapse>
      </Card>
      : ""}
    { modalTracerID !== -1 ? <TracerModal
      {...tracerModalProps}
    /> : ""}
  </Container>);
}