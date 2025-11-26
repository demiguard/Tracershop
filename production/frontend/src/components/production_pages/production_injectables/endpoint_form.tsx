import React, { useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { CommitIcon } from "~/components/injectable/commit_icon";
import { EndpointSelect } from "~/components/injectable/derived_injectables/endpoint_select";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { Optional } from "~/components/injectable/optional";

import { nullParser, ParseDjangoModelJson } from "~/lib/formatting";
import { DATA_ENDPOINT, WEBSOCKET_DATA } from "~/lib/shared_constants";
import { setTempObjectToEvent } from "~/lib/state_management";
import { parseStringInput } from "~/lib/user_input";
import { nullify } from "~/lib/utils";


export function EndpointForm({
  active_customer,
  endpointDirty,
  endpoints,
  endpointReferenceError,
  tempEndpointState,
  setActiveEndpoint
}){
  const [tempEndpoint, setTempEndpoint] = tempEndpointState;

  const [endpointError, setEndpointError] = useState({
      name : "",
      address : "",
      city : "",
      phone : "",
      zip_code : "",
  });

  function validateEndpoint(){
    const [validName, name] = parseStringInput(tempEndpoint.name, 'Navnet', 32, false);
    const [validAddress, address] = parseStringInput(tempEndpoint.address, 'Addressen', 128);
    const [validCity, city] = parseStringInput(tempEndpoint.city, 'Byen', 128);
    const [validZipCode, zipCode] = parseStringInput(tempEndpoint.zip_code, 'Post koden', 32);
    const [validPhone, phone] = parseStringInput(tempEndpoint.phone, 'Telefon nummeret', 32);

    const newError = {
      name : "",
      address : "",
      city : "",
      phone : "",
      zip_code : "",
    };

    if(!validName){
      newError.name = name;
    }
    if(!validAddress){
      newError.address = address;
    }
    if(!validCity){
      newError.city = city;
    }
    if(!validZipCode){
      newError.zip_code = zipCode;
    }
    if(!validPhone){
      newError.phone = phone;
    }
    setEndpointError(newError);

    if (!validName || !validAddress || !validCity || !validZipCode || !validPhone ){
      return [false,{}];
    }

    return [true, {...tempEndpoint,
      name : name,
      address : nullify(address),
      city : nullify(city),
      phone : nullify(phone),
      zip_code : nullify(zipCode),
      owner : active_customer
    }];
  }

  function commit_callback(response){
    if(tempEndpoint.id === -1){
      const map = ParseDjangoModelJson(response[WEBSOCKET_DATA][DATA_ENDPOINT], new Map(), DATA_ENDPOINT);
        for(const endpointID of map.keys()){
          // it's only one iteration long
          setActiveEndpoint(endpointID);
          break;
      }
    }
  }

  return (
    <Col aria-label={`active-endpoint-${tempEndpoint.id}`}>
      <Row>
        <Col><h4>Leveringssted</h4></Col>
        <Col style={{display: "flex", justifyContent: "right"}}>
          <Optional exists={endpointDirty}>
            <CommitIcon
              temp_object={tempEndpoint}
              validate={validateEndpoint}
              callback={commit_callback}
              object_type={DATA_ENDPOINT}
              aria-label="commit-endpoint"
            />
          </Optional>
        </Col>
      </Row>
      <TracershopInputGroup label="Leveringssteder" error={endpointReferenceError}>
        <EndpointSelect
          aria-label="endpoint-select"
          delivery_endpoint={endpoints}
          onChange={(event) => setActiveEndpoint(event.target.value)}
          value={tempEndpoint.id}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Intern Navn" error={endpointError.name}>
        <Form.Control
          aria-label="endpoint-name"
          value={nullParser(tempEndpoint.name)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'name')}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Leverings addresse" error={endpointError.address}>
        <Form.Control
          aria-label="endpoint-address"
          value={nullParser(tempEndpoint.address)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'address')}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Leverings by" error={endpointError.city}>
        <Form.Control
          aria-label="endpoint-city"
          value={nullParser(tempEndpoint.city)}
          onChange={setTempObjectToEvent(setTempEndpoint, 'city')}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Leverings postnummer" error={endpointError.zip_code}>
        <Form.Control
          aria-label="endpoint-zip-code"
          value={nullParser(tempEndpoint.zip_code)}
          onChange={setTempObjectToEvent(setTempEndpoint,'zip_code')}
        />
      </TracershopInputGroup>
      <TracershopInputGroup label="Leverings telefon nummer" error={endpointError.phone}>
        <Form.Control
          aria-label="endpoint-phone"
          value={nullParser(tempEndpoint.phone)}
          onChange={setTempObjectToEvent(setTempEndpoint,'phone')}
        />
      </TracershopInputGroup>
    </Col>
  );
}
