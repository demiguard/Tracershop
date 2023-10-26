import React, { useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

import { DAYS, DEADLINE_TYPES, cssCenter, cssError } from "../../../lib/constants";
import { DATA_DEADLINE, DATA_SERVER_CONFIG } from "~/lib/shared_constants";
import { Deadline, ServerConfiguration } from "../../../dataclasses/dataclasses";
import { Select, toOptions } from "../../injectable/select";
import { TracerWebSocket } from "../../../lib/tracer_websocket";
import { setStateToEvent } from "../../../lib/state_management";
import { parseTimeInput } from "../../../lib/user_input";
import { TimeInput } from "../../injectable/inputs/time_input";
import { ErrorInput } from "../../injectable/inputs/error_input";
import { DaysSelect } from "../../injectable/derived_injectables/days_select";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { nullParser } from "~/lib/formatting";


/**
 * @enum
 */
export const GlobalDeadlineValuesOptions = {
  NO_OPTION : 1,
  GLOBAL_ACTIVITY_DEADLINE : 2,
  GLOBAL_INJECTION_DEADLINE : 3,
}

const globalOptions = toOptions([
  {id : GlobalDeadlineValuesOptions.NO_OPTION, name: "-----"},
  {id : GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE, name: "Aktivitet Deadline"},
  {id : GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE, name: "Injektion Deadline"},
])

const DEADLINE_TYPE_OPTIONS = toOptions([{
  id : DEADLINE_TYPES.DAILY,
  name : "Daglig Deadline",
},{
  id : DEADLINE_TYPES.WEEKLY,
  name : "Ugenlig Deadline",
}])


/**
 * This is a table like, that displays the deadlines to the user.
 * They can modify deadlines and change any global deadlines.
 * @returns {Element}
 */
export function DeadlineSetup(){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const /**@type {ServerConfiguration | undefined} */ serverConfig = state.server_config.get(1);

  if(serverConfig === undefined){
    // If you're in first iteration, we should wait until we have server config
    return <div></div>
  }

  const [globalActivityDeadline, setGlobalActivityDeadline] = useState(nullParser(serverConfig.global_activity_deadline));
  const [globalInjectionDeadline, setGlobalInjectionDeadline] = useState(nullParser(serverConfig.global_injection_deadline));

  function setGlobalDeadline(deadline) {
    return (event) => {
      switch(Number(event.target.value)){
        case GlobalDeadlineValuesOptions.NO_OPTION: {
          // Do Nothing
        } break;
        case GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE: {
          setGlobalActivityDeadline(deadline.id)
          websocket.sendEditModel(DATA_SERVER_CONFIG, {...serverConfig, global_activity_deadline : deadline.id})
        } break;
        case GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE: {
          setGlobalInjectionDeadline(deadline.id)
          websocket.sendEditModel(DATA_SERVER_CONFIG, {...serverConfig, global_injection_deadline : deadline.id})
        } break;
      }
    }

  }



/** This row is the representation of a deadline to a user.
 *
 * @param {{
 *  deadline : Deadline,
*  setGlobalDeadline : Function,
*  activityDeadline : Number,
*  injectionDeadline : Number,
* }} props
* @returns {Element}
*/
function DeadlineRow({deadline,
                     setGlobalDeadline,
                     activityDeadline,
                     injectionDeadline,
                   }){
 const [deadlineType, _setDeadlineType] = useState(deadline.deadline_type)
 const [time, _setTime] = useState(deadline.deadline_time)
 const [day, _setDay] = useState(deadline.deadline_day)


 // State Setters
 function setDeadlineType(event){
   const newDeadlineType = Number(event.target.value);
   if (deadlineType === newDeadlineType){
     return;
   }

   if(newDeadlineType === DEADLINE_TYPES.DAILY){
     _setDay(null);
   } else if(newDeadlineType === DEADLINE_TYPES.WEEKLY){
     _setDay(1);
   }

   _setDeadlineType(newDeadlineType);

   websocket.sendEditModel(DATA_DEADLINE, {...deadline, deadline_type : Number(event.target.value)})
 }

 function setDay(event) {
   const newDay = Number(event.target.value)
   if (day === newDay){
     return;
   }
   _setDay(newDay)

   websocket.sendEditModel(DATA_DEADLINE, {...deadline, deadline_day : newDay})
 }

 function setTime(inputValue){
   _setTime(inputValue)

   const [valid, time] = parseTimeInput(inputValue)
   if (valid){
     websocket.sendEditModel(DATA_DEADLINE, {...deadline, deadline_time : time})
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
       { deadlineType === DEADLINE_TYPES.WEEKLY ? <DaysSelect
         aria-label={`days-${deadline.id}`}
         value={day}
         onChange={setDay}
       /> : "-----"}
   </Col>
   <Col>
     { globalValue === GlobalDeadlineValuesOptions.NO_OPTION ?
     <Select
       aria-label={`global-${deadline.id}`}
       options={globalOptions}
       value={globalValue}
       onChange={setGlobalDeadline(deadline)}
     /> : <Select
       aria-label={`global-${deadline.id}`}
       options={globalOptions}
       value={globalValue}
       onChange={setGlobalDeadline(deadline)}
       disabled
     />
   }
   </Col>
 </Row>
}


  /**
  * A row where a user can create a new Deadline
  * @returns {Element}
  */
  function NewDeadlineRow(){
    const [deadlineType, setDeadlineType] = useState(DEADLINE_TYPES.DAILY);
    const [deadlineTime, setDeadlineTime] = useState("");
    const [day, setDay] = useState(DAYS.MONDAY);
    const [error, setError] = useState("");

    function createDeadline(){
      const [validTime, timeOutput] = parseTimeInput(deadlineTime, "Deadline tidspunktet");

      if (validTime){
        setError("");
        websocket.sendCreateModel(DATA_DEADLINE, [
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
        {Number(deadlineType) === DEADLINE_TYPES.WEEKLY ? <DaysSelect
            aria-label="days-new"
            value={day}
            onChange={setStateToEvent(setDay)}
          /> : "-----"}
      </Col>
      <Col>
          <Button onClick={createDeadline}>Opret Deadline</Button>
      </Col>
    </Row>)
  }

  const Deadlines = [...state.deadline.values()].map(
    (deadline, i) => <DeadlineRow
                        deadline={deadline}
                        setGlobalDeadline={setGlobalDeadline}
                        key={i}
                        activityDeadline={globalActivityDeadline}
                        injectionDeadline={globalInjectionDeadline}
                      />);

  Deadlines.push(
    <NewDeadlineRow
      key={-1}
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
