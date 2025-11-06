import React, {useState} from "react"
import { ControlPanel } from "../admin_pages/control_panel"
import { TracershopNavbar } from "../injectable/navbar"
import { DatabasePanel } from "~/components/admin_pages/database_panel"
import { TelemetryVisualizer } from "~/components/admin_pages/telemetry_visualizer"
import { Col, Container, Row } from "react-bootstrap"
import { CalenderColorMapContextProvider, PRODUCTION_ID } from "~/contexts/calender_color_map"
import { Calender3Part } from "~/components/injectable/calender3Part"

const Pages = {
  controlPanel : ControlPanel, // Danish for key since keys are displayed.
  database : DatabasePanel,
  telemetry : TelemetryVisualizer
}

const PageNames = {
  controlPanel : "Kontrol Panel",
  database : "Database",
  telemetry : "Telemetri"
}

export function ConfigSite (props) {
  const [activeSite, setActivePage] = useState("controlPanel")
  const Site = Pages[activeSite];


  return(
    <div>
      <TracershopNavbar
        ActiveKey={activeSite}
        Names={PageNames}
        setActivePage={setActivePage}
        logout={props.logout}
        isAuthenticated={true}
        NavbarElements={props.NavbarElements}
      />
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
