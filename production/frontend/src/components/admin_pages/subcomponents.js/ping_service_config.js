import React, {useState} from "react";
import {Row, Col, FormControl} from "react-bootstrap"

import { JSON_ADDRESS, JSON_DICOM_ENDPOINT, JSON_SERVER_CONFIG, PROP_WEBSOCKET, WEBSOCKET_DATA, cssCenter, cssError } from "../../../lib/constants";
import { Address, DicomEndpoint, ServerConfiguration } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/tracershop_input_group";
import { ClickableIcon } from "../../injectable/icons";
import { parseAETitleInput, parseIPInput, parsePortInput } from "../../../lib/user_input";
import { TracerWebSocket } from "../../../lib/tracer_websocket";

export function PingServiceConfig(props){
  const /**@type { ServerConfiguration} */ server_config = props[JSON_SERVER_CONFIG].get(1);

  let /**@type {Address} */ ris_dicom_endpoint_address;
  let /**@type {DicomEndpoint} */ ris_dicom_endpoint;

  if(server_config.ris_dicom_endpoint === null){
    ris_dicom_endpoint = new DicomEndpoint(undefined, undefined, "");
    ris_dicom_endpoint_address = new Address(undefined, "", "", "Address for ping service")
  } else {
    ris_dicom_endpoint = props[JSON_DICOM_ENDPOINT].get(server_config.ris_dicom_endpoint)
    ris_dicom_endpoint_address = props[JSON_ADDRESS].get(ris_dicom_endpoint.address)
  }

  const [state, _setState] = useState({
    address_ip : ris_dicom_endpoint_address.ip,
    address_port : ris_dicom_endpoint_address.port,
    ae_title : ris_dicom_endpoint.ae_title,
    error_ip : false,
    error_port : false,
    error_ae_title : false,
  });

  function setIP(event){
    _setState({...state, address_ip : event.target.value, error_ip : false});
  }

  function setPort(event){
    _setState({...state, address_port : event.target.value, error_port : false});
  }

  function setAETitle(event) {
    _setState({...state, ae_title : event.target.value, error_ae_title : false});
  }

  function confirmServiceConfig(_event) {
    // This function is mostly defined by the fact that you don't know if the models exists
    const [validIP, _ipErrorMessage] = parseIPInput(state.address_ip);
    const [validPort, port] = parsePortInput(state.address_port);
    const [validAETitle, _aeTitleErrorMessage] = parseAETitleInput(state.ae_title);

    if (!validIP || !validPort || !validAETitle){
      _setState({...state,
        error_ip : !validIP,
        error_port : !validPort,
        error_ae_title : !validAETitle,
      });
      return;
    }

    const /**@type {TracerWebSocket} */ websocket = props[PROP_WEBSOCKET]
    if(ris_dicom_endpoint.id === undefined){
      // The Then chain is just creating the dependencies in the database
      // Address -> DicomEndpoint -> ServerConfig
      websocket.sendCreateModel(JSON_ADDRESS,
                                [new Address(undefined,
                                             state.address_ip,
                                             state.address_port,
                                             "Address for ping service")]).then(
      (message) => {
        let dicom_endpoint;
        const state = ParseJSONstr(message[WEBSOCKET_DATA])
        const models = state[JSON_ADDRESS]
        for(const model of models){
          let dicom_endpoint = new DicomEndpoint(undefined,
                                                 model.pk,
                                                 state.ae_title);
          break;
        }
        websocket.sendCreateModel(JSON_DICOM_ENDPOINT, [dicom_endpoint]).then(
          (message) => {
            let newEndpointID;
            const state = ParseJSONstr(message[WEBSOCKET_DATA]);
            const models = state[JSON_DICOM_ENDPOINT];
            for(const model of models){
              newEndpointID = model.pk;
              break;
            }
            websocket.sendEditModel(JSON_SERVER_CONFIG, [{
              ...server_config,
              ris_dicom_endpoint : newEndpointID
            }]); // THE CHAIN IS DEAD, LONG LIVE THE SYNC CODE
        });
      })
    } else {
      websocket.sendEditModel(JSON_ADDRESS, [{
        ...ris_dicom_endpoint_address,
        ip : state.address_ip,
        port : port
      }])
      websocket.sendEditModel(JSON_DICOM_ENDPOINT, [{
        ...ris_dicom_endpoint,
        ae_title : state.ae_title,
      }])
    }

  }

  console.log(state)

  return (
  <Row>
    <Col style={cssCenter}>Ping service configuration</Col>
    <Col>
      <TracershopInputGroup label="IP">
        <FormControl
          style={(state.error_ip) ? cssError : {}}
          value={state.address_ip}
          onChange={setIP}
        />
      </TracershopInputGroup>
    </Col>
    <Col>
      <TracershopInputGroup label="Port">
        <FormControl
          style={(state.error_port) ? cssError : {}}
          value={state.address_port}
          onChange={setPort}
        />
      </TracershopInputGroup></Col>
    <Col>
    <TracershopInputGroup label="AE title">
        <FormControl
          style={(state.error_ae_title) ? cssError : {}}
          value={state.ae_title}
          onChange={setAETitle}
        />
      </TracershopInputGroup>
    </Col>
    <Col style={cssCenter}>
      <ClickableIcon
        src="/static/images/accept.svg"
        onClick={confirmServiceConfig}
      />
    </Col>
  </Row>);
}