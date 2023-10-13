import React, { useState } from "react";
import { Row, FormControl, Table, Container, Col } from "react-bootstrap"
import { renderTableRow } from "../../../lib/rendering.js";

import { HistoryModal } from "../../modals/history_modal.js";
import { CustomerModal } from "../../modals/customer_modal.js";
import { PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE } from "../../../lib/constants.js";
import { ClickableIcon } from "../../injectable/icons.js"
import { setStateToEvent } from "~/lib/state_management.js";
import { useTracershopState } from "~/components/tracer_shop_context.js";

const Modals = {
  CUSTOMER : CustomerModal,
  HISTORY  : HistoryModal,
}

export function CustomerPage () {
  const state = useTracershopState();
  const [filter, setFilter] = useState("");
  const [modalIdentifier, setModalIdentifier] = useState("");
  const [active_customer, setActiveCustomer] = useState("");


  function closeModal() {
    setModalIdentifier("");
    setActiveCustomer("");
  }

  function ActivateModal(key, modalIdentifier) {
    const retFunc = () => {
      setModalIdentifier(modalIdentifier);
      setActiveCustomer(key);
    }
    return retFunc;
  }

  const /**@type {Array<Element>} */ customerRows = [];
  const FilterRegEx = new RegExp(filter,'g')
  for (const customer of state.customer.values()) {
    if (FilterRegEx.test(customer.short_name)) {
      customerRows.push(renderTableRow(customer.id,[
        <Container>
          <Row className="justify-content-between">
            <Col xs={3}>{customer.short_name}</Col>
            <Col xs={2} style={{
              display : "flex"
            }}>
              <ClickableIcon
                label={`settings-${customer.id}`}
                src={'/static/images/setting.png'}
                onClick={ActivateModal(customer.id, "CUSTOMER")}
              />
            </Col>
          </Row>
        </Container>
      ]));
    }
  }

  const Modal = (modalIdentifier !== "") ? Modals[modalIdentifier] : ""
  const modalProps = {
    [PROP_ACTIVE_CUSTOMER] : active_customer,
    [PROP_ON_CLOSE] : closeModal,
  };

  return (
    <Container>
      <Row>
        <FormControl
          aria-label="customer-filter"
          onChange={setStateToEvent(setFilter)}
          value={filter}
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
        {Modal !== "" ? <Modal {...modalProps}/> : "" }
    </Container>);
}
