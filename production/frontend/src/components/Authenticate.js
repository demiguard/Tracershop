import React, { Component } from "react";

import { Form, Button, Container } from "react-bootstrap";
import "./styleAuthenticate.css"

export { Authenticate }

/**
 * This class is for the authentication box 
 * This class should have all the code injected into it and as a result should be VERY Small
 */
export default class Authenticate extends Component {
  constructor(props){
    super(props);

    this.state = {
      username : "",
      password : ""
    }
  }

  handlePasswordChange = (event) => {
    this.setState({password: event.target.value});
  }

  handleUserNameChange = (event) => {
    this.setState({username: event.target.value});
  }

  onSubmitFunc(event) {
    event.preventDefault();
    this.props.authenticate(this.state.username, this.state.password);
  }

  render() {
    return (
      <div className="wrapper AuthenticationBox">
        <h3 className="text-center AuthenticationHeader">Log in</h3>
        <hr className="myHR"/>
        <div>
          <Form onSubmit={this.onSubmitFunc.bind(this)}>
            <div className="form-group formRow">
              <label htmlFor="username">Bruger navn</label>
              <input type="text" className="form-control" id="username" name="username" value={this.state.username} onChange={this.handleUserNameChange} />
            </div>
            <div className="form-group formRow">
              <label htmlFor="username">Kodeord</label>
              <input type="password" className="form-control" id="password" name="password" value={this.state.password} onChange={this.handlePasswordChange} />
            </div>
            <div className="form-group formRow">
              <Button type="submit" className="btn btn-primary">{this.props.login_message}</Button>
            </div>
          </Form>  
          {this.props.ErrorMessage ? 
            <div>
              <hr className="myHR"/>
                <div className="ErrorBox text-center">{this.props.ErrorMessage}</div>
            </div> : <div/>
          }
        </div>
      </div>
    )
  }
}