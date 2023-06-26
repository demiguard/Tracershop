import React, { Component } from "react";
import { Row, FormControl, Table, Container, Col } from "react-bootstrap"
import { renderTableRow } from "../../lib/rendering.js";
import { changeState } from "../../lib/state_management.js";
import { HistoryModal } from "../modals/history_modal.js";
import { CustomerModal } from "../modals/customer_modal.js";
import { JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_RUN, JSON_TRACER, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_WEBSOCKET } from "../../lib/constants.js";
import { ClickableIcon } from "../injectable/icons.js"
import { Customer } from "../../dataclasses/dataclasses.js";

export { CustomerPage }

const Modals = {
  CUSTOMER : CustomerModal,
  HISTORY  : HistoryModal,
}

export default class CustomerPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter : "",
      Modal : null,
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
        activeCustomer : key,
      });
    }
    return retFunc
  }

  render() {
    const /**@type {Array<Element>} */ customerRows = [];
    const FilterRegEx = new RegExp(this.state.filter,'g')
    for (const [ID, _customer] of this.props[JSON_CUSTOMER]) {
      const /**@type {Customer} */ customer = _customer
      if (FilterRegEx.test(customer.short_name)) {
        customerRows.push(renderTableRow(ID,[
          <Container>
            <Row className="justify-content-between">
              <Col xs={3}>{customer.short_name}</Col>
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

    const modelProps = {...this.props};
    modelProps[PROP_ACTIVE_CUSTOMER] = this.state.activeCustomer;
    modelProps[PROP_ON_CLOSE] = this.closeModal.bind(this);

    return (
    <Container>
      <Row>
        <FormControl
          onChange={changeState('filter', this).bind(this)}
          value={this.state.filter}
          placeholder="Kunde Filter"
        />
      </Row>
      <Row>
        <Table>
          <thead>
            <tr>
              <th>Kunde navn</th>
            </tr>
          </thead>
          <tbody>
            {customerRows}
          </tbody>
        </Table>
      </Row>
      {this.state.Modal ? <Modal {...modelProps} /> : null}
      </Container>
    );
  }
}

