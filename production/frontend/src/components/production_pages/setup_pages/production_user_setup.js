/** This component is used by production admins to allocate external shop users
 * to their customers
  */
import React, { useEffect, useState } from "react";
import { Card, Col, Container, Form, FormControl, InputGroup, Row } from "react-bootstrap";
import { AUTH_PASSWORD, AUTH_USERNAME, JSON_CUSTOMER, JSON_USER, JSON_USER_ASSIGNMENT, PROP_WEBSOCKET, USER_GROUPS, WEBSOCKET_MESSAGE_SUCCESS, cssCenter } from "../../../lib/constants";
import { Customer, User, UserAssignment } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { TracerWebSocket } from "../../../lib/tracer_websocket"
import { ClickableIcon } from "../../injectable/icons";
import { makePassword } from "../../../lib/formatting";
import { HoverBox } from "../../injectable/hover_box";
import { CustomerSelect } from "../../injectable/derived_injectables/customer_select";

const /**@type {String} Css size of the icon for clicking an action button */ AcceptIconWidth = "52px"

/**
 * 
 * @param {{
 *  customers : Map<Number, Customer>,
 *  websocket : TracerWebSocket
 * }} param0 
 * @returns {Element}
 */
function NewUserRow({customers, websocket}){
  const [newUserName, setNewUserName] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const canCreate = newUserName !== "" && newPassword !== "";

  function createExternalUser() {
    const userSkeleton = {}
    userSkeleton[AUTH_USERNAME] = newUserName;
    userSkeleton[AUTH_PASSWORD] = newPassword;
    if (newCustomer != ""){
      userSkeleton[JSON_CUSTOMER] = Number(newCustomer);
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
        <TracershopInputGroup label="Ny Extern login">
          <FormControl value={newUserName} onChange={(event) =>
            {setNewUserName(event.target.value)}}/>
        </TracershopInputGroup>
    </Col>
    <Col>
        <TracershopInputGroup label="Kunde">
          <CustomerSelect
            value={newCustomer}
            customers={customers}
            emptyCustomer
            onChange={(event) => {
              setNewCustomer(event.target.value)
            }}
          />
        </TracershopInputGroup>
    </Col>
    <Col>
      <TracershopInputGroup label="Kodeord">
        <FormControl value={newPassword} onChange={(event) =>
          {setNewPassword(event.target.value)}}/>
        <InputGroup.Text style={{ width : AcceptIconWidth}}>
        { canCreate ? <ClickableIcon src="static/images/plus.svg"
          onClick={createExternalUser}
        /> :
        <HoverBox Base={
          <ClickableIcon src="/static/images/atom-svgrepo-com.svg"
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

/**
 * 
 * @param {{
 * customers : Map<Number, Customer>
 * user : User,
 * websocket : TracerWebSocket,
 * userMapping : Map<Number,Array<Number, Number>>
 * }} props
 */
function UserRow({user, customers, userMapping, websocket}) {
  const [userAssignmentID, targetCustomer] = userMapping.has(user.id) ? userMapping.get(user.id)[0] : [null, ""]
  // State
  const [relatedCustomer, _setRelatedCustomer] = useState(targetCustomer);
  const [password, setPassword] = useState("");


  function setRelatedCustomer(newCustomerID){
    const newCustomerIDNumber = Number(newCustomerID);
    const oldCustomerIDNumber = Number(relatedCustomer);
    _setRelatedCustomer(newCustomerID)

    if(relatedCustomer !== ""){
      // Delete the old one
      websocket.sendDeleteModel(JSON_USER_ASSIGNMENT, oldCustomerIDNumber);
    }
    if(newCustomerID !== ""){
      websocket.sendCreateModel(JSON_USER_ASSIGNMENT, new UserAssignment(undefined, user.id, newCustomerIDNumber))
    }
  }

  function sendPassword(_event){
    websocket.sendChangePassword(
      user.id,
      password
    ).then((message) => {
      if(message[WEBSOCKET_MESSAGE_SUCCESS] === WEBSOCKET_MESSAGE_SUCCESS){
        setPassword("")
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
              Base={<Form.Check checked={user.active} onChange={changeActive}/>}
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
              value={relatedCustomer}
              onChange={(event) => {setRelatedCustomer(event.target.value)}}
              customers={customers}
              emptyCustomer
            />
          </TracershopInputGroup>
          </Col>

          <Col>
            <TracershopInputGroup label="Kodeord">
              <FormControl value={password} onChange={(event) => {setPassword(event.target.value)}}/>
              <InputGroup.Text style = {{width : AcceptIconWidth}}>
              {password !== "" ?
                <ClickableIcon
                  src="/static/images/accept.svg"
                  onClick={sendPassword}
                />
               :
                <HoverBox Base={
                  <ClickableIcon src="/static/images/atom-svgrepo-com.svg"
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

export function ProductionUserSetup(props){
  const [userFilter, setUserFilter] = useState('');

  const userMapping = new Map() // Again an Array Map
  for(const _userAssignment of props[JSON_USER_ASSIGNMENT].values()){
    const /**@type {UserAssignment} */ userAssignment = _userAssignment;
    if(userMapping.has(userAssignment.user)){
      userMapping.get(userAssignment.user).push([userAssignment.id, userAssignment.customer]);
    } else {
      userMapping.set(userAssignment.user,[[userAssignment.id, userAssignment.customer]]);
    }
  }

  const ExternalUsersRows = [...props[JSON_USER].values()].filter(
    (_user) => {
      const /**@type {User} */ user = _user
      return user.user_group === USER_GROUPS.SHOP_EXTERNAL
    }
  ).map((user, i) => {
    return(
    <UserRow
      key={i}
      user={user}
      customers={props[JSON_CUSTOMER]}
      userMapping={userMapping}
      websocket={props[PROP_WEBSOCKET]}
    />)
  })


  ExternalUsersRows.push(<NewUserRow
    key={-1}
    customers={props[JSON_CUSTOMER]}
    websocket={props[PROP_WEBSOCKET]}
  />)

  return (
  <Container>
    <Row>
      <div>
        <TracershopInputGroup label="Bruger Filter">
          <FormControl value={userFilter} onChange={(event) => {setUserFilter(event.target.value)}}></FormControl>
        </TracershopInputGroup>
      </div>
    </Row>
    {ExternalUsersRows}
  </Container>)
}