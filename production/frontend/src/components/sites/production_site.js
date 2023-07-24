import React, { useState } from "react";
import { Container } from "react-bootstrap";
import Navbar, { TracershopNavbar } from "../injectable/navbar.js";
import { OrderPage } from "../production_pages/order_page.js";
import { VialPage } from "../production_pages/vial_page.js";

import { SetupShop } from "../production_pages/setup_shop.js";

const Pages = {
  ordre : OrderPage,
  vial : VialPage,
  setup : SetupShop,
};

const SiteName = {
  ordre : "Ordre",
  vial : "Hætteglas",
  setup : "Opsætning"
}


export function ProductionSite(props) {
  let firstKey;
  for(const key of Object.keys(Pages)){
    firstKey = key;
    break;
  }

  const [activePage, setActivePage] = useState(firstKey);
  const UserPage = Pages[activePage];

  return (
      <div>
        <TracershopNavbar
          ActiveKey={activePage}
          Names={SiteName}
          setActivePage={setActivePage}
          logout={props.logout}
          isAuthenticated={true}
          NavbarElements={props.NavbarElements}
        />
        <Container>
          <UserPage {...props}/>
        </Container>
      </div>
  );
}
