import React, { useState} from "react";
import { Container } from "react-bootstrap";
import propTypes from "prop-types";
import Cookies from "js-cookie";

import { TracershopNavbar } from "../injectable/navbar";
import Authenticate from "../injectable/authenticate";
import { PROP_SET_USER } from "~/lib/constants";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, AUTH_USER, DATA_AUTH, WEBSOCKET_MESSAGE_GET_STATE, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_AUTH_LOGIN } from "../../lib/shared_constants"

import { deserialize_single } from "~/lib/serialization";
import { useWebsocket } from "../tracer_shop_context";

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
  const websocket = useWebsocket()
  const [state, setState] = useState(DEFAULT_STATE);

  // Authentication Methods
  function login(username, password){
    setState(SPINNER_STATE);

    const message = websocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    const auth = {}
    auth[AUTH_USERNAME] = username
    auth[AUTH_PASSWORD] = password
    message[DATA_AUTH] = auth;
    websocket.send(message).then((data) => {
      if (data[AUTH_IS_AUTHENTICATED]){
        const user = deserialize_single(data[AUTH_USER])
        props[PROP_SET_USER](user);
        Cookies.set('sessionid',
                    data[WEBSOCKET_SESSION_ID],
                    {sameSite : 'strict', secure : true});
        setState(DEFAULT_STATE);
        websocket.send(
          websocket.getMessage(WEBSOCKET_MESSAGE_GET_STATE)
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
