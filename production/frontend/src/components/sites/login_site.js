import React, { useState} from "react";
import { TracershopNavbar } from "../injectable/navbar";
import { Container } from "react-bootstrap";
import propTypes from "prop-types";
import Cookies from "js-cookie";

import Authenticate from "../injectable/authenticate";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, AUTH_USER_ID, JSON_AUTH, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_USERGROUP, PROP_SET_USER, PROP_USER, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_AUTH_LOGIN, WEBSOCKET_MESSAGE_GET_STATE, WEBSOCKET_MESSAGE_GREAT_STATE, WEBSOCKET_SESSION_ID } from "../../lib/constants";

import { User } from "../../dataclasses/dataclasses";

const DEFAULT_STATE = {
  loginError : "",
  spinner : false,
}

const SPINNER_STATE = {
  loginError : "",
  spinner : true,
}

const ERROR_STATE = {
  login_error : "Forkert Login",
  spinner : false
}

export function LoginSite(props) {
  const [state, setState] = useState(DEFAULT_STATE);

  // Authentication Methods
  function login(username, password){
    setState(SPINNER_STATE);

    const message = props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    const auth = {}
    auth[AUTH_USERNAME] = username
    auth[AUTH_PASSWORD] = password
    message[JSON_AUTH] = auth;
    props[PROP_WEBSOCKET].send(message).then((data) => {
      if (data[AUTH_IS_AUTHENTICATED]){
        props[PROP_SET_USER](new User(
          undefined,
          data[PROP_USER].id,
          data[PROP_USER].username,
          data[PROP_USER].user_group,
          data[PROP_USER].active
        ));
        Cookies.set('sessionid',
                    data[WEBSOCKET_SESSION_ID],
                    {sameSite : 'strict'});
        setState(DEFAULT_STATE);
        props[PROP_WEBSOCKET].send(
        props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GET_STATE)
      );
      } else {
        setState(ERROR_STATE);
      }
    });
    }

  return (<div>
    <TracershopNavbar
      Names={[]}
      setActivePage={() => {}}
      isAuthenticated={false}
    />
    <Container>
      <Authenticate
        authenticate={login}
        errorMessage={state.login_error}
        headerMessage="Log in"
        fit_in={true}
        spinner={state.spinner}
      />
    </Container>
  </div>);
}