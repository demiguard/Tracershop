import React, { Component } from "react";
import { User } from "../../dataclasses/user";
import { PROP_LOGOUT, PROP_SET_USER, PROP_USER, USER_GROUPS, PROP_TRACERSHOP_SITE } from "../../lib/constants";
import { ImitatedTracerWebsocket } from "../../lib/imitated_tracer_websocket";
import { Container, FormControl, InputGroup, Row } from "react-bootstrap";
import { Select } from "../injectable/select";

export {ImitationPage}


const User_group_options = {
  0 : "Anonmym Bruger",
  1 : "Adminstrator",
  2 : "Produktion Administrator",
  3 : "Produktion Bruger",
  4 : "Shop Administrator",
  5 : "Shop Intern Kunde",
  6 : "Shop External Kunde"
}

class ImitationPage extends Component {
  constructor(props){
    super(props);

    this.state = {
      imitated_username : "Jay Doe",
      imitated_user_group : USER_GROUPS.ANON,
      imitated_customers :  []
    }
  }

  imitated_logout(){
    this.setState({
      ...this.state,
      imitated_username : "Jay Doe",
      imitated_user_group : USER_GROUPS.ANON,
      imitated_customers : [],
    });
  }

  imitated_set_user(user){
    this.setState({
      ...this.state,
      imitated_username : user.username,
      imitated_user_group : user.user_group,
      imitated_customers : user.customers,
    });
  }

  render() {
    const imitated_user = new User(this.state.imitated_username,
                                   this.state.imitated_user_group,
                                   this.state.imitated_customers)

    const props = {...this.props};
    // Overwrite a relevant attributes
    props[PROP_SET_USER] = this.imitated_set_user.bind(this);
    props[PROP_LOGOUT] = this.imitated_logout.bind(this);
    props[PROP_USER] = imitated_user;

    const Site = props[PROP_TRACERSHOP_SITE]


    return(<Container>
      <Row>
        <InputGroup>
          <FormControl></FormControl>
          <Select></Select>
          <FormControl></FormControl>
        </InputGroup>
      </Row>
      <Row>
        <Site
          {...props}
        />
      </Row>


    </Container>);
  }
}