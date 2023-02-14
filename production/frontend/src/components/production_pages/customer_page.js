import React, { Component } from "react";
import { Row, FormControl, Table, Container, Col } from "react-bootstrap"
import { renderTableRow } from "../../lib/rendering.js";
import { changeState } from "../../lib/state_management.js";
import { HistoryModal } from "../modals/history_modal.js";
import { CustomerModal } from "../modals/customer_modal.js";
import { JSON_CUSTOMER, JSON_DELIVERTIME, JSON_RUN, JSON_TRACER, PROP_WEBSOCKET } from "../../lib/constants.js";
import { ClickableIcon } from "../injectable/icons.js"

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
        activeCustomer : This.props[JSON_CUSTOMER].get(key),
      });
    }
    return retFunc
  }

  render() {
    const customers = [];
    const FilterRegEx = new RegExp(this.state.filter,'g')
    for (const [ID, customer] of this.props[JSON_CUSTOMER]) {
      if (FilterRegEx.test(customer["UserName"])) {
        customers.push(renderTableRow(ID,[
          <Container>
            <Row className="justify-content-between">
              <Col xs={3}>{customer.UserName}</Col>
              <Col xs={2}>
                <ClickableIcon src={'/static/images/setting.png'} onClick={this.ActivateModal(ID, Modals.CUSTOMER, this)}/>
                <ClickableIcon src={'/static/images/bill.png'} onClick={this.ActivateModal(ID, Modals.HISTORY, this)}/>
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
        activeCustomer={this.state.activeCustomer}
        onClose={this.closeModal.bind(this)}
        customer={this.props[JSON_CUSTOMER]}
        deliverTimes={this.props[JSON_DELIVERTIME]}
        runs={this.props[JSON_RUN]}
        tracers={this.props[JSON_TRACER]}
        websocket={this.props[PROP_WEBSOCKET]}
      /> : null}

    </Container>
    );
  }
}

