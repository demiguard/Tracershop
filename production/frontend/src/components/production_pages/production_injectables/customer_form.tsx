import React from 'react';
import { Col, Row, Form } from "react-bootstrap";
import { CommitIcon } from '~/components/injectable/commit_icon';
import { TracershopInputGroup } from '~/components/injectable/inputs/tracershop_input_group';
import { Optional } from "~/components/injectable/optional";
import { useErrorState } from '~/lib/error_handling';
import { nullParser } from "~/lib/formatting";
import { DATA_CUSTOMER } from '~/lib/shared_constants';
import { setTempObjectToEvent } from "~/lib/state_management";
import { parseWholePositiveNumber } from "~/lib/user_input";

export function CustomerForm({
  customerDirty, tempCustomerState
}){

  const [dispenserError, setDispenserError] = useErrorState();
  const [tempCustomer, setTempCustomer] = tempCustomerState;

  /**
   * Function called in response to the user clicking accept key on customers
    *
    * Should update the customer
    */
  function validateCustomer(){
    let dispenser = null;
    if(tempCustomer.dispenser_id) {
      const [validDispenser, n_dispenser] = parseWholePositiveNumber(tempCustomer.dispenser_id, 'Dispenser ID');

      if(!validDispenser){
        setDispenserError(n_dispenser);
        return [false,{}];
      }
      dispenser = n_dispenser;
    }
    setDispenserError("");

    return [true, {...tempCustomer, dispenser_id : dispenser}];
  }

  return (
    <Col>
      <Row>
        <Col><h4>Kunde</h4></Col>
          <Optional exists={customerDirty}>
            <Col style={{ justifyContent : "right", display: "flex"}}>
              <CommitIcon
                aria-label="customer-commit"
                temp_object={tempCustomer}
                object_type={DATA_CUSTOMER}
                validate={validateCustomer}
              />
            </Col>
          </Optional>
          </Row>
          <TracershopInputGroup label="Intern navn">
            <Form.Control
              aria-label="short-name-input"
              value={nullParser(tempCustomer.short_name)}
              onChange={setTempObjectToEvent(setTempCustomer, 'short_name')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kunde navn">
            <Form.Control
              aria-label="long-name-input"
              value={nullParser(tempCustomer.long_name)}
              onChange={setTempObjectToEvent(setTempCustomer, 'long_name')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kunde addresse">
            <Form.Control
              aria-label="address-input"
              value={nullParser(tempCustomer.billing_address)}
              onChange={setTempObjectToEvent(setTempCustomer,'billing_address')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kunde by">
            <Form.Control
              aria-label="city-input"
              value={nullParser(tempCustomer.billing_city)}
              onChange={setTempObjectToEvent(setTempCustomer,'billing_city')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kunde post nummer">
            <Form.Control
              aria-label="zip-input"
              value={nullParser(tempCustomer.billing_zip_code)}
              onChange={setTempObjectToEvent(setTempCustomer, 'billing_zip_code')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Kunde Email">
            <Form.Control
              aria-label="email-input"
              value={nullParser(tempCustomer.billing_email)}
              onChange={setTempObjectToEvent(setTempCustomer,'billing_email')}
            />
          </TracershopInputGroup>
          <TracershopInputGroup label="Dispenser ID" error={dispenserError}>
            <Form.Control
              aria-label="dispenser-input"
              value={nullParser(tempCustomer.dispenser_id)}
              onChange={setTempObjectToEvent(setTempCustomer,'dispenser_id')}
            />
          </TracershopInputGroup>
        </Col>
  )
}