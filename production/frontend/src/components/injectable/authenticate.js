import React, { useState } from "react";
import propTypes from 'prop-types'
import { Form, Button, Spinner } from "react-bootstrap";
//import styles from "../../css/Authenticate.module.css"
import { FONT, MARGIN } from '~/lib/styles'
import { AlertBox, ERROR_LEVELS } from "./alert_box";
import { setStateToEvent } from "~/lib/state_management";
import { Optional } from "~/components/injectable/optional";
import { RecoverableError } from "~/lib/error_handling";
import { IdempotentButton } from "~/components/injectable/buttons";

const styles = {
  authenticateBox : {
    width: '20em',
    margin: '6em',
    border: '2px',
    borderColor: 'var(--secondary-color-1)',
    borderStyle: 'solid',
    borderRadius: '10px',
  },
  authenticationBoxNoFit : {
    border: '2px',
    borderColor: 'var(--secondary-color-1)',
    borderStyle: 'solid',
    borderRadius: '10px',
  },
  authenticationHeader : {
    backgroundColor: 'var(--secondary-color-3)',
    color: 'var(--primary-color)',
    lineHeight: '150%',
    marginBottom: '0pt',
    borderTopLeftRadius : '10px',
    borderTopRightRadius : '10px',
  },
  formRow : {
    padding : '1.5em'
  },
  errorBox : {
    margin: '1.5em',
    padding: '5px',
    backgroundColor: 'var(--red-2)',
    borderColor: 'var(--red-1)',
    borderStyle: 'solid',
    border: '2px',
  }
}

/**
 * This class is for the authentication box
 * This class should have all the code injected into it and as a result should be VERY Small
 * IE this class doesn't perform any networking
 *
 * Props:
 *  @param {CallableFunction} authenticate : Function - that takes the arguments username and password of the user to authenticate them,
 *  @param {RecoverableError} error : String that describes the user didn't type their password correctly
 *  @param {String} login_message  : String Message to be written inside of the box that logs a user in
 *  @param {Boolean} fit_in : Boolean deciding if extra css is needed let the box in its full glory
 *
 * @author Christoffer Vilstrup Jensen
 */
export function Authenticate({ authenticate,
                               error=new RecoverableError(),
                               setError=()=>{},
                               headerMessage="Log in",
                               fit_in = false,
                               buttonMessage = "Log in"
                            }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function onSubmitFunc() {
    if(password){
      return authenticate(username, password);
    } else {
      setError(new RecoverableError(
        "Dit kodeord er ikke tastet ind.",
         ERROR_LEVELS.warning
      ));
    }
    return Promise.resolve();
  }

  return (
    <div style={fit_in ? styles.authenticateBox : styles.authenticationBoxNoFit}>
      <h3 style={{
        ...styles.authenticationHeader,
        ...FONT.bold
      }} className={"text-center"}>{headerMessage}</h3>
        <hr style={MARGIN.topBottom.px0}/>
        <div>
          <div className={"form-group"} style={styles.formRow}>
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
          <div className={"form-group"} style={styles.formRow}>
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
          {/* Note that Alert box doesn't render on no error */}
          <AlertBox
            error={error}
          />
          <div className={"form-group"} style={styles.formRow}>
            <IdempotentButton onClick={onSubmitFunc}>{buttonMessage}</IdempotentButton>
          </div>
        </div>
      </div>
  );
}

Authenticate.propTypes = {
  authenticate : propTypes.func.isRequired,
  error : propTypes.instanceOf(RecoverableError),
  headerMessage : propTypes.string,
  fit_in : propTypes.bool,
  spinner : propTypes.bool,
  buttonMessage : propTypes.string
}
