import React, { useState } from "react";
import propTypes from 'prop-types'
import { Form, Button, Spinner } from "react-bootstrap";
import styles from "../../css/Authenticate.module.css"
import SiteStyles from "../../css/Site.module.css"
import { AlertBox, ERROR_LEVELS } from "./alert_box";
import { setStateToEvent } from "~/lib/state_management";

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
export function Authenticate({ authenticate, errorMessage, headerMessage, fit_in, spinner, buttonMessage }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function onSubmitFunc(event) {
    event.preventDefault();
    authenticate(username, password);
  }

  return (
    <div className={fit_in ? styles.AuthenticationBox : styles.AuthenticationBoxNoFit}>
      <h3 className={"text-center " + styles.AuthenticationHeader + " " + SiteStyles.mariBold}>{headerMessage}</h3>
        <hr className={SiteStyles.Margin0tb}/>
        <div>
          <Form onSubmit={onSubmitFunc}>
            <div className={"form-group " + styles.formRow}>
              <label htmlFor="username">Bruger navn</label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                aria-label="username"
                autoComplete="new-password"
                value={username}
                onChange={setStateToEvent(setUsername)}
              />
            </div>
            <div className={"form-group " + styles.formRow}>
              <label htmlFor="username">Kodeord</label>
              <input type="password"
                     className="form-control"
                     id="password"
                     autoComplete="new-password"
                     name="password"
                     aria-label="password"
                     value={password}
                     onChange={setStateToEvent(setPassword)}/>
            </div>
            {errorMessage ?
              <AlertBox
                level={ERROR_LEVELS.error}
                message={errorMessage}
              /> : null
            }
            <div className={"form-group " + styles.formRow}>
              { spinner ?
                  <Spinner
                    animation="border"
                    variant="primary"
                  /> :
                  <Button
                    type="submit"
                    className="btn btn-primary">
                      {buttonMessage}
                  </Button>
              }
            </div>
          </Form>
        </div>
      </div>
  );
}

Authenticate.propTypes = {
  authenticate : propTypes.func.isRequired,
  errorMessage : propTypes.string,
  headerMessage : propTypes.string,
  fit_in : propTypes.bool,
  spinner : propTypes.bool,
  buttonMessage : propTypes.string
}

Authenticate.defaultProps = {
  errorMessage : "",
  headerMessage : "Log in",
  fit_in : false,
  spinner : false,
  buttonMessage : "Log in"
}