import React, { Component } from "react";
import { Row, FormControl, Table, Container, Col } from "react-bootstrap"
import { renderClickableIcon, renderTableRow } from "../../lib/Rendering";
import { changeState } from "../../lib/stateManagement";
import { HistoryModal } from "../modals/HistoryModal";
import { CustomerModal } from "../modals/CustomerModal";

export { CustomerPage }

const Modals = {
  CUSTOMER : CustomerModal,
  HISTORY  : HistoryModal,
}

export default class CustomerPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter      : "",
      Modal   : null,
      activeCustomer : null,
    }
  }

  closeModal() {
    this.setState({
      ...this.state,
      Modal : null,
      activeCustomer : null
    });
  }

  ActivateModal(key, Modal, This) {
    const retFunc = () => {
      This.setState({
        ...This.state,
        Modal : Modal,
        activeCustomer : This.props.customers.get(key),
      });
    }
    return retFunc
  }

  render() {
    const customers = [];
    const FilterRegEx = new RegExp(this.state.filter,'g')
    for (const [ID, customer] of this.props.customers) {
      if (FilterRegEx.test(customer["UserName"])) {
        customers.push(renderTableRow(ID,[
          <Container>
            <Row className="justify-content-between">
              <Col xs={3}>{customer.UserName}</Col>
              <Col xs={2}>
                {renderClickableIcon('/static/images/setting.png', this.ActivateModal(ID, Modals.CUSTOMER, this))}
                {renderClickableIcon('/static/images/bill.png', this.ActivateModal(ID, Modals.HISTORY, this))}
              </Col>

            </Row>
          </Container>
        ]));
      }
    }

    const Modal = (this.state.Modal) ? this.state.Modal : ""

    return (
    <Container>
    <Row>
      <FormControl
        onChange={changeState('filter', this).bind(this)}
        value={this.state.filter}
        placeholder="Kunde Filter"
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
    {this.state.Modal ? <Modal
        show={this.state.Modal}
        activeCustomer={this.state.activeCustomer}
        onClose={this.closeModal.bind(this)}
        customers={this.props.customers}
        deliverTimes={this.props.deliverTimes}
        runs={this.props.runs}
        tracers={this.props.tracers}
        websocket={this.props.websocket}
      /> : null}

    </Container>
    );
  }
}

