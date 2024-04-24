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
import { DATA_USER_ASSIGNMENT, SUCCESS_STATUS_CREATING_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,
  WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";


const ERROR_MESSAGE_NO_LDAP_USERNAME = "Bruger findes ikke!"
const ERROR_MESSAGE_INCORRECT_GROUPS = "Brugeren har ikke korrekte CBAS rettigheder!"

function UserAssignmentRow(props){
  const {user_assignment, activeCustomer} = props;
  const state = useTracershopState();
  const websocket = useWebsocket();
  const exists = user_assignment.id !== null
  const initUserName = state.user.has(user_assignment.user)
                     ? state.user.get(user_assignment.user).username : "";
  const [username, setUserName] = useState(initUserName);
  const [error, setError] = useState("");

  // Note that creating user assignments are a tad more difficult due to
  //the nature, that user might not exists yet.
  function create_user_assignment(){
    websocket.send({
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_USER_ASSIGNMENT,
      username : username,
      customer_id : activeCustomer
    }).then((data) => {
      if(data.status === SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.NO_LDAP_USERNAME){
        setError(ERROR_MESSAGE_NO_LDAP_USERNAME);
      } else if(data.status === SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.INCORRECT_GROUPS){
        setError(ERROR_MESSAGE_INCORRECT_GROUPS);
      } else if (data.status === SUCCESS_STATUS_CREATING_USER_ASSIGNMENT.SUCCESS){
        setUserName("");
      } else {
        console.log(data)
      }
    });
  }

  function delete_user_assignment(){
    websocket.sendDeleteModel(DATA_USER_ASSIGNMENT, user_assignment.id);
  }

  const ActionButton = (exists) ? <ClickableIcon
    src="/static/images/decline.svg"
    onClick={delete_user_assignment}
  /> : <ClickableIcon
    onClick={create_user_assignment}
    src="/static/images/plus.svg"
  />;

  return (
  <Row>
    <Col>
      <TracershopInputGroup error={error} label="Brugernavn:">
        <EditableInput
          canEdit={!exists}
          value={username}
          onChange={setStateToEvent(setUserName)}
        />
      </TracershopInputGroup>
    </Col>
    <Col style={cssCenter}>
      {ActionButton}
    </Col>
  </Row>);
}


export function UserSetup({relatedCustomer}){
  const state = useTracershopState();
  const init = useRef({
    customer : null
  });

  if(init.current.customer === null){
    for(const customer of relatedCustomer.values()){
      init.current.customer = customer.id;
      break;
    }
  }

  const [activeCustomer, setActiveCustomer] = useState(init.current.customer);

  const userAssignmentRows = [(
    <UserAssignmentRow
      key={-1}
      activeCustomer={activeCustomer}
      user_assignment={new UserAssignment(null, null, activeCustomer)}
    />)];

  for(const userAssignment of state.user_assignment.values()){
    if(userAssignment.customer === activeCustomer &&
       userAssignment.user !== state.logged_in_user.id){
        userAssignmentRows.push(<UserAssignmentRow
                                  activeCustomer={activeCustomer}
                                  user_assignment={userAssignment}
                                  key={userAssignment.id}
                                />);
    }
  }

  return (<div>
    <TracershopInputGroup label="Kunde">
      <CustomerSelect
        customers={relatedCustomer}
        value={activeCustomer}
        onChange={setStateToEvent(setActiveCustomer)}
      />
    </TracershopInputGroup>
    {userAssignmentRows}
  </div>);
}