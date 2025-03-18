import React, {  } from "react";
import { Container } from "react-bootstrap";
import Cookies from "js-cookie";

import { TracershopNavbar } from "../injectable/navbar";
import { Authenticate } from "../injectable/authenticate";
import { DATABASE_CURRENT_USER, PROP_SET_USER } from "~/lib/constants";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, AUTH_USER, DATA_AUTH,
  WEBSOCKET_MESSAGE_READ_STATE, WEBSOCKET_SESSION_ID, WEBSOCKET_MESSAGE_AUTH_LOGIN,
  DATA_USER} from "../../lib/shared_constants.js"

import { deserialize_single } from "~/lib/serialization";
import { useWebsocket, useTracershopDispatch } from "../../contexts/tracer_shop_context";
import { UpdateCurrentUser } from "~/lib/state_actions";
import { db } from "~/lib/local_storage_driver";
import { useErrorState } from "~/lib/error_handling";

export function LoginSite(props) {
  const websocket = useWebsocket()
  const dispatch = useTracershopDispatch()
  const [loginError, setLoginError] = useErrorState();

  // Authentication Methods
  // Remember it's important to return the promise, because the underlying
  // impotent button is using it to determine if to show a spinner or a button.
  function login(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
    const auth = {
      [AUTH_USERNAME] : username,
      [AUTH_PASSWORD] : password,
    }
    message[DATA_AUTH] = auth;
    return websocket.send(message).then((data) => {
      if (data[AUTH_IS_AUTHENTICATED]){
        setLoginError();
        const user = deserialize_single(data[DATA_USER])
        db.set(DATABASE_CURRENT_USER, user);
        dispatch(new UpdateCurrentUser(user));
        Cookies.set('sessionid', data[WEBSOCKET_SESSION_ID], {sameSite : 'strict'});
        websocket.send(websocket.getMessage(WEBSOCKET_MESSAGE_READ_STATE)); // Refreshes the state
      } else {
        setLoginError("Forkert login.")
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
        error={loginError}
        headerMessage="Log in"
        fit_in={true}
      />
    </Container>
  </div>);
}
