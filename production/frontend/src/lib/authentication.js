/**
 * This file Contains the authentication methods for login, Some code is stolen shamelessly from the interwebs
 * I think it was a tutorial on login with React
 * Also you should prob think about using websocket instead of Ajax
 *
 * Also you should prob move this code into The Authenticate component
 *
 * Author : Christoffer Visltrup Jensen
 */

import { db } from "/src/lib/localStorageDriver";
import { get as getCookie } from "js-cookie";
import { ajaxSetup } from "jquery";
import { DATABASE_IS_AUTH, AUTH_IS_AUTHENTICATED } from "/src/lib/constants";

export { getSession, handlePasswordChange, handleUserNameChange, isResponseOk, login_auth, login, logout }

function getSession() {
  fetch("/auth/session", {
    credentials: "same-origin",
  })
  .then((res) => res.json())
  .then((data) => {
    if (data[AUTH_IS_AUTHENTICATED]) {
      db.set(DATABASE_IS_AUTH, true);
      const newState = {...this.state};
      newState[DATABASE_IS_AUTH] = true;
      this.setState(newState);
    } else {
      db.set(DATABASE_IS_AUTH, false);
      const newState = {...this.state};
      newState[DATABASE_IS_AUTH] = false;
      this.setState(newState)
    }
  })
  .catch((err) => {
    console.log(err);
  });
}


function handlePasswordChange (event) {
  this.setState({...this.state,password: event.target.value});
}

function handleUserNameChange (event) {
  this.setState({...this.state, username: event.target.value});
}

function isResponseOk(response) {
  if (response.status >= 200 && response.status <= 299) {
    return response.json();
  } else {
    throw Error(response.statusText);
  }
}

function login_auth(username, password){
  const body = {
    username: username,
    password: password
  };


  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  })
  .then(this.isResponseOk)
  .then((data) => {
    ajaxSetup({
      headers: {
          "X-CSRFToken": getCookie("csrftoken")
      }
    });
    db.set(DATABASE_IS_AUTH, true);
    const newState = {...this.state, password: "", error: ""};
    newState[DATABASE_IS_AUTH] = true;
    this.setState(newState);
  })
  .catch((err) => {
    console.log(err);
    this.setState({error: "Wrong username or password."});
  });

}

function login(event) {
  event.preventDefault();
  const body = {
    username: this.state.username,
    password: this.state.password
  };
  fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    credentials: "same-origin",
    body: JSON.stringify(body),
  })
  .then(this.isResponseOk)
  .then((data) => {
    ajaxSetup({
      headers: {
          "X-CSRFToken": getCookie("csrftoken")
      }
    });
    console.log("login successful", this.state);
    db.set(DATABASE_IS_AUTH, true);
    const newState = {...this.state, password: "", error: ""};
    newState[DATABASE_IS_AUTH] = true;

    this.setState(newState);
  })
  .catch((err) => {
    console.log(err);
    this.setState({error: "Wrong username or password."});
  });
}

function logout () {
  fetch("/auth/logout", {
    credentials: "same-origin",
  })
  .then(this.isResponseOk)
  .then((data) => {
    db.set(DATABASE_IS_AUTH, false);
    const newState = {...this.state};
    newState[DATABASE_IS_AUTH] = false;
    this.setState(newState);
  })
  .catch((err) => {
    console.log(err);
  });
};
