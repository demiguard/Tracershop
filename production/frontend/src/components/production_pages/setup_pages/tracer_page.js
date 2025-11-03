import React, { useEffect, useState } from "react";
import { Container, Table, FormControl, Row, Card, Collapse , Col, FormCheck} from "react-bootstrap";

import { TracerModal } from "../../modals/tracer_modal";
import { appendNewObject, setStateToEvent, setTempMapToEvent } from "~/lib/state_management";
import { PROP_ACTIVE_TRACER, PROP_ON_CLOSE,
  TracerTypeOptions, TRACER_TYPE} from "~/lib/constants";
import { cssAlignRight, cssTableCenter } from "~/lib/styles";
import { Tracer } from "~/dataclasses/dataclasses";
import { DATA_TRACER } from "~/lib/shared_constants"
import { ClickableIcon } from "~/components/injectable/icons";
import { Select,  toOptions } from "~/components/injectable/select";
import { HoverBox } from "~/components/injectable/hover_box";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { nullParser } from "~/lib/formatting";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { compareLoosely } from "~/lib/utils";
import { Optional } from "~/components/injectable/optional";
import { EditableInput } from "~/components/injectable/inputs/editable_input";


function getNewTracer(){
  return new Tracer(-1, "", "", 1, TRACER_TYPE.DOSE, "", false, false, false);
}

export function TracerPage(){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const [modalTracerID, setModalTracerID] = useState(-1)
  const [openArchive, setOpenArchive] = useState(false);
  const [tracerFilter, setTracerFilter] = useState("");
  const [newTracer, setNewTracer] = useState(new Tracer(-1, "", "", 1, TRACER_TYPE.DOSE, "", "",false, false, false));
  const [tracers, setTracers] = useState(appendNewObject(state.tracer, getNewTracer));
  const isotopeOptions = toOptions(state.isotopes,
                                   (isotope) => `${isotope.atomic_letter}-${isotope.atomic_mass}${isotope.metastable ? "m" : ""}`)

  const activeTracers = new Set();
  for(const catalogPage of state.tracer_mapping.values()){
    activeTracers.add(catalogPage.tracer);
  }

  useEffect(() => {
    setTracers(appendNewObject(state.tracer, getNewTracer));
  }, [state.tracer]);

  function closeModal(){
    setModalTracerID(-1);
  }

  function openModal(tracer){
    return () => {setModalTracerID(tracer.id)}
  }

  function restoreTracer(tracer){
    return () => {
      websocket.sendEditModels(DATA_TRACER, {...tracer, archived : false,});
    }
  }

  function ArchiveTracer(tracer){
    // This function cannot be called with an empty tracer
    return () => {
      websocket.sendEditModels(DATA_TRACER, {...tracer, archived : true});
    }
  }

  function validate(tracer){
    return () => {
      return [true, {
        ...tracer,
        isotope : Number(tracer.isotope),
        tracer_type : Number(tracer.tracer_type),
      }];
    }
  }

  const activeTracerRows = [];
  const archiveTracerRows = [];
  const filter = new RegExp(tracerFilter, 'g');
  for(const tracer of tracers.values()){
    if(filter.test(tracer.shortname)){
      if (tracer.archived){
        archiveTracerRows.push(
          <tr key={tracer.id}>
            <td>{tracer.shortname}</td>
            <td style={cssAlignRight}>
              <ClickableIcon
                label={`restore-${tracer.id}`}
                src="static/images/archive_up.svg"
                onClick={restoreTracer(tracer)}
              />
            </td>
          </tr>);
      } else {
        const archiveAble = !activeTracers.has(tracer.id) && 0 < tracer.id ;
        const changed = state.tracer.has(tracer.id) ? !compareLoosely(tracer, state.tracer.get(tracer.id)) : true;

        activeTracerRows.push(
          <tr key={tracer.id} aria-label={`active-tracer-${tracer.id}`}>
            <td>
              <EditableInput
                canEdit={tracer.id == -1}
                aria-label={`set-shortname-${tracer.id}`}
                value={tracer.shortname}
                onChange={setTempMapToEvent(setTracers, tracer.id, 'shortname')}
              />
            </td>
            <td>
              <FormControl
                aria-label={`set-clinical-name-${tracer.id}`}
                value={nullParser(tracer.clinical_name)}
                onChange={setTempMapToEvent(setTracers, tracer.id, 'clinical_name')}
              />
            </td>
            <td>
              <FormControl
                aria-label={`set-vial-tag-${tracer.id}`}
                value={nullParser(tracer.vial_tag)}
                onChange={setTempMapToEvent(setTracers, tracer.id, 'vial_tag')}
            />
      </td>
      <td>
        <Select
          aria-label={`set-isotope-${tracer.id}`}
          options={isotopeOptions}
          onChange={setTempMapToEvent(setTracers, tracer.id, 'isotope')}
          value={tracer.isotope}
        />
      </td>
      <td>
        <Select
          aria-label={`set-type-${tracer.id}`}
          options={toOptions(TracerTypeOptions)}
          value={tracer.tracer_type}
          onChange={setTempMapToEvent(setTracers, tracer.id, 'tracer_type')}
        />
      </td>
      <td style={cssTableCenter}>
        <FormCheck
          data-testid={`marketed-${tracer.id}`}
          checked={tracer.marketed}
          onChange={() => {
            setTracers(oldTracer => {
              const newTracers = new Map(oldTracer);
              const newTracer = {...tracer, marketed : !tracer.marketed};
              newTracers.set(newTracer.id, newTracer);
              return newTracers
            });
          }}
        />
      </td>
      <td>
        <Row>
          <Optional exists={tracer.tracer_type === TRACER_TYPE.DOSE && 0 < tracer.id}>
            <Col>
              <HoverBox
                Base={<ClickableIcon
                  label={`open-modal-${tracer.id}`}
                  src="/static/images/setting.png"
                  onClick={openModal(tracer)}
                />}
                Hover={<div>Klik her for at konfigurer hvilke kunner kan bestille den injektion tracer</div>}
              />
            </Col>
          </Optional>
        <Optional exists={archiveAble}>
          <Col>
            <HoverBox
              Base={<ClickableIcon
                label={`archive-${tracer.id}`}
                src="/static/images/archive_down.svg"
                onClick={ArchiveTracer(tracer)}
              />}
              Hover={<div>Klik her for arkiver Traceren</div>}
            />
          </Col>
        </Optional>
        <Optional exists={changed && tracer.shortname.length >= 3}>
            <Col>
              <HoverBox
                Base={
                  <CommitIcon
                  temp_object={tracer}
                  validate={validate(tracer)}
                  object_type={DATA_TRACER}
                  label={`commit-tracer-${tracer.id}`}
                  />
                }
                Hover={<div>
                  Klik her for at gemme ændringer
                </div>}
              />
            </Col>
          </Optional>
        </Row>
      </td>
    </tr>);
    } // end else archived
  } // end if filtered
} // end for loop
  const tracerModalProps = {
    [PROP_ACTIVE_TRACER] : modalTracerID,
    [PROP_ON_CLOSE] : closeModal,
  };

  return (<Container>
    <Row>
      <TracershopInputGroup label="Tracer Navn Filter">
        <FormControl
          aria-label="tracer-filter"
          value={tracerFilter}
          onChange={setStateToEvent(setTracerFilter)}
        />
      </TracershopInputGroup>
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
            Markedsført
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