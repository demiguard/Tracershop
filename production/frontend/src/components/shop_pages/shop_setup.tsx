import React, { useEffect, useState } from "react";
import { LocationTable } from "./shop_injectables/location_table";
import { Container, Row } from "react-bootstrap";
import { ProcedureTable } from "./shop_injectables/procedure_table";
import { MarginButton } from "../injectable/buttons";
import { UserSetup } from "./user_setup";
import { StandardOrderSetup } from "~/components/shop_pages/standard_order_setup";
import { NavigationContainer } from "~/lib/types";

export const SHOP_CONFIG_SITES: NavigationContainer = {
  Lokationer : {component : LocationTable, name : "Lokationer" },
  Procedure :  {component : ProcedureTable, name : "Procedure" },
  Bruger :     {component : UserSetup, name : "Bruger" },
  Bestilling : {component : StandardOrderSetup, name : "Standard Bestillinger"}
}

export function ShopSetup ({relatedCustomer: relatedCustomerID, hint}){
  const [SetupTableIdentifier, setSetupTableIdentifier] = useState(() => {
    if (hint in SHOP_CONFIG_SITES){
      return hint;
    } else {
      return "Lokationer";
    }

  })

  useEffect(() => {
    if(hint in SHOP_CONFIG_SITES){
      setSetupTableIdentifier(hint);
    }
  }, [hint]);

  const buttons = [...Object.keys(SHOP_CONFIG_SITES)].map(
    (key, i) => {
      const display = SetupTableIdentifier === key ? <u>{SHOP_CONFIG_SITES[key].name}</u> : <div>{SHOP_CONFIG_SITES[key].name}</div>
      return (
        <MarginButton
          aria-label={`setup-${key}`}
          key={i}
          value={SHOP_CONFIG_SITES[key].name}
          onClick={() => {setSetupTableIdentifier(key)}}
        >
          {display}
        </MarginButton>);
    }
  )

  const SetupTable = SHOP_CONFIG_SITES[SetupTableIdentifier].component;

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
