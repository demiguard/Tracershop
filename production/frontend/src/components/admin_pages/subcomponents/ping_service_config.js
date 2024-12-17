import React, {useState} from "react";
import {Row, Col, FormControl} from "react-bootstrap"

import { cssCenter, cssError } from "~/lib/constants";
import { DATA_ADDRESS, DATA_DICOM_ENDPOINT, DATA_SERVER_CONFIG, WEBSOCKET_DATA } from "~/lib/shared_constants"
import { Address, DicomEndpoint, ServerConfiguration } from "../../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../../injectable/inputs/tracershop_input_group";
import { ClickableIcon } from "../../injectable/icons";
import { parseAETitleInput, parseIPInput, parsePortInput } from "../../../lib/user_input";
import { ParseJSONstr } from "../../../lib/formatting";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";

export function PingServiceConfig(props){
  const state = useTracershopState();
  const websocket = useWebsocket()

  const /**@type { ServerConfiguration} */ server_config = state.server_config.get(1);

  let /**@type {Address} */ ris_dicom_endpoint_address;
  let /**@type {DicomEndpoint} */ ris_dicom_endpoint;

  if(server_config.ris_dicom_endpoint === null){
    ris_dicom_endpoint = new DicomEndpoint(undefined, undefined, "");;
    ris_dicom_endpoint_address = new Address(undefined, "", "", "Address for ping service");
  } else {
    ris_dicom_endpoint = state.dicom_endpoint.get(server_config.ris_dicom_endpoint);
    ris_dicom_endpoint_address = state.address.get(ris_dicom_endpoint.address);
  }

  const [state_, _setState] = useState({
    address_ip : ris_dicom_endpoint_address.ip,
    address_port : ris_dicom_endpoint_address.port,
    ae_title : ris_dicom_endpoint.ae_title,
    error_ip : false,
    error_port : false,
    error_ae_title : false,
  });

  function setIP(event){
    _setState({...state_, address_ip : event.target.value, error_ip : false});
  }

  function setPort(event){
    _setState({...state_, address_port : event.target.value, error_port : false});
  }

  function setAETitle(event) {
    _setState({...state_, ae_title : event.target.value, error_ae_title : false});
  }

  function confirmServiceConfig(_event) {
    // This function is mostly defined by the fact that you don't know if the models exists
    const [validIP, _ipErrorMessage] = parseIPInput(state_.address_ip);
    const [validPort, port] = parsePortInput(state_.address_port);
    const [validAETitle, _aeTitleErrorMessage] = parseAETitleInput(state_.ae_title);

    if (!validIP || !validPort || !validAETitle){
      _setState({...state_,
        error_ip : !validIP,
        error_port : !validPort,
        error_ae_title : !validAETitle,
      });
      return;
    }

    if(ris_dicom_endpoint.id === undefined){
      // The Then chain is just creating the dependencies in the database
      // Address -> DicomEndpoint -> ServerConfig
      websocket.sendCreateModel(DATA_ADDRESS,
                                [new Address(undefined,
                                             state_.address_ip,
                                             state_.address_port,
                                             "Address for ping service")]).then(
      (message) => {
        console.log(message)
        let dicom_endpoint;
        const state = ParseJSONstr(message[WEBSOCKET_DATA])
        const models = state[DATA_ADDRESS]
        for(const model of models){
          dicom_endpoint = new DicomEndpoint(undefined,
                                             model.pk,
                                             state.ae_title);
          break;
        }
        websocket.sendCreateModel(DATA_DICOM_ENDPOINT, [dicom_endpoint]).then(
          (message) => {
            console.log(message)
            let newEndpointID;
            const state = ParseJSONstr(message[WEBSOCKET_DATA]);
            const models = state[DATA_DICOM_ENDPOINT];
            for(const model of models){
              newEndpointID = model.pk;
              break;
            }
            websocket.sendEditModel(DATA_SERVER_CONFIG, [{
              ...server_config,
              ris_dicom_endpoint : newEndpointID
            }]); // THE CHAIN IS DEAD, LONG LIVE THE SYNC CODE
        });
      })
    } else {
      websocket.sendEditModel(DATA_ADDRESS, [{
        ...ris_dicom_endpoint_address,
        ip : state_.address_ip,
        port : port
      }])
      websocket.sendEditModel(DATA_DICOM_ENDPOINT, [{
        ...ris_dicom_endpoint,
        ae_title : state_.ae_title,
      }])
    }
  }

  return (
  <Row>
    <Col style={cssCenter}>Ping service configuration</Col>
    <Col>
      <TracershopInputGroup label="IP">
        <FormControl
          style={(state_.error_ip) ? cssError : {}}
          value={state_.address_ip}
          onChange={setIP}
        />
      </TracershopInputGroup>
    </Col>
    <Col>
      <TracershopInputGroup label="Port">
        <FormControl
          style={(state_.error_port) ? cssError : {}}
          value={state_.address_port}
          onChange={setPort}
        />
      </TracershopInputGroup></Col>
    <Col>
    <TracershopInputGroup label="AE title">
        <FormControl
          style={(state_.error_ae_title) ? cssError : {}}
          value={state_.ae_title}
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
