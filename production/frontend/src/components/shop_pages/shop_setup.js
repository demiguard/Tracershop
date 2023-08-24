import React, { useState } from "react";
import { LocationTable } from "./shop_injectables/location_table";
import { Button, Container, Row } from "react-bootstrap";
import { ProcedureTable } from "./shop_injectables/procedure_table";
import { MarginButton } from "../injectable/buttons";
import { Select } from "../injectable/select";
import { JSON_ENDPOINT, PROP_ACTIVE_ENDPOINT } from "../../lib/constants";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";

const SetupTables = {
  Lokationer : LocationTable,
  Procedure : ProcedureTable
}

export function ShopSetup (props){
  const endpointOptions = [...props[JSON_ENDPOINT].values()].map((endpoint) => {
    return {
      id : endpoint.id,
      name : endpoint.name,
    };
  })

  const [SetupTableIdentifier, setSetupTableIdentifier] = useState('Lokationer')
  const [activeEndpoint, _setActiveEndpoint] = useState(endpointOptions[0].id)

  function setActiveEndpoint(event) {
    _setActiveEndpoint(event.target.value)
  }

  const buttons = [...Object.keys(SetupTables)].map(
    (key, i) => <MarginButton
                            aria-label={`setup-${key}`}
                            key={i}
                            value={key}
                            onClick={() => {setSetupTableIdentifier(key)}}
                          >{key}</MarginButton>
  )

  const SetupTable = SetupTables[SetupTableIdentifier]
  const setupTableProps = {...props};
  setupTableProps[PROP_ACTIVE_ENDPOINT] = activeEndpoint;

  //  TODO: No idea why i'm not using Endpoint select?
  return (<Container>
    <div style={{
      display : "flex",
    }}>
      {buttons}
      <TracershopInputGroup label="Levering sted:">
        <Select
          aria-label="endpoint-select"
          style={{ width : "100px",}}
          options={endpointOptions}
          valueKey="id"
          nameKey="name"
          value={activeEndpoint}
          onChange={setActiveEndpoint}
        />
      </TracershopInputGroup>
    </div>
    <Row><SetupTable {...setupTableProps} /></Row>
  </Container>);
}
