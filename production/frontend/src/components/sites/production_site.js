import React, { useState } from "react";
import { Container } from "react-bootstrap";
import { TracershopNavbar } from "../injectable/navbar.js";
import { OrderPage } from "../production_pages/order_page.js";
import { VialPage } from "../production_pages/vial_page.js";

import { SetupShop } from "../production_pages/setup_pages/setup_shop.js"
import { USER_GROUPS } from "../../lib/constants.js";
import { useTracershopState } from "../tracer_shop_context.js";
import { MonitorPage } from "~/components/production_pages/monitoring_pages/monitor_home_page.js";

const Pages = {
  orders : OrderPage,
  vial : VialPage,
  setup : SetupShop,
  monitor : MonitorPage,
};

const AdminPages = {
  orders : "Ordre",
  vial : "Hætteglas",
  setup : "Opsætning",
  monitor : "Monitorering",
}

const UserPages = {
  orders: "Ordre",
  vial : "Hætteglas"
}

export function ProductionSite({ logout, NavbarElements }) {
  const state = useTracershopState()
  const [activePage, setActivePage] = useState("orders");
  const ActivePage = Pages[activePage];

  const user = state.logged_in_user;
  let availablePages;
  if([USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.ADMIN].includes(user.user_group)){
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
          logout={logout}
          isAuthenticated={true}
          NavbarElements={NavbarElements}
        />
        <Container fluid="xxl">
          <ActivePage/>
        </Container>
      </div>);
}
