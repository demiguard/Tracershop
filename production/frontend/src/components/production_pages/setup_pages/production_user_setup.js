/** This component is used by production admins to allocate external shop users
 * to their customers
  */
import React, { useEffect, useRef, useState } from "react";
import { Card, Col, Container, Form, FormControl, InputGroup, Row } from "react-bootstrap";
import {  USER_GROUPS } from "~/lib/constants";
import { cssCenter } from "~/lib/styles";
import { AUTH_PASSWORD, AUTH_USERNAME, DATA_CUSTOMER,
  DATA_USER_ASSIGNMENT, WEBSOCKET_DATA, WEBSOCKET_DATA_ID,
  WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD, WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
  WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants"
import { User, UserAssignment } from "~/dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { ClickableIcon } from "../../injectable/icons.tsx";
import { nullParser } from "~/lib/formatting";
import { CustomerSelect } from "../../injectable/derived_injectables/customer_select";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { setStateToEvent, setTempMapToEvent, setTempObjectMapToEvent } from "~/lib/state_management";
import { ArrayMap } from "~/lib/array_map";
import { EditableInput } from "~/components/injectable/inputs/editable_input";

import { nullify } from "~/lib/utils";

export function ProductionUserSetup(){
  const state = useTracershopState()
  const /** @type {{current : Map<Number, User>?}} */ initial_external_users = useRef(null);
  const userMapping = new ArrayMap()
  for(const userAssignment of state.user_assignment.values()){
    userMapping.set(userAssignment.user, userAssignment);
  }

  function initialize_users(map){
    for (const user of state.user.values()){
      if(user.user_group === USER_GROUPS.SHOP_EXTERNAL){
        const user_assignment = userMapping.has(user.id)
          ? userMapping.get(user.id)[0]
          : null;

        map.set(user.id, {
          id : user.id,
          username : user.username,
          password : "",
          user_assignment : user_assignment
        });
      }
    }
    if(!map.has(-1)){
      map.set(-1,{
        id : -1,
        username : "",
        password : "",
        user_assignment : null
      })
    }
  }

  if(initial_external_users.current === null){
    initial_external_users.current = new Map();
    initialize_users(initial_external_users.current);
  }

  const [userFilter, setUserFilter] = useState('');
  const [userState, setUserState] = useState(initial_external_users.current);

  useEffect(function updateUsers(){
    setUserState(old => {
      const newState = new Map(old);
      initialize_users(newState);

      return newState
    })
  }, [state.user])

  const websocket = useWebsocket();

  const ExternalUsersRows = [...userState.values()].map(
    (user) => {
      const userExists = user.id !== -1;
      const assignedCustomer = user.user_assignment ? user.user_assignment.customer : null

      function handleUserClick(){
        if(userExists){
          if(user.password){
            const promise = websocket.send({
              [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CHANGE_EXTERNAL_PASSWORD,
              [WEBSOCKET_DATA_ID] : user.id,
              [AUTH_PASSWORD] : user.password
            })
            promise.then(() => {
              setUserState(oldState => {
                const newState = new Map(oldState);
                newState.set(user.id, {...user, password : ""});
                return newState;
              });
            });
        }
      } else { // not UserExists
        websocket.send({
          [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CREATE_EXTERNAL_USER,
          [WEBSOCKET_DATA] : {
            [AUTH_USERNAME] : user.username,
            [AUTH_PASSWORD] : user.password,
            [DATA_CUSTOMER] : assignedCustomer,
          }
        });
      }
    }

    function setUserAssignment(event){
      const targetCustomerID = nullify(Number(event.target.value));
      if(assignedCustomer === targetCustomerID){
        return
      }

      if(userExists) {
        if(user.user_assignment && user.user_assignment.customer != targetCustomerID){
          websocket.sendDeleteModels(DATA_USER_ASSIGNMENT, user.user_assignment);
        }
        if(targetCustomerID){
          websocket.sendCreateModel(DATA_USER_ASSIGNMENT, {
            user : user.id,
            customer : targetCustomerID
          })
        }
      } else { // User doesn't exists
        setUserState(old => {
          const newState = new Map(old);
          const newUser = {...user, user_assignment : {customer : targetCustomerID}};
          newState.set(newUser.id, newUser);
          return newState;
        });
      }
    }

    const image_src = userExists ?
              "/static/images/update.svg"
            : "/static/images/plus2.svg";

      return (
        <Card key={user.id}>
          <Card.Header>
            <Row>
              <Col style={cssCenter} xs="3">
                <TracershopInputGroup label="Kunde">
                  <EditableInput
                    canEdit={user.id == -1}
                    value={user.username}
                    onChange={
                    setTempObjectMapToEvent(setUserState, user.id, 'username')
                  }/>
                </TracershopInputGroup>
              </Col>
              <Col>
                <TracershopInputGroup label="Kunde" style={
                  { height : "45px", margin : "5px"}}
              >
                <CustomerSelect
                  aria-label={`related-customer-${user.id}`}
                  value={nullParser(assignedCustomer)}
                  customers={state.customer}
                  emptyCustomer
                  onChange={setUserAssignment}
                />
              </TracershopInputGroup>
              </Col>
              <Col>
                <TracershopInputGroup label="Kodeord">
                  <FormControl
                    aria-label={`password-${user.id}`}
                    value={user.password}
                    onChange={setTempObjectMapToEvent(setUserState, user.id, 'password')}/>
                </TracershopInputGroup>
              </Col>
              <Col xs="1" style={cssCenter}>
                <ClickableIcon
                  label={`commit-user-${user.id}`}
                  src={image_src}
                  onClick={handleUserClick}
                />
              </Col>
            </Row>
          </Card.Header>
        </Card>);
    });

  return (
  <Container>
    <Row>
      <div>
        <TracershopInputGroup label="Bruger Filter">
          <FormControl
            value={userFilter}
            onChange={setStateToEvent(setUserFilter)}
          />
        </TracershopInputGroup>
      </div>
    </Row>
    {ExternalUsersRows}
  </Container>)
}