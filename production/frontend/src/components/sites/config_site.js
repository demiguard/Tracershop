import React, {useState} from "react"
import { ControlPanel } from "../admin_pages/control_panel.js"
import { TracershopNavbar } from "../injectable/navbar.js"
import { DatabasePanel } from "~/components/admin_pages/database_panel.js"

const Pages = {
  controlPanel : ControlPanel, // Danish for key since keys are displayed.
  database : DatabasePanel
}

const PageNames = {
  controlPanel : "Kontrol Panel",
  database : "Database"
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
      <Site
        {...props}
      />
    </div>
  );
}
