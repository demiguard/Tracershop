import React, { useMemo, useState } from "react";
import { Button, Card, Col, Collapse, FormControl, InputGroup, Row } from "react-bootstrap";
import InputGroupText from "react-bootstrap/esm/InputGroupText";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { DateDisplay } from "~/components/injectable/data_displays/date_display";
import { EndpointSelect } from "~/components/injectable/derived_injectables/endpoint_select";
import { StatusIcon } from "~/components/injectable/icons";
import { Image } from "~/components/injectable/image";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { OpenCloseButton } from "~/components/injectable/open_close_button";
import { Select, toOptions } from "~/components/injectable/select";
import { useTracerCatalog } from "~/contexts/tracer_catalog";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { Project } from "~/dataclasses/dataclasses";
import { ArrayMap } from "~/lib/array_map";
import { useProjectMapping } from "~/lib/data_structures/project_mapping";
import { ErrorMonad } from "~/lib/error_handling";
import { MESSAGE_ERROR } from "~/lib/incoming_messages";
import { parseDateBind, parseTextBind } from "~/lib/parsing";
import { DATA_PROJECT, DATA_PROJECT_ENDPOINT } from "~/lib/shared_constants";
import { setStateToEvent, useTSFormState } from "~/lib/state_management";

function NewProject({}){
  const state = useTracershopState();

  const {
    value : projectName,
    setValue : setProjectName,
    error : errorProjectName,
    setError : setErrorProjectName
  } = useTSFormState("");

  const {
    value : startDate,
    setValue : setStartDate,
    error : errorStartDate,
    setError : setErrorStartDate
  } = useTSFormState("");

  const {
    value : endDate,
    setValue : setEndDate,
    error : errorEndDate,
    setError : setErrorEndDate
  } = useTSFormState("");

  const validTracers = [...state.tracer.values()].filter(
    (t) => !t.archived
  );

  const {
    value : tracerID,
    setValue : setTracerID,
    error : errorTracerID,
    setError : setErrorTracerID
  } = useTSFormState(() => {
    for (const tracer of validTracers){
      return tracer.id;
    }

    return "";
  })

  function validate(){
    const projectHeader = "project";
    const startDateHeader = "start dato";
    const endDateHeader = "slut dato"

    const em = new ErrorMonad()

    em.bind(parseTextBind(projectName, projectHeader, 3, 32))
    em.bind(parseDateBind(startDate, startDateHeader, state.today))
    em.bind(parseDateBind(endDate, endDateHeader, state.today))

    if (em.registerErrors({
      Project : setErrorProjectName,
      "start dato" : setErrorStartDate,
      "slut dato" : setErrorEndDate
    })) {
      return [false, {}];
    }

    const parsed = em.get_values()


    return [true, new Project(-1, parsed[projectHeader], tracerID, parsed[startDateHeader], parsed[endDateHeader])]
  }

  function validateCallBack(message){
    if(message.messageType === "error"){
      setErrorProjectName("Der findes allerede et projekt med dette navn.")
    }
  }


  function dateFormatFunction(currentValue) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;

      if(v.length < currentValue.length) {
        return v;
      }
      if([2,5].includes(v.length)){
        return v + "/";
      }

      return v;
    }
  }

  return (
    <div>
      <Row>
        <Col>
          <TracershopInputGroup label={"Projekt Navn"} error={errorProjectName}>
            <FormControl
              value={projectName}
              onChange={setStateToEvent(
                { stateFunction : setProjectName,
                  errorFunction : setErrorProjectName
                })}
            />
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label={"Start Dato"} error={errorStartDate}>
            <FormControl value={startDate} onChange={setStateToEvent({
                stateFunction : setStartDate,
                errorFunction : setErrorStartDate,
                formatFunction : dateFormatFunction(startDate)
              }
            )}/>
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label={"Slut Dato"} error={errorEndDate}>
            <FormControl value={endDate} onChange={
              setStateToEvent({
                stateFunction : setEndDate,
                errorFunction : setErrorEndDate,
                formatFunction : dateFormatFunction(endDate)
              })}/>
          </TracershopInputGroup>
        </Col>
        <Col>
          <TracershopInputGroup label={"Tracer"} error={errorTracerID}>
            <Select
              onChange={setStateToEvent({stateFunction : setTracerID, errorFunction : setErrorTracerID})}
              options={toOptions(validTracers, 'shortname', 'id')}
              value={tracerID}
            />
          </TracershopInputGroup>
        </Col>
        <Col style={{
          placeItems :"center",
          display : "flex"
        }}>
          <CommitIcon
            validate={validate}
            temp_object={new Project(
              -1, projectName, tracerID, startDate, endDate
            )}
            object_type={DATA_PROJECT}
            callback={validateCallBack}
          />
        </Col>
      </Row>
    </div>
  );
}

function EndpointRow({
  endpointID
}){
  const state = useTracershopState()
  const endpoint = state.delivery_endpoint.get(endpointID)

  return (
    <Row>
      <Button variant="outline-danger" style={{display : "flex", flex : "0 0 0", margin : "1vh"}}>
        <div className="d-flex align-items-center gap-2">
          {endpoint.name}<Image height={"24px"} width="24px" src={"/static/images/decline.svg"}/>
        </div>
      </Button>
    </Row>);
}

function ActivityRow({activityOrderID}){
  const state = useTracershopState();

  const order = state.activity_orders.get(activityOrderID);
  const deliveryTimeSlot = state.deliver_times.get(order.ordered_time_slot)
  const endpoint = state.delivery_endpoint.get(deliveryTimeSlot.destination);

  return (
  <Card>
    <Card.Header>
      <Row>
        <Col xs={1}> <StatusIcon order={order}/></Col>
        <Col>{endpoint.name}</Col>
        <Col><DateDisplay date={new Date(order.delivery_date)}/></Col>
      </Row>
    </Card.Header>
  </Card>);
}


type ProjectCardProps = {
  project : Project,
}

function ProjectCard({project}: ProjectCardProps){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const tracerCatalog = useTracerCatalog();

  const projectMapping = useProjectMapping()

  const [open, setOpen] = useState(false);

  const assignedEndpointsIds = projectMapping.projectToEndpoints.get(project.id, []);
  const tracerEndpoints = tracerCatalog.getCustomersForTracer(project.tracer);

  const endpointOptions = [...state.delivery_endpoint.values()].filter(
    (c) => {
      return !(assignedEndpointsIds.includes(c.id)) && tracerEndpoints.includes(c.id);
    }
  );

  const endpointRows = assignedEndpointsIds.map((endpointID, i) => {
    return <EndpointRow endpointID={endpointID} key={i}/>
  })

  const activityOrdersForProject = projectMapping.activityOrdersForProject.get(project.id, []).map(
    (aio) => <ActivityRow activityOrderID={aio} key={aio}/>
  );
  const injectionOrdersForProject = projectMapping.injectionOrdersForProject.get(project.id, []);

  function onSelect(event: React.ChangeEvent<HTMLSelectElement>){
    websocket.sendCreateModel(
      DATA_PROJECT_ENDPOINT, {
        project : project.id,
        endpoint : Number(event.target.value)
      }
    );
  }

  return (
    <Card>
      <Card.Header>
        <Row>
          <Col>
            <h2 style={{margin : 0}}>{project.name}</h2>
          </Col>
          <Col>
            <h2 style={{margin : 0}}>{state.tracer.get(project.tracer).shortname}</h2>
          </Col>
          <Col style={{ alignContent : "end", display : "flex", flex : "0 0 0", margin : "auto" }}>
            <OpenCloseButton open={open} setOpen={setOpen}/>
          </Col>
        </Row>
      </Card.Header>
      <Collapse in={open}>
      <Card.Body>
        <Row>
          <Col>
            {activityOrdersForProject}
          </Col>
          <Col>
            {endpointRows}
            <Row>
              <TracershopInputGroup>
                <InputGroupText> Hello world</InputGroupText>
                <EndpointSelect
                  style={{minWidth : "15vw", display : "flex", flex : "0 0 0"}}
                  emptyEndpoint
                  delivery_endpoint={endpointOptions}
                  onChange={onSelect}
                  value={""}
                />
              </TracershopInputGroup>
            </Row>
          </Col>
        </Row>
      </Card.Body>
      </Collapse>
    </Card>
  );
}

export function ProjectPage({}){
  const state = useTracershopState()

  const projectCards = [...state.project.values()].map(
    (p,i) => <ProjectCard project={p} key={i}/>
  )

  return (
    <div>
      <NewProject/>
      {projectCards}
    </div>
  );
}
