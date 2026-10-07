import React, { useState } from "react";
import { Button, Container } from "react-bootstrap";
import { TracershopNavbar } from "../injectable/navbar";
import { OrderPage } from "../production_pages/order_page";
import { VialPage } from "../production_pages/vial_page";

import { PRODUCTION_CONFIG_SITES, SetupShop } from "../production_pages/setup_pages/setup_shop"
import { USER_GROUPS } from "../../lib/constants";
import { useTracershopState } from "../../contexts/tracer_shop_context";
import { MonitorPage } from "~/components/production_pages/monitoring_pages/monitor_home_page";
import { CalenderColorMapContextProvider, PRODUCTION_ID } from "~/contexts/calender_color_map";
import { TracerProfiler } from "~/components/injectable/dev_components/tracer_profiler";
import { NavbarElement } from "../injectable/navbar_element";
import { Optional } from "../injectable/optional";
import { navigateTo } from "~/lib/utils";

export default function ProductionSite({ logout, NavbarElements }) {
  const state = useTracershopState()
  const [ActivePage, setActivePage] = useState<any>(navigateTo(OrderPage));
  const [configHint, setConfigHint] = useState("");
  const user = state.logged_in_user;
  const showProductionConfig = [USER_GROUPS.PRODUCTION_ADMIN, USER_GROUPS.ADMIN].includes(user.user_group);

  function onClickConfig(hint: string){
    return () => {
      setConfigHint(hint)
      setActivePage(navigateTo(SetupShop));
    }
  }

  const ConfigSites = [...Object.keys(PRODUCTION_CONFIG_SITES)].map((prod_config_key) => {
    const site = PRODUCTION_CONFIG_SITES[prod_config_key];
    return <div key={prod_config_key} onClick={onClickConfig(prod_config_key)}>{site.name}</div>
  })

  return (
      <div>
        <TracershopNavbar
          logout={logout}
          isAuthenticated={true}
        >
          {NavbarElements}
          <NavbarElement>
            <Button onClick={() => setActivePage(navigateTo(OrderPage))}><strong>Ordre</strong></Button>
          </NavbarElement>
          <NavbarElement key="vials">
            <Button onClick={() => setActivePage(navigateTo(VialPage))}><strong>Hætteglas</strong></Button>
          </NavbarElement>
          <Optional exists={showProductionConfig}>
            <NavbarElement key="prod-conf">
              <strong onClick={onClickConfig("")}>Opsætning</strong>
              {ConfigSites}
            </NavbarElement>
            <NavbarElement>
              <Button onClick={() => setActivePage(navigateTo(MonitorPage))}>
                <strong>Monitering</strong>
              </Button>
            </NavbarElement>
          </Optional>
        </TracershopNavbar>
        <Container fluid="xxl">
          <CalenderColorMapContextProvider endpoint_id={PRODUCTION_ID}>
            <ActivePage hint={configHint}/>
          </CalenderColorMapContextProvider>
        </Container>
      </div>);
}
