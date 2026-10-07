import React, {useState} from "react"
import { ControlPanel } from "../admin_pages/control_panel"
import { TracershopNavbar } from "../injectable/navbar"
import { DatabasePanel } from "~/components/admin_pages/database_panel"
import { TelemetryVisualizer } from "~/components/admin_pages/telemetry_visualizer"
import { Button, Col, Container, Row } from "react-bootstrap"
import { CalenderColorMapContextProvider, PRODUCTION_ID } from "~/contexts/calender_color_map"
import { Calender3Part } from "~/components/injectable/calender3Part"
import { NavbarElement } from "~/components/injectable/navbar_element"
import { NavigationContainer } from "~/lib/types"

const PAGES: NavigationContainer = {
  controlPanel : { component : ControlPanel, name : "Kontrol Panel"}, // Danish for key since keys are displayed.
  database : { component : DatabasePanel, name : "Database" },
  telemetry : { component : TelemetryVisualizer, name : "Telemetri"}
};

export default function ConfigSite (props) {
  const [activeSite, setActivePage] = useState("controlPanel")
  const Site = PAGES[activeSite].component;

  const configNavbarElement = [...Object.keys(PAGES)].map((key) => (
    <NavbarElement key={key}>
      <Button onClick={() => setActivePage(key)}>
        <strong>{PAGES[key].name}</strong>
      </Button>
    </NavbarElement>
  ));

  return(
    <div>
      <TracershopNavbar
        isAuthenticated={true}
        logout={props.logout}
      >
        {props.NavbarElements}
        {configNavbarElement}
      </TracershopNavbar>

      <Container>
        <Row>
          <Col>
            <Site {...props} />
          </Col>
          <Col xs={4}>
            <CalenderColorMapContextProvider endpoint_id={PRODUCTION_ID}>
              <Calender3Part calender_on_day_click={(date) => {console.log("clicked on :", date)}}/>
            </CalenderColorMapContextProvider>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
