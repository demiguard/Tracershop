import React, { useState } from "react";
import { Container, Row } from "react-bootstrap";
import {CustomerPage} from "./customer_page";
import TracerPage from "./tracer_page";
import { CloseDaysPage } from "./close_days_page";
import { DeadlineSetup } from "./deadline_setup";
import { MarginButton } from "../injectable/buttons";
import { ProductionUserSetup } from "./production_user_setup";

const sites = {
  customer : CustomerPage,
  tracer : TracerPage,
  closeDates : CloseDaysPage,
  deadline : DeadlineSetup,
  users : ProductionUserSetup
}

const siteNames = {
  customer : "Levering og Kunder",
  tracer : "Tracer",
  closeDates : "Lukke dage",
  deadline : "Deadlines",
  users : "Bruger",
}


export function SetupShop(props){
  const [siteIdentifier, setSiteIdentifier] = useState('customer')

  const Buttons = [...Object.keys(sites)].map(
    (_siteIdentifier, i) => {
      return <MarginButton
              onClick={() => {setSiteIdentifier(_siteIdentifier)}}
              key={i}>{siteNames[_siteIdentifier]}</MarginButton>;
    }
  )
  const Site = sites[siteIdentifier];

  return (
  <Container>
    <Row style={{
      marginBottom : '15px',
      marginTop : '15px',
    }}><div>{Buttons}</div></Row>
    <Site {...props}/>
  </Container>
  )
}