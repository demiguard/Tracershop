import React, { useState } from "react";
import { Container } from "react-bootstrap";
import Navbar, { TracershopNavbar } from "../injectable/navbar.js";
import { OrderPage } from "../production_pages/order_page.js";
import { VialPage } from "../production_pages/vial_page.js";

import { SetupShop } from "../production_pages/setup_pages/setup_shop.js"
import { PROP_USER, USER_GROUPS } from "../../lib/constants.js";

const Pages = {
  orders : OrderPage,
  vial : VialPage,
  setup : SetupShop,
};

const AdminPages = {
  orders : "Ordre",
  vial : "Hætteglas",
  setup : "Opsætning"
}

const UserPages = {
  orders: "Ordre",
  vial : "Hætteglas"
}

export function ProductionSite(props) {
  const [activePage, setActivePage] = useState("orders");
  const ActivePage = Pages[activePage];

  const /**@type {User} */ user = props[PROP_USER]
  let availablePages;
  if([USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.ADMIN].includes(user.UserGroup)){
    availablePages = AdminPages;
  } else {
    availablePages = UserPages;
  }

  return (
      <div>
        <TracershopNavbar
          ActiveKey={activePage}
          Names={availablePages}
          setActivePage={setActivePage}
          logout={props.logout}
          isAuthenticated={true}
          NavbarElements={props.NavbarElements}
        />
        <Container>
          <ActivePage {...props}/>
        </Container>
      </div>
  );
}
