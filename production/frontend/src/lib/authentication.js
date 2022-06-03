/**
 * This file Contains the authentication methods for login, Some code is stolen shamelessly from the interwebs
 * I think it was a tutorial on login with React
 * Also you should prob think about using websocket instead of Ajax
 * 
 * Also you should prob move this code into The Authenticate component
 * 
 * Author : Christoffer Visltrup Jensen
 */

import { db } from "./localStorageDriver";
import { get as getCookie } from "js-cookie";
import { ajaxSetup } from "jquery";

export { getSession, handlePasswordChange, handleUserNameChange, isResponseOk, login_auth, login, logout }

function getSession() {
  fetch("/auth/session", {
    credentials: "same-origin",
  })
  .then((res) => res.json())
  .then((data) => {
    if (data.isAuthenticated) {
      db.set("isAuth", true);
      this.setState({isAuthenticated: true});
    } else {
      db.set("isAuth", false);
      this.setState({isAuthenticated: false});
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
    db.set("isAuth", true);
    this.setState({isAuthenticated: true, password: "", error: ""});
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
    db.set("isAuth", true);
    this.setState({isAuthenticated: true, password: "", error: ""});
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
    db.set("isAuth", false);
    this.setState({isAuthenticated: false});
  })
  .catch((err) => {
    console.log(err);
  });
};
