import React, { useState } from "react";
import { Col, Container, FormControl, Row } from "react-bootstrap";
import { DAYS_OBJECTS, DEADLINE_TYPES, JSON_DEADLINE, JSON_SERVER_CONFIG, PROP_WEBSOCKET, WEBSOCKET_DATA, WEBSOCKET_MESSAGE_MODEL_EDIT } from "../../lib/constants";
import { Deadline, ServerConfiguration } from "../../dataclasses/dataclasses";
import { Select } from "../injectable/select";
import { TracerWebSocket } from "../../lib/tracer_websocket";


/**
 * @enum
 */
const GlobalDeadlineValuesOptions = {
  NO_OPTION : 1,
  GLOBAL_ACTIVITY_DEADLINE : 2,
  GLOBAL_INJECTION_DEADLINE : 3,
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
  const correctDays = DAYS_OBJECTS.map(
    (obj) =>  {return {id : obj.day - 1, name: obj.name}}
  ) // I Dunno why it's wrong, and TODO: FIX THE CONSTANT
  // State Setters
  function setDeadlineType(event){
    _setDeadlineType(Number(event.target.value));
    websocket.sendEditModel(JSON_DEADLINE, {...deadline, deadline_type : Number(event.target.value)})
  }

  function setDay(event) {
    const day = Number(event.target.value)
    _setDay(day)

    websocket.sendEditModel(JSON_DEADLINE, {...deadline, deadline_day : day})
  }

  const globalOptions = [
    {id : GlobalDeadlineValuesOptions.NO_OPTION, name: "-----"},
    {id : GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE, name: "Aktivitet Deadline"},
    {id : GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE, name: "Injektion Deadline"},
  ]

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
        options={[{
          id : DEADLINE_TYPES.DAILY,
          name : "Daglig Deadline",
        },{
          id : DEADLINE_TYPES.WEEKLY,
          name : "Ugenlig Deadline",
        }]}
        nameKey="name"
        valueKey="id"
        onChange={setDeadlineType}
        value={deadlineType}
      />
    </Col>
    <Col>
      <FormControl value={time} onChange={(event) => {_setTime(event.target.value)}}/>
    </Col>
    <Col>
        { deadlineType === DEADLINE_TYPES.WEEKLY ? <Select
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
        options={globalOptions}
        nameKey="name"
        valueKey="id"
        value={globalValue}
        onChange={setGlobalDeadline(deadline)}
      /> : <Select
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
