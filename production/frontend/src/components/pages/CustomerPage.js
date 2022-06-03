import React, { Component } from "react";
import { Row, FormControl, Table, Container } from "react-bootstrap"
import { CustomerModal } from "/src/components/modals/CustomerModal";

export { CustomerPage }

export default class CustomerPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter      : "",
      showModal   : false,
      userIDModal : null,
    }
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
    console.log(this.state);
    const customers = [];
    const FilterRegEx = new RegExp(this.state.filter,'g')
    for (const [ID, customer] of this.props.customer) {
      if (FilterRegEx.test(customer["UserName"])) {
        customers.push(this.renderCustomer(
          ID,
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
    { this.state.showModal ?
      <CustomerModal
        show={this.state.showModal}
        userid = {this.state.userIDModal}
        onClose = {this.closeModal.bind(this)}
        customer = {this.props.customer}
        deliverTimes = {this.props.deliverTimes}
        runs = {this.props.runs}
        websocket = {this.props.websocket}
      /> : ""
    }

    </Container>
    );
  }
}

