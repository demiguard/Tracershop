import React, { Component, useState } from "react";
import { Row, FormControl, Table, Container, Col } from "react-bootstrap"
import { renderTableRow } from "../../lib/rendering.js";
import { changeState } from "../../lib/state_management.js";
import { HistoryModal } from "../modals/history_modal.js";
import { CustomerModal } from "../modals/customer_modal.js";
import { JSON_CUSTOMER, JSON_DELIVER_TIME, JSON_RUN, JSON_TRACER, PROP_ACTIVE_CUSTOMER, PROP_ACTIVE_DATE, PROP_ON_CLOSE, PROP_WEBSOCKET } from "../../lib/constants.js";
import { ClickableIcon } from "../injectable/icons.js"
import { Customer } from "../../dataclasses/dataclasses.js";

const Modals = {
  CUSTOMER : CustomerModal,
  HISTORY  : HistoryModal,
}

export function CustomerPage (props) {
  const [state, _setState] = useState({
    filter : "",
    Modal : null,
    activeCustomer : null,
  })

  function setState(newState){
    _setState({...state, ...newState})
  }


  function closeModal() {
    setState({
      Modal : null,
      activeCustomer : null
    });
  }

  function ActivateModal(key, Modal) {
    const retFunc = () => {
      setState({
        Modal : Modal,
        activeCustomer : key,
      });
    }
    return retFunc
  }

  const /**@type {Array<Element>} */ customerRows = [];
  const FilterRegEx = new RegExp(state.filter,'g')
    for (const [ID, _customer] of props[JSON_CUSTOMER]) {
      const /**@type {Customer} */ customer = _customer
      if (FilterRegEx.test(customer.short_name)) {
        customerRows.push(renderTableRow(ID,[
          <Container>
            <Row className="justify-content-between">
              <Col xs={3}>{customer.short_name}</Col>
              <Col xs={2} style={{
                display : "flex"
              }}>
                <ClickableIcon src={'/static/images/setting.png'} onClick={ActivateModal(ID, Modals.CUSTOMER)}/>
                <ClickableIcon src={'/static/images/bill.png'} onClick={ActivateModal(ID, Modals.HISTORY)}/>
              </Col>
            </Row>
          </Container>
        ]));
      }
    }

    const Modal = (state.Modal) ? state.Modal : ""

    const modelProps = {...props};
    modelProps[PROP_ACTIVE_CUSTOMER] = state.activeCustomer;
    modelProps[PROP_ON_CLOSE] = closeModal;

    return (
    <Container>
      <Row>
        <FormControl
          onChange={(event) => {setState({filter : event.target.value})}}
          value={state.filter}
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
        {state.Modal ? <Modal {...modelProps} /> : null}
    </Container>);
}

