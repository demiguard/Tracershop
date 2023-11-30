import React, { useRef, useState } from "react";
import { CustomerSelect } from "../injectable/derived_injectables/customer_select";
import { setStateToEvent } from "~/lib/state_management";
import { TracershopInputGroup } from "../injectable/inputs/tracershop_input_group";
import { useTracershopState, useWebsocket } from "../tracer_shop_context";
import { UserAssignment } from "~/dataclasses/dataclasses";
import { EditableInput } from "../injectable/inputs/editable_input";
import { ClickableIcon } from "../injectable/icons";
import { Col, Row } from "react-bootstrap";
import { cssCenter } from "~/lib/constants";
import { WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";


export function UserSetup({relatedCustomer}){
  const state = useTracershopState();
  const websocket = useWebsocket();
  const init = useRef({
    customer : null
  });

  if(init.current.customer === null){
    for(const customer of relatedCustomer){
      init.current.customer = customer.id;
      break;
    }
  }

  const [activeCustomer, setActiveCustomer] = useState(init.current.customer);


  function UserAssignmentRow({user_assignment}){
    const exists = user_assignment.id !== null
    const initUserName = state.user.has(user_assignment.user) ? state.user.get(user_assignment.user).username : "";

    const [username, setUserName] = useState(initUserName);

    function delete_user_assignment(){

    }

    // Note that creating user assignments are a tad more difficult due to the nature, that user might not exists yet.
    function create_user_assignment(){
      websocket.send({
        [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,
        username : username,
        customer_id : activeCustomer
      })
    }

    const ActionButton = (exists) ? <ClickableIcon
      src="/static/images/decline.svg"
      onClick={delete_user_assignment}
    /> : <ClickableIcon
      onClick={create_user_assignment}
      src="/static/images/plus.svg"
    />;

    return <Row>
      <Col>
        <TracershopInputGroup label="Brugernavn:">
          <EditableInput
            canEdit={!exists}
            value={username}
            onChange={setUserName}
          />
        </TracershopInputGroup>
      </Col>
      <Col style={cssCenter}>
        {ActionButton}
      </Col>
    </Row>
  }

  const userAssignmentRows = [...state.user_assignment.values()].filter(
    (userAssignment) => userAssignment.customer === activeCustomer && userAssignment.user !== state.logged_in_user.id
  ).map(userAssignment => <UserAssignmentRow user_assignment={userAssignment} key={userAssignment.id}/> );

  userAssignmentRows.push(
    <UserAssignmentRow
      key={-1}
      user_assignment={new UserAssignment(null, null, activeCustomer)}
    />
  );

  return (<div>
    <TracershopInputGroup label="Kunde">
      <CustomerSelect
        customers={relatedCustomer}
        value={activeCustomer}
        onChange={setStateToEvent(setActiveCustomer)}
      />
    </TracershopInputGroup>
    {userAssignmentRows}
  </div>)
}