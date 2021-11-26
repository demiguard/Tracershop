import React, { Component } from "react";
import {Container} from "react-bootstrap";

import { Navbar } from "./Navbar.js";
import { ConfigPage } from "./ConfigPage.js";
import { OrderPage } from './OrderPage.js';
import { CustomerPage } from "./CustomerPage.js";
import { EmailSetupPage } from "./EmailSetupPage.js";

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
  Vial : VialPage
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage : OrderPage
    };
    this.setActivePage = this.setActivePage.bind(this);
    ajaxSetup({
      headers: {
          "X-CSRFToken": getCookie("csrftoken")
      }
    });
  }


  renderActivePage() {
    return <this.state.activePage/>;
  }


  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, activePage : NewPage};
    this.setState(NewState);
  }


  render() {
    return (
      <div>
        <Navbar Names={Object.keys(Pages)} setActivePage={this.setActivePage}/>    
        <Container className="navBarSpacer">
            {this.renderActivePage()}
        </Container>
      </div> 
    );
  }
}


