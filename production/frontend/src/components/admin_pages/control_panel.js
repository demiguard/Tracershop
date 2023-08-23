import React, { useState } from "react";
import { Accordion, Container, FormControl, FormGroup, InputGroup, Row } from "react-bootstrap";
import { JSON_ADDRESS, JSON_DATABASE, JSON_DICOM_ENDPOINT, JSON_SERVER_CONFIG, PROP_WEBSOCKET } from "../../lib/constants";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { FieldFrame, FIELDS } from "../injectable/database/field";
import { Model } from "../injectable/database/model";
import { ModelTable } from "../injectable/database/model_table";
import { Address, DicomEndpoint } from "../../dataclasses/dataclasses";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";
import { PingServiceConfig } from "./subcomponents.js/ping_service_config";

export { ControlPanel }

const Models = [JSON_ADDRESS,JSON_DATABASE, JSON_SERVER_CONFIG];

const ModelTypes = {
  SingleModel : "SingleModel",
  MultipleModel:  "ManyModels",
}


function ControlPanel(props){
  console.log(props)

  return (
    <Container>
      <PingServiceConfig
        {...props}
      />

    </Container>)
}