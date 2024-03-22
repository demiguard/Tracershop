/** This component is used by production admins to allocate external shop users
 * to their customers
  */
import React, { useRef, useState } from "react";
import { Card, Col, Container, Form, FormControl, InputGroup, Row } from "react-bootstrap";
import {  USER_GROUPS, cssCenter } from "~/lib/constants";
import { AUTH_PASSWORD, AUTH_USERNAME, DATA_CUSTOMER,
  DATA_USER_ASSIGNMENT, WEBSOCKET_MESSAGE_SUCCESS } from "~/lib/shared_constants"
import { User, UserAssignment } from "~/dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { ClickableIcon } from "../../injectable/icons";
import { makePassword } from "~/lib/formatting";
import { HoverBox } from "../../injectable/hover_box";
import { CustomerSelect } from "../../injectable/derived_injectables/customer_select";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context";
import { setStateToEvent } from "~/lib/state_management";
import { ArrayMap } from "~/lib/array_map";

const /**@type {String} Css size of the icon for clicking an action button */ AcceptIconWidth = "52px"


export function ProductionUserSetup(){
  const state = useTracershopState()
  const /** @type {{current : Map<Number, User>?}} */ initial_external_users = useRef(null);
  const userMapping = new ArrayMap()
  for(const userAssignment of state.user_assignment.values()){
    userMapping.set(userAssignment.user, userAssignment.customer);
  }

  if(initial_external_users.current === null){
    initial_external_users.current = new Map();
    for (const user of state.user.mapping){
      if(user.user_group === USER_GROUPS.SHOP_EXTERNAL){
        const user_assignment = userMapping.get(user.id, null)


        initial_external_users.current.set(user.id, {
          id : user.id,
          username : user.username,
          password : "",
          user_assignment :
        });
      }
    }
  }

  const websocket = useWebsocket();
  const [userFilter, setUserFilter] = useState('');
  const [userState, setUserState] = useState(initial_external_users.current);


   /**
  *
  * @param {{
  * user : User,
  * }} props
   */
  function UserRow({user}) {
    const [userAssignmentID, targetCustomer] = userMapping.has(user.id) ? userMapping.get(user.id)[0] : [null, ""]
    // State
    const [relatedCustomer, _setRelatedCustomer] = useState(targetCustomer);
    const [password, setPassword] = useState("");

    function setRelatedCustomer(newCustomerID){
      const newCustomerIDNumber = Number(newCustomerID);
      _setRelatedCustomer(newCustomerID);

      if(userAssignmentID !== null){
        // Delete the old one
        websocket.sendDeleteModel(DATA_USER_ASSIGNMENT, userAssignmentID);
      }
      if(newCustomerID !== ""){
        websocket.sendCreateModel(DATA_USER_ASSIGNMENT, new UserAssignment(undefined, user.id, newCustomerIDNumber))
      }
    }

    function sendPassword(_event){
      websocket.sendChangePassword(
        user.id,
        password
      ).then((message) => {
        if(message[WEBSOCKET_MESSAGE_SUCCESS] === WEBSOCKET_MESSAGE_SUCCESS){
          setPassword("");
        }
      })
    }

    function changeActive(_event){
      websocket.sendChangeUserActivity(user.id);
    }

    return (
      <Card>
        <Card.Header>
          <Row>
            <Col style={cssCenter} xs="2">
              {user.username}
            </Col>
            <Col style={cssCenter} xs="2">
              <HoverBox
                Base={<Form.Check
                          aria-label={`active-${user.id}`}
                          checked={user.active}
                          onChange={changeActive}/>}
                Hover={<p>Om brugeren er aktiv og kan logge ind eller ej</p>}
              >
              </HoverBox>
            </Col>
            <Col>
            <TracershopInputGroup
              label="Kunde"
              style={{ height : "45px",
                       margin : "5px",
                    }}
            >
              <CustomerSelect
                aria-label={`related-customer-${user.id}`}
                value={relatedCustomer}
                onChange={setStateToEvent(setRelatedCustomer)}
                customers={state.customer}
                emptyCustomer
              />
            </TracershopInputGroup>
            </Col>
            <Col>
              <TracershopInputGroup label="Kodeord">
                <FormControl
                  aria-label={`password-${user.id}`}
                  value={password}
                  onChange={setStateToEvent(setPassword)}/>
                <InputGroup.Text style = {{width : AcceptIconWidth}}>
                {password.length > 7 ?
                  <ClickableIcon
                    label={`update-password-${user.id}`}
                    src="/static/images/accept.svg"
                    onClick={sendPassword}
                  />
                 :
                  <HoverBox Base={
                    <ClickableIcon
                    label={`generate-password-${user.id}`}
                      src="/static/images/atom-svgrepo-com.svg"
                      onClick={() => {setPassword(makePassword(12))}}
                    />}
                    Hover={<p
                      style={{
                        margin: "auto",
                        padding: "1px",
                        textAlign : "center"
                      }}
                    >Klik for at lave et sikkert kodeord</p>}
                    />
                  }
                </InputGroup.Text>
              </TracershopInputGroup>
            </Col>
          </Row>
        </Card.Header>
      </Card>);
  }


   /**
  *
  * @param {{
   * }} param0
   * @returns {Element}
   */
  function NewUserRow(){
    const [newUserName, setNewUserName] = useState("");
    const [newCustomer, setNewCustomer] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const canCreate = newUserName !== "" && newPassword !== "";
    function createExternalUser() {
      const userSkeleton = {}
      userSkeleton[AUTH_USERNAME] = newUserName;
      userSkeleton[AUTH_PASSWORD] = newPassword;
      if (newCustomer != ""){
        userSkeleton[DATA_CUSTOMER] = Number(newCustomer);
      }
      websocket.sendCreateExternalUser(userSkeleton).then(
        () => {
          // TO DO. This might fail
          setNewUserName("")
          setNewCustomer("")
          setNewPassword("")
        }
      )
    }

    return (<Card>
      <Card.Header>
        <Row>
          <Col>
          <TracershopInputGroup label="Nyt Extern login">
            <FormControl
              aria-label="new-user-name"
              value={newUserName}
              onChange={setStateToEvent(setNewUserName)}/>
          </TracershopInputGroup>
      </Col>
      <Col>
          <TracershopInputGroup label="Kunde">
            <CustomerSelect
              aria-label="new-customer"
              value={newCustomer}
              customers={state.customer}
              emptyCustomer
              onChange={setStateToEvent(setNewCustomer)}
            />
          </TracershopInputGroup>
      </Col>
      <Col>
        <TracershopInputGroup label="Kodeord">
          <FormControl
            aria-label="new-password"
            value={newPassword}
            onChange={setStateToEvent(setNewPassword)}
          />
          <InputGroup.Text style={{ width : AcceptIconWidth}}>
          { canCreate ? <ClickableIcon
                          label="create-new-user"
                          src="static/images/plus.svg"
                          onClick={createExternalUser}
                        />
          : <HoverBox Base={
            <ClickableIcon
              label="generate-new-password"
              src="/static/images/atom-svgrepo-com.svg"
            onClick={() => {setNewPassword(makePassword(12))}}
            />}
            shiftX={1000}
            shiftY={-1000}
            Hover={<p
              style={{
                margin: "auto",
                padding: "1px",
                textAlign : "center"
              }}
            >Klik for at lave et sikkert kodeord</p>}
            />
            }
          </InputGroup.Text>
        </TracershopInputGroup>
        </Col>
      </Row>
    </Card.Header>
    </Card>)
  }

  const ExternalUsersRows = [...state.user.values()].filter(
    (user) => {
      return user.user_group === USER_GROUPS.SHOP_EXTERNAL
    }).map((user, i) => {
              return(<UserRow
                      key={i}
                      user={user}
                     />)});


  ExternalUsersRows.push(<NewUserRow key={-1} />);

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