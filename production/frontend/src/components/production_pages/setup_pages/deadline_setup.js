import React, { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";

import { DAYS, DEADLINE_TYPES } from "../../../lib/constants";
import { cssCenter, cssError } from "~/lib/styles";
import { DATA_DEADLINE, DATA_SERVER_CONFIG } from "~/lib/shared_constants";
import { Deadline, ServerConfiguration } from "../../../dataclasses/dataclasses";
import { Select, toOptions } from "../../injectable/select";
import { appendNewObject, setStateToEvent, setTempMapToEvent } from "../../../lib/state_management";
import { parseTimeInput } from "../../../lib/user_input";
import { TimeInput } from "../../injectable/inputs/time_input";
import { ErrorInput } from "../../injectable/inputs/error_input";
import { DaysSelect } from "../../injectable/derived_injectables/days_select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { nullParser } from "~/lib/formatting";
import { Optional } from "~/components/injectable/optional";
import { compareLoosely, nullify } from "~/lib/utils";
import { CommitButton } from "~/components/injectable/commit_button";


/**
 * @enum The possible values for the select of
 */
export const GlobalDeadlineValuesOptions = {
  NO_OPTION : 1,
  GLOBAL_ACTIVITY_DEADLINE : 2,
  GLOBAL_INJECTION_DEADLINE : 3,
}

const GLOBAL_OPTIONS = toOptions([
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

function getNewDeadline(){
  return new Deadline(-1, DEADLINE_TYPES.DAILY, "", null);
}

/**
 * This is a table like, that displays the deadlines to the user.
 * They can modify deadlines and change any global deadlines.
 * @returns {Element}
 */
export function DeadlineSetup(){
  const state = useTracershopState();
  const websocket = useWebsocket();

  const [deadlines, setDeadlines] = useState(appendNewObject(state.deadline, getNewDeadline));
  const [errors, setErrors] = useState(new Map())

  useEffect(() => {
    setDeadlines(appendNewObject(state.deadline, getNewDeadline));
  }, [state.deadline])

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

  const Deadlines = [...deadlines.values()].map(
    (deadline, i) => {
      const error = errors.has(deadline.id) ? errors.get(deadline.id) : "";
      const changed = state.deadline.has(deadline.id) ?
                        !compareLoosely(state.deadline.get(deadline.id), deadline)
                        : true;

      const isGlobalDeadline = globalActivityDeadline == deadline.id || globalInjectionDeadline == deadline.id;

      let globalValue = (() => {
        if(deadline.id === globalActivityDeadline){
          return GlobalDeadlineValuesOptions.GLOBAL_ACTIVITY_DEADLINE;
        }
        if (deadline.id === globalInjectionDeadline){
          return GlobalDeadlineValuesOptions.GLOBAL_INJECTION_DEADLINE;
        }
        return GlobalDeadlineValuesOptions.NO_OPTION;
      })();

      function validate(){
        const [validTime, time] = parseTimeInput(deadline.deadline_time, "Deadline tidspunktet");

        if(!validTime){
          setErrors(oldErrors => {
            const newErrors = new Map(oldErrors);
            newErrors.set(deadline.id, time);
            return newErrors;
          });
          return [false, {}];
        }

        if (errors.has(deadline.id)){
          setErrors(oldErrors => {
            const newErrors = new Map(oldErrors);
            newErrors.delete(deadline.id);
            return newErrors;
          });
        }

        return [true, {...deadline, deadline_time : time,
                                    deadline_type : Number(deadline.deadline_type),
                                    deadline_day : nullify(Number(deadline.deadline_day))}];
      }

      function setTime(new_time_value){
        const newDeadline = deadline.copy();
        newDeadline.deadline_time = new_time_value;
        setDeadlines(old_state => {
          const newState = new Map(old_state);
          newState.set(newDeadline.id, newDeadline);
          return newState;
        });
      }

      function setDeadlineType(event){
        const new_type = Number(event.target.value);
        if (new_type != deadline.deadline_type){
          const newDeadline = deadline.copy();
          newDeadline.deadline_type = new_type;
          if(new_type == DEADLINE_TYPES.DAILY){
            newDeadline.deadline_day = null;
          } else { // WEEKLY TYPE
            newDeadline.deadline_day = DAYS.MONDAY;
          }
          setDeadlines(old_state => {
            const newState = new Map(old_state);
            newState.set(newDeadline.id, newDeadline);
            return newState;
          });
        } // Else do nothing
      }

      return (<Row key={i}>
      <Col>
        <Select
          aria-label={`type-${deadline.id}`}
          options={DEADLINE_TYPE_OPTIONS}
          value={deadline.deadline_type}
          onChange={setDeadlineType}
        />
      </Col>
      <Col>
        <ErrorInput error={error}>
          <TimeInput
            aria-label={`time-${deadline.id}`}
            value={deadline.deadline_time}
            stateFunction={setTime}
          />
        </ErrorInput>
      </Col>
      <Col style={cssCenter}>
        <Optional exists={Number(deadline.deadline_type) === DEADLINE_TYPES.WEEKLY} alternative={<p>--------------</p>}>
          <DaysSelect
            aria-label={`days-${deadline.id}`}
            value={deadline.deadline_day}
            onChange={setTempMapToEvent(setDeadlines, deadline.id, 'deadline_day')}
          />
        </Optional>
      </Col>
      <Col>
        <Optional exists={deadline.id != -1}>
          <Select
            aria-label={`global-${deadline.id}`}
            canEdit={!isGlobalDeadline}
            options={GLOBAL_OPTIONS}
            onChange={setGlobalDeadline(deadline)}
            value={globalValue}
          />
        </Optional>
      </Col>
      <Col>
        <Optional exists={changed}>
          <CommitButton
            label={`commit-${deadline.id}`}
            temp_object={deadline}
            validate={validate}
            object_type={DATA_DEADLINE}
          />
        </Optional>

      </Col>
    </Row>)
    });

  return <Container>
    <Row>
      <Col><h3>Deadline type</h3></Col>
      <Col><h3>Tidspunkt</h3></Col>
      <Col><h3>Dag</h3></Col>
      <Col><h3>Globale Deadlines</h3></Col>
      <Col></Col>
      <hr/>
    </Row>
    {Deadlines}
  </Container>
}
