import React, { Component } from "react";

import { Form, Button, Container } from "react-bootstrap";
import styles from "/src/css/Authenticate.module.css"
import SiteStyles from "/src/css/Site.module.css"

export { Authenticate }

/**
 * This class is for the authentication box
 * This class should have all the code injected into it and as a result should be VERY Small
 * IE this class doesn't perform any networking
 *
 * Props:
 *  @param {CallableFunction} authenticate : Function - that takes the arguments username and password of the user to authenticate them,
 *  @param {String} ErrorMessage : String that describes the user didn't type their password correctly
 *  @param {String} login_message  : String Message to be written inside of the box that logs a user in
 *  @param {Boolean} fit_in : Boolean deciding if extra css is needed let the box in its full glory
 *
 * @author Christoffer Vilstrup Jensen
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
      <div className={this.props.fit_in ? styles.AuthenticationBox : styles.AuthenticationBoxNoFit}>
        <h3 className={"text-center " + styles.AuthenticationHeader + " " + SiteStyles.mariBold}>Log in</h3>
        <hr className={SiteStyles.Margin0tb}/>
        <div>
          <Form onSubmit={this.onSubmitFunc.bind(this)}>
            <div className={"form-group " + styles.formRow}>
              <label htmlFor="username">Bruger navn</label>
              <input type="text" className="form-control" id="username" name="username" autoComplete="new-password" value={this.state.username} onChange={this.handleUserNameChange} />
            </div>
            <div className={"form-group " + styles.formRow}>
              <label htmlFor="username">Kodeord</label>
              <input type="password"
                     className="form-control"
                     id="password"
                     autoComplete="new-password"
                     name="password"
                     value={this.state.password}
                     onChange={this.handlePasswordChange}/>
            </div>
            <div className={"form-group " + styles.formRow}>
              <Button type="submit" className="btn btn-primary">{this.props.login_message}</Button>
            </div>
          </Form>
          {this.props.ErrorMessage ?
            <div>
              <hr className={SiteStyles.Margin0tb}/>
                <div className={"form-group " + styles.ErrorBox}>{this.props.ErrorMessage}</div>
            </div> : <div/>
          }
        </div>
      </div>
    )
  }
}