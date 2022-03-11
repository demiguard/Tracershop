import React, { Component } from "react";
import { Row, FormControl, Table, Container } from "react-bootstrap"
import { ajax } from "jquery";
import { CustomerModal } from "./CustomerModal";
import { JSON_CUSTOMERS } from "./lib/constants"
import { ParseJSONstr } from "./lib/formatting";


export { CustomerPage }

export default class CustomerPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      Customers   : [],
      filter      : "",
      showModal   : false,
      userIDModal : null,
    }

  ajax({
      url:"/api/getCustomers",
      type:"get",
      datatype:"json",
      success: function (res) {
        return res   
      }}).then(
        (res) => {
          const CustomerList = []
          for (const CustomerString of res[JSON_CUSTOMERS]){
            CustomerList.push(ParseJSONstr(CustomerString));
          }
          const NewState = {
            ...this.state,
            Customers : CustomerList
          }
          this.setState(NewState);
        });
  }

  closeModal() {
    const newState = {
      ...this.state,
      showModal : false,
      userIDModal : null
    }
    this.setState(newState)
  }

  OnchangeFilter(event) {
    const Filter = event.target.value;
    
    const NewState = {
      ...this.state,
      filter : Filter
    };
    this.setState(NewState);
  }

  ActivateModal(key) {
    const newState = {
          ...this.state,
          showModal : true,
          userIDModal : key
    }
    this.setState(newState);
  }

  renderCustomer (ID, username) {
    return (
      <tr key={ID} onClick={() => this.ActivateModal(ID)} >
        <td> {username}</td>
      </tr>
    )
  }

  render() {
    const customers = [];
    const FilterRegEx = new RegExp(this.state.filter,'g')
    for (const customer of this.state.Customers) {
      if (FilterRegEx.test(customer["UserName"])) {
        customers.push(this.renderCustomer(
          customer["ID"],
          customer["UserName"]
          ));
      }
    }

    return (
    <Container>
    <Row>
      <FormControl 
        onChange={this.OnchangeFilter.bind(this)} 
        placeholder="Filter"
        />
    </Row>
    <Table>
      <thead>
        <tr>
          <th>Kunde navn</th>
        </tr>
      </thead>
      <tbody>
        {customers}
      </tbody>
    </Table>
    <CustomerModal
      show={this.state.showModal}
      userid = {this.state.userIDModal}
      onClose = {this.closeModal.bind(this)}
      />
    
    </Container>
    );
  } 
}

