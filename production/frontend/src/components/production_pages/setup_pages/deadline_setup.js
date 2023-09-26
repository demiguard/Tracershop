import React, { useState } from "react";
import { Button, Col, Container, FormControl, Row } from "react-bootstrap";
import { DAYS, DAYS_OBJECTS, DEADLINE_TYPES, JSON_DEADLINE, JSON_SERVER_CONFIG, PROP_WEBSOCKET, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MODEL_EDIT, cssCenter, cssError } from "../../../lib/constants";
import { Deadline, ServerConfiguration, Tracer } from "../../../dataclasses/dataclasses";
import { Select } from "../../injectable/select";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { setStateToEvent } from "../../../lib/state_management";
import { parseTimeInput } from "../../../lib/user_input";
import { TimeInput } from "../../injectable/time_form";
import { ErrorInput } from "../../injectable/error_input";


/**
 * @enum
 */
export const GlobalDeadlineValuesOptions = {
  NO_OPTION : 1,
  GLOBAL_ACTIVITY_DEADLINE : 2,
  GLOBAL_INJECTION_DEADLINE : 3,
}

const globalOptions = [
  {id : GlobalDeadlineValuesOptions.NO_OPTION, name: "-----"},
  {id : GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE, name: "Aktivitet Deadline"},
  {id : GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE, name: "Injektion Deadline"},
]

const DEADLINE_TYPE_OPTIONS = [{
  id : DEADLINE_TYPES.DAILY,
  name : "Daglig Deadline",
},{
  id : DEADLINE_TYPES.WEEKLY,
  name : "Ugenlig Deadline",
}]

const correctDays = DAYS_OBJECTS.map(
  (obj) =>  {return {id : obj.day - 1, name: obj.name}}
) // I Dunno why it's wrong, and TODO: FIX THE CONSTANT


/**
 * 
 * @param {{websocket : TracerWebSocket}} param0 
 * @returns 
 */
function NewDeadlineRow({websocket}){
  const [deadlineType, setDeadlineType] = useState(DEADLINE_TYPES.DAILY);
  const [deadlineTime, setDeadlineTime] = useState("");
  const [day, setDay] = useState(DAYS.MONDAY);
  const [error, setError] = useState("");

  function createDeadline(){
    const [validTime, timeOutput] = parseTimeInput(deadlineTime, "Deadline tidspunktet");

    if (validTime){
      setError("");
      websocket.sendCreateModel(JSON_DEADLINE, [
        new Deadline(undefined, Number(deadlineType), timeOutput, day)
      ]);
    } else {
      setError(timeOutput);
    }
  }

  return (<Row>
    <Col>
      <Select
        aria-label="type-new"
        options={DEADLINE_TYPE_OPTIONS}
        nameKey="name"
        valueKey="id"
        value={deadlineType}
        onChange={setStateToEvent(setDeadlineType)}
      />
    </Col>
    <Col>
      <ErrorInput error={error}>
        <TimeInput
          aria-label="time-new"
          stateFunction={setDeadlineTime}
          value={deadlineTime}
        />
      </ErrorInput>
    </Col>
    <Col style={cssCenter}>
      {Number(deadlineType) === DEADLINE_TYPES.WEEKLY ? <Select
          aria-label="days-new"
          options={correctDays}
          nameKey="name"
          valueKey="id"
          value={day}
          onChange={setStateToEvent(setDay)}
        /> : "-----"}
    </Col>
    <Col>
        <Button onClick={createDeadline}>Opret Deadline</Button>
    </Col>
  </Row>)
}

/**
 *
 * @param {{
 *  deadline : Deadline,
 *  setGlobalDeadline : Function,
 *  activityDeadline : Number,
 *  injectionDeadline : Number,
 *  websocket : TracerWebSocket
 * }} props
 * @returns {Element}
 */
function DeadlineRow({deadline,
                      setGlobalDeadline,
                      activityDeadline,
                      injectionDeadline,
                      websocket,
                    }){
  const [deadlineType, _setDeadlineType] = useState(deadline.deadline_type)
  const [time, _setTime] = useState(deadline.deadline_time)
  const [day, _setDay] = useState(deadline.deadline_day)

  // State Setters
  function setDeadlineType(event){
    const newDeadlineType = Number(event.target.value);

    _setDeadlineType(newDeadlineType);
    if (deadlineType === newDeadlineType){
      return;
    }

    websocket.sendEditModel(JSON_DEADLINE, {...deadline, deadline_type : Number(event.target.value)})
  }

  function setDay(event) {
    const newDay = Number(event.target.value)
    if (day === newDay){
      return;
    }
    _setDay(newDay)

    websocket.sendEditModel(JSON_DEADLINE, {...deadline, deadline_day : newDay})
  }

  function setTime(inputValue){
    _setTime(inputValue)

    const [valid, time] = parseTimeInput(inputValue)
    if (valid){
      websocket.sendEditModel(JSON_DEADLINE, {...deadline, deadline_time : time})
    }
  }

  let globalValue = GlobalDeadlineValuesOptions.NO_OPTION;
  if (deadline.id === activityDeadline){
    globalValue = GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE;
  }
  if (deadline.id === injectionDeadline){
    globalValue = GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE;
  }

  return <Row style={{
    marginBottom : "10px",
    marginTop : "10px",
  }}>
    <Col>
      <Select
        aria-label={`type-${deadline.id}`}
        options={DEADLINE_TYPE_OPTIONS}
        nameKey="name"
        valueKey="id"
        onChange={setDeadlineType}
        value={deadlineType}
      />
    </Col>
    <Col>
      <TimeInput
        value={time}
        aria-label={`time-${deadline.id}`}
        stateFunction={setTime}/>
    </Col>
    <Col style={cssCenter}>
        { deadlineType === DEADLINE_TYPES.WEEKLY ? <Select
          aria-label={`days-${deadline.id}`}
          options={correctDays}
          nameKey="name"
          valueKey="id"
          value={day}
          onChange={setDay}
        /> : "-----"}
    </Col>
    <Col>
      { globalValue === GlobalDeadlineValuesOptions.NO_OPTION ?
      <Select
        aria-label={`global-${deadline.id}`}
        options={globalOptions}
        nameKey="name"
        valueKey="id"
        value={globalValue}
        onChange={setGlobalDeadline(deadline)}
      /> : <Select
        aria-label={`global-${deadline.id}`}
        options={globalOptions}
        nameKey="name"
        valueKey="id"
        value={globalValue}
        onChange={setGlobalDeadline(deadline)}
        disabled
      />
    }
    </Col>
  </Row>
}


export function DeadlineSetup(props){
  const /**@type {ServerConfiguration} */ serverConfig = props[JSON_SERVER_CONFIG].get(1);

  const [globalActivityDeadline, setGlobalActivityDeadline] = useState(serverConfig.global_activity_deadline);
  const [globalInjectionDeadline, setGlobalInjectionDeadline] = useState(serverConfig.global_injection_deadline);

  function setGlobalDeadline(deadline) {
    return (event) => {
      switch(Number(event.target.value)){
        case GlobalDeadlineValuesOptions.NO_OPTION: {
          // Do Nothing
        } break;
        case GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE: {
          setGlobalActivityDeadline(deadline.id)
          props[PROP_WEBSOCKET].sendEditModel(JSON_SERVER_CONFIG, {...serverConfig, global_activity_deadline : deadline.id})
        } break;
        case GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE: {
          setGlobalInjectionDeadline(deadline.id)
          props[PROP_WEBSOCKET].sendEditModel(JSON_SERVER_CONFIG, {...serverConfig, global_injection_deadline : deadline.id})
        } break;
      }
    }

  }


  const Deadlines = [...props[JSON_DEADLINE].values()].map(
    (deadline, i) => {
      return <DeadlineRow
                deadline={deadline}
                setGlobalDeadline={setGlobalDeadline}
                key={i}
                activityDeadline={globalActivityDeadline}
                injectionDeadline={globalInjectionDeadline}
                websocket={props[PROP_WEBSOCKET]}
             />
    }
  )

  Deadlines.push(
    <NewDeadlineRow
      key={-1}
      websocket={props[PROP_WEBSOCKET]}
    />
  )

  return <Container>
    <Row>
      <Col><h3>Deadline type</h3></Col>
      <Col><h3>Tidspunkt</h3></Col>
      <Col><h3>Dag</h3></Col>
      <Col><h3>Globale Deadlines</h3></Col>
      <hr/>
    </Row>
    {Deadlines}
  </Container>
}
