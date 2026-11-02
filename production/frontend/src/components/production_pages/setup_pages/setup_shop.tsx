import React, { useEffect, useState } from "react";
import { Container, Row } from "react-bootstrap";
import {CustomerPage} from "./customer_page";
import { TracerPage } from "./tracer_page";
import { CloseDaysPage } from "./close_days_page";
import { DeadlineSetup } from "./deadline_setup";
import { MarginButton } from "../../injectable/buttons";
import { ExternalUserSetup } from "./production_user_setup";
import { IsotopeSetupPage } from "./isotope_setup_page";
import { FreeingRightsPage } from "./freeing_rights_page";
import { ProductionSetup } from "./production_setup";
import { PrinterOverviewPage } from "~/components/production_pages/setup_pages/printer_setup_page";
import { DocumentSetup } from "~/components/production_pages/setup_pages/document_setup";
import { NavigationContainer } from "~/lib/types"
import { ProjectPage } from "./project_page";

export const PRODUCTION_CONFIG_SITES: NavigationContainer = {
  customer       : { component : CustomerPage, name : "Levering og Kunder" },
  project        : { component : ProjectPage, name : "Projekter" },
  tracer         : { component : TracerPage, name : "Tracer" },
  isotope        : { component : IsotopeSetupPage, name : "Isotoper" },
  production     : { component : ProductionSetup, name : "Produktioner" },
  closeDates     : { component : CloseDaysPage, name : "Lukke dage" },
  deadline       : { component : DeadlineSetup, name : "Deadlines" },
  external_users : { component : ExternalUserSetup, name : "Externe Kunder" },
  release_rights : { component : FreeingRightsPage, name : "Frigivelse rettigheder" },
  documents      : { component : DocumentSetup, name : "Dokumenter"},
  printer        : { component : PrinterOverviewPage, name : "Printer" },
}


export function SetupShop({hint}){
  const [siteIdentifier, setSiteIdentifier] = useState(() => {
    if (hint in PRODUCTION_CONFIG_SITES){
      return hint
    } else {
      return "customer";
    }
  });

  useEffect(() => {
    if(hint in PRODUCTION_CONFIG_SITES){
      setSiteIdentifier(hint);
    }
  }, [hint])

  const Site = PRODUCTION_CONFIG_SITES[siteIdentifier].component;

  return (
  <Container>
    <Site/>
  </Container>);
}