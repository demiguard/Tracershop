import React, { useState } from "react";
import { Row, FormControl, Table, Container, Col, InputGroup } from "react-bootstrap"

import { CustomerModal } from "../../modals/customer_modal";
import { PROP_ACTIVE_CUSTOMER, PROP_ON_CLOSE } from "../../../lib/constants";
import { ClickableIcon, IdempotentIcon } from "../../injectable/icons"
import { setStateToEvent } from "~/lib/state_management";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { DATA_CUSTOMER, DATA_ENDPOINT } from "~/lib/shared_constants";
import { MESSAGE_UPDATE_STATE } from "~/lib/incoming_messages";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Customer } from "~/dataclasses/dataclasses";
import { Optional } from "~/components/injectable/optional";

const Modals = {
  CUSTOMER : CustomerModal,
}

function CustomerRow({customer, activateModal}){
  return (
  <tr>
    <td>
      <Container>
        <Row className="justify-content-between">
          <Col xs={3}>{customer.short_name}</Col>
          <Col xs={2} style={{
            display : "flex"
          }}>
            <ClickableIcon
              aria-label={`settings-${customer.id}`}
              src={'/static/images/setting.png'}
              onClick={activateModal(customer.id, "CUSTOMER")}
            />
          </Col>
        </Row>
      </Container>
    </td>
  </tr>);
}

export function CustomerPage () {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const [filter, setFilter] = useState("");
  const [modalIdentifier, setModalIdentifier] = useState("");
  const [active_customer, setActiveCustomer] = useState("");

  function closeModal() {
    setModalIdentifier("");
    setActiveCustomer("");
  }

  function activateModal(key, modalIdentifier) {
    const retFunc = () => {
      setModalIdentifier(modalIdentifier);
      setActiveCustomer(key);
    }
    return retFunc;
  }

  function createCustomer(){
    let customerID;

    return websocket.sendCreateModel(DATA_CUSTOMER, {
      id : -1,
      short_name : filter
    }).then((response_message) => {
      if(response_message instanceof MESSAGE_UPDATE_STATE){
        const /**@type {Customer} */ new_customer = response_message.data[DATA_CUSTOMER][0]
        customerID = new_customer.id

        return websocket.sendCreateModel(DATA_ENDPOINT, {
          id : -1,
          name : filter,
          owner : customerID,
        });
      }
    }).then(
      () => {
        activateModal(customerID, "CUSTOMER");
        return Promise.resolve();
      }
    )
  }

  const /**@type {Array<Element>} */ customerRows = [];
  const FilterRegEx = new RegExp(filter,'g')
  for (const customer of state.customer.values()) {
    if (FilterRegEx.test(customer.short_name)) {
      customerRows.push(<CustomerRow key={customer.id} customer={customer} activateModal={activateModal}/>);
    }
  }

  const Modal = (modalIdentifier !== "") ? Modals[modalIdentifier] : ""
  const modalProps = {
    [PROP_ACTIVE_CUSTOMER] : active_customer,
    [PROP_ON_CLOSE] : closeModal,
  };

  const displayCreateButton = filter.length > 1 &&
    !([...state.customer.values()].map((c) => c.short_name).includes(filter));

  return (
    <Container>
      <Row>
        <TracershopInputGroup>
          <FormControl
            aria-label="customer-filter"
            onChange={setStateToEvent(setFilter)}
            value={filter}
            placeholder="Kunde Filter"
          />
          <Optional exists={displayCreateButton}>
            <InputGroup.Text>
              <IdempotentIcon
                altText="Opret Kunde"
                src="/static/images/plus2.svg"
                onClick={createCustomer}
              />
            </InputGroup.Text>
          </Optional>
        </TracershopInputGroup>
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
