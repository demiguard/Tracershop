import React, { useState } from "react";
import { LocationTable } from "./shop_injectables/location_table";
import { Button, Container, Row } from "react-bootstrap";
import { ProcedureTable } from "./shop_injectables/procedure_table";
import { MarginButton } from "../injectable/buttons";
import { Select } from "../injectable/select";
import { JSON_ENDPOINT } from "../../lib/constants";
import { TracershopInputGroup } from "../injectable/tracershop_input_group";


const SetupTables = {
  Lokationer : LocationTable,
  Procedure : ProcedureTable
}

export function ShopSetup (props){
  const [SetupTableIdentifier, setSetupTableIdentifier] =  useState('Lokationer')

  const buttons = [...Object.keys(SetupTables)].map(
    (key, i) => <MarginButton
                            key={i}
                            value={key} 
                            onClick={() => {setSetupTableIdentifier(key)}}
                          >{key}</MarginButton>
  )

  const SetupTable = SetupTables[SetupTableIdentifier]

  const endpointOptions = [...props[JSON_ENDPOINT].values()].map((endpoint) => {

    return {
      id : endpoint.id,
      name : endpoint.name,
    }
  })

  const setupTableProps = {...props}
  

  return (<Container>
    <div style={{
      display : "flex",
    }}>
      {buttons}
      <TracershopInputGroup label="Kunde:">
        <Select
          style={{
            width : "100px",
          }}
          options={endpointOptions}
          valueKey="id"
          nameKey="name"
        />
      </TracershopInputGroup>
    </div>
    <Row><SetupTable {...props} /></Row>
  </Container>);
}
