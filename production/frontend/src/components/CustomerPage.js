import React, { Component } from "react";
import { Row, FormControl, Table, Container } from "react-bootstrap"
import { ajax } from "jquery"
import { node } from "prop-types";
import { CustomerModal } from "./CustomerModal";

export { CustomerPage }

export default class CustomerPage extends Component {
  constructor(props) {
    super(props);
    

    this.state = {
      Customers : [],
      filteredCustomers : [],
      showModal : false,
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
          const IDs = Object.keys(res)
          for(let i = 0; i<IDs.length; i++) {
              CustomerList.push({
              id : IDs[i],
              username : res[IDs[i]]
            })
          }
          const NewState = {
            ...this.state,
            Customers : CustomerList,
            filteredCustomers : CustomerList
          }
          this.setState(NewState)
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
    const FilterRegEx = new RegExp(Filter, "g")
    const newFilterList = [];
    for(let i = 0; i < this.state.Customers.length; i++) {
      const customer = this.state.Customers[i];
      if (FilterRegEx.test(customer["username"])) {
        newFilterList.push(customer);
      }
    }

    const NewState = {
      ...this.state,
      filteredCustomers : newFilterList
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


  saveModal(modalState) {
    const newState = {
      ...this.state,
      showModal : false,
      userIDModal : null
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
    var customers = [];
    for (let i = 0; i < this.state.filteredCustomers.length; i++) {
      const customer = this.state.filteredCustomers[i];
      customers.push(this.renderCustomer(
        customer["id"],
        customer["username"]
      ));
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
      saveModal = {this.saveModal.bind(this)}
      />
    
    </Container>
    );
  } 
}

