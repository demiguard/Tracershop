import React, {Component} from "react";
import Navbar from "../injectable/navbar";
import { Container } from "react-bootstrap";
import propTypes from "prop-types";
import Cookies from "js-cookie";

import Authenticate from "../injectable/authenticate";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, JSON_AUTH, LEGACY_KEYWORD_CUSTOMER, LEGACY_KEYWORD_USERGROUP, PROP_WEBSOCKET, WEBSOCKET_MESSAGE_AUTH_LOGIN, WEBSOCKET_MESSAGE_GREAT_STATE, WEBSOCKET_SESSION_ID } from "../../lib/constants";
import { TracerWebSocket } from "../../lib/tracer_websocket";
import { User } from "../../dataclasses/user";

export {LoginSite}

class LoginSite extends Component {
  static propTypes = {
    set_user : propTypes.func.isRequired,
    websocket : propTypes.instanceOf(TracerWebSocket), // "websocket"
  }

  constructor(props){
    super(props)

    this.state = {
      login_error : "",
      spinner : false,
    }
  }

    // Authentication Methods
    login(username, password){
      this.setState({
        ...this.state,
        login_error : "",
        spinner : true,
      });
      const message = this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_AUTH_LOGIN);
      const auth = {}
      auth[AUTH_USERNAME] = username
      auth[AUTH_PASSWORD] = password
      message[JSON_AUTH] = auth;
      const loginPromise = this.props[PROP_WEBSOCKET].send(message).then((data) => {
        if (data[AUTH_IS_AUTHENTICATED]){
          this.props.set_user(new User(
            data[AUTH_USERNAME],
            data[LEGACY_KEYWORD_USERGROUP],
            data[LEGACY_KEYWORD_CUSTOMER]
          ))

          Cookies.set('sessionid', data[WEBSOCKET_SESSION_ID], {sameSite : 'strict'})
          this.setState( {...this.state,
            login_error : "",
            spinner : false,
          });

          this.props[PROP_WEBSOCKET].send(
            this.props[PROP_WEBSOCKET].getMessage(WEBSOCKET_MESSAGE_GREAT_STATE)
          );
        } else {
          this.setState({...this.state,
            login_error : "Forkert Login",
            spinner : false
          });
        }
      });
    }

  render() {
    return (<div>
      <Navbar
        Names={[]}
        setActivePage={() => {}}
        isAuthenticated={false}
      />
      <Container>
        <Authenticate
          authenticate={this.login.bind(this)}
          errorMessage={this.state.login_error}
          headerMessage="Log in"
          fit_in={true}
          spinner={this.state.spinner}
        />
      </Container>
    </div>)
  }
}