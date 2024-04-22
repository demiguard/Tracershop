import React, { useState } from "react";
import { LocationTable } from "./shop_injectables/location_table";
import { Container, Row } from "react-bootstrap";
import { ProcedureTable } from "./shop_injectables/procedure_table";
import { MarginButton } from "../injectable/buttons";
import { UserSetup } from "./user_setup";

const SetupTables = {
  Lokationer : LocationTable,
  Procedure : ProcedureTable,
  Bruger : UserSetup
}

export function ShopSetup ({relatedCustomer: relatedCustomerID}){
  const [SetupTableIdentifier, setSetupTableIdentifier] = useState('Lokationer')
  const buttons = [...Object.keys(SetupTables)].map(
    (key, i) => <MarginButton
                            aria-label={`setup-${key}`}
                            key={i}
                            value={key}
                            onClick={() => {setSetupTableIdentifier(key)}}
                          >{key}</MarginButton>
  )

  const SetupTable = SetupTables[SetupTableIdentifier]

  return (<Container>
    <div style={{
      marginBottom : "10px",
      display : "flex",
    }}>
      {buttons}
    </div>
    <Row>
      <SetupTable relatedCustomer={relatedCustomerID}/>
    </Row>
  </Container>);
}
