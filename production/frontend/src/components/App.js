import React, { Component } from "react";
import {Button, Container} from "react-bootstrap";

import { Navbar } from "./Navbar.js";
import { ConfigPage } from "./ConfigPage.js";
import { OrderPage } from './OrderPage.js';
import { CustomerPage } from "./CustomerPage.js";
import { EmailSetupPage } from "./EmailSetupPage.js";
import ServerConfigPage, { ServerConfig } from "./ServerConfig.js";

import { ajaxSetup } from "jquery";
import { get as getCookie } from 'js-cookie';
import CloseDaysPage from "./CloseDaysPage";
import { VialPage } from "./VialPage.js";

export {App}

const Pages = {
  Ordre : OrderPage,
  Kunder : CustomerPage,
  Tracers : ConfigPage,
  Email : EmailSetupPage,
  Lukkedage : CloseDaysPage,
  Vial : VialPage,
  Indstillinger : ServerConfigPage,
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage : OrderPage,
      isAuthenticated : false,
      username : "",
      password : "",
      error : "",
    };
    this.setActivePage = this.setActivePage.bind(this); 
    ajaxSetup({
      headers: {
          "X-CSRFToken": getCookie("csrftoken")
      }
    });
  }

  componentDidMount() {
    this.getSession();
  }

  getSession() {
    fetch("/auth/session", {
      credentials: "same-origin",
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.isAuthenticated) {
        this.setState({isAuthenticated: true});
      } else {
        this.setState({isAuthenticated: false});
      }
    })
    .catch((err) => {
      console.log(err);
    });
  }

  handlePasswordChange = (event) => {
    this.setState({password: event.target.value});
  }

  handleUserNameChange = (event) => {
    this.setState({username: event.target.value});
  }

  isResponseOk(response) {
    if (response.status >= 200 && response.status <= 299) {
      return response.json();
    } else {
      throw Error(response.statusText);
    }
  }

  login(event) {
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
      this.setState({isAuthenticated: true, password: "", error: ""});
    })
    .catch((err) => {
      console.log(err);
      this.setState({error: "Wrong username or password."});
    });
  }

  logout = () => {
    fetch("/auth/logout", {
      credentials: "same-origin",
    })
    .then(this.isResponseOk)
    .then((data) => {
      this.setState({isAuthenticated: false});
    })
    .catch((err) => {
      console.log(err);
    });
  };
 

  renderActivePage() {
    return <this.state.activePage username={this.state.username}/>;
  }

  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, activePage : NewPage};
    this.setState(NewState);
  }

  render() {
    if (this.state.isAuthenticated){ // User is logged in      
      return (
        <div>
        <Navbar Names={Object.keys(Pages)} setActivePage={this.setActivePage} username={this.state.username} logout={this.logout}/>    
        <Container className="navBarSpacer">
            {this.renderActivePage()}
        </Container>
      </div> 
    );
    } else {
      return (
        <div>
          <Navbar Names={[]} setActivePage={() => {}} username={this.state.username} logout={this.logout}/>
          <Container className="navBarSpacer">
            <h1>Tracershop Produktion</h1>
            <br/>
            <h2>Login</h2>
            <form onSubmit={this.login.bind(this)}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" className="form-control" id="username" name="username" value={this.state.username} onChange={this.handleUserNameChange} />
            </div>
            <div className="form-group">
              <label htmlFor="username">Password</label>
              <input type="password" className="form-control" id="password" name="password" value={this.state.password} onChange={this.handlePasswordChange} />
              <div>
                {this.state.error &&
                  <small className="text-danger">
                    {this.state.error}
                  </small>
                }
              </div>
            </div>
            <Button type="submit" className="btn btn-primary">Login</Button>

            </form>
            </Container>
        </div>
      )
    }
  }
}


