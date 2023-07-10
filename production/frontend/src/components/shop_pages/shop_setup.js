import React, { useState } from "react";
import { LocationTable } from "./shop_injectables/location_table";
import { Button, Container, Row } from "react-bootstrap";
import { ProcedureTable } from "./shop_injectables/procedure_table";


const SetupTables = {
  Lokationer : LocationTable,
  Procedure : ProcedureTable
}

export function ShopSetup (props){
  const [SetupTableIdentifier, setSetupTableIdentifier] =  useState('Lokationer')

  const buttons = [...Object.keys(SetupTables)].map(
    (key, i) => <Button
                            key={i}
                            value={key} onClick={() => {setSetupTableIdentifier(key)}}>{key}</Button>
  )

  const SetupTable = SetupTables[SetupTableIdentifier]


  return (<Container>
    <div>{buttons}</div>
    <Row><SetupTable {...props} /></Row>
  </Container>);
}
