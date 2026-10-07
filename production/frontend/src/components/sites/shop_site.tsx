import React, { useMemo, useState } from "react";
import { TracershopNavbar } from "../injectable/navbar";
import { SHOP_CONFIG_SITES, ShopSetup } from "../shop_pages/shop_setup";
import { SHOP_ORDER_COMPONENTS, ShopOrderPage } from "../shop_pages/shop_order_page";

import { PROP_RELATED_CUSTOMER, PROP_USER, USER_GROUPS } from "../../lib/constants";

import { User, UserAssignment } from "../../dataclasses/dataclasses";
import { NoAssociatedUser } from "../shop_pages/no_associated_user";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { Button, Col } from "react-bootstrap";
import { NAVBAR_STYLES } from "~/lib/styles";
import { openShopManual } from "~/lib/utils";
import { NavbarElement } from "~/components/injectable/navbar_element";
import { Optional } from "~/components/injectable/optional";
import { NavigationContainer } from "~/lib/types";

const PAGES: NavigationContainer = {
  orders : { component : ShopOrderPage, name : "Bestillinger" },
  setup : { component : ShopSetup, name : "Opsætning" },
}

export default function ShopSite ({logout, NavbarElements=[]}) {
  const state = useTracershopState();
  const [siteIdentifier, setSiteIdentifier] = useState("orders");
  const [hint, setHint] = useState("");

  const Site = PAGES[siteIdentifier].component;

  const user = state.logged_in_user;
  const relatedCustomer = useMemo(() => {
    if([USER_GROUPS.SHOP_ADMIN, USER_GROUPS.SHOP_EXTERNAL, USER_GROUPS.SHOP_USER].includes(user.user_group)){
      const relatedCustomer = new Map()
      for(const userAssignment of state.user_assignment.values()){
        if(userAssignment.user === user.id){
          relatedCustomer.set(userAssignment.customer, state.customer.get(userAssignment.customer))
        }
      }
      return relatedCustomer;
    } else if (user.user_group === USER_GROUPS.ADMIN) {
      return state.customer;
    }
    return new Map();
  }, [state.user_assignment, state.logged_in_user]);
    // Blank site
  if(relatedCustomer.size === 0){
    return (
      <div>
        <TracershopNavbar
          logout={logout}
          isAuthenticated={true}
        ><div></div>

        </TracershopNavbar>
        <NoAssociatedUser />
      </div>);
  }

  const is_admin = [USER_GROUPS.SHOP_ADMIN, USER_GROUPS.ADMIN].includes(user.user_group);

  function activateOrderSite(hint: string){
    return () => {
      setHint(hint);
      setSiteIdentifier("orders")
    }
  }

  function activateSetupSite(hint: string){
    return () => {
      setHint(hint);
      setSiteIdentifier("setup")
    }
  }

  const orderNavbarElements = [...Object.keys(SHOP_ORDER_COMPONENTS).map(
    (key) => {
      const componentName = SHOP_ORDER_COMPONENTS[key].name;

      return (
      <NavbarElement>
        <div onClick={activateOrderSite(key)}>{componentName}</div>
      </NavbarElement>);
    }

  )]

  const setupNavbarElements = [...Object.keys(SHOP_CONFIG_SITES)].map(
    (key) => {
      const componentName = SHOP_CONFIG_SITES[key].name

    return (
      <NavbarElement key={key}>
        <div onClick={activateSetupSite(key)}>{componentName}</div>
      </NavbarElement>
    );}
  );

  return(<div>
    <TracershopNavbar
          logout={logout}
          isAuthenticated={true}
    >
      {NavbarElements}
      <Optional exists={user.user_group !== USER_GROUPS.SHOP_EXTERNAL}>
        <NavbarElement>
          <div onClick={activateOrderSite("")}>Bestillinger</div>
          {orderNavbarElements}
        </NavbarElement>
      </Optional>
      <Optional exists={user.user_group === USER_GROUPS.SHOP_EXTERNAL}>
        <NavbarElement>
          <Button onClick={activateOrderSite("")}>Bestillinger</Button>
        </NavbarElement>
      </Optional>
      <Optional exists={is_admin}>
        <NavbarElement>
          <div onClick={activateSetupSite("")}> Opsætning </div>
          {setupNavbarElements}
        </NavbarElement>
      </Optional>
      <NavbarElement>
        <Button
          style={NAVBAR_STYLES.navbarElement}
          onClick={openShopManual}
        >
          Manual
        </Button>
      </NavbarElement>
    </TracershopNavbar>
    <Site relatedCustomer={relatedCustomer} hint={hint}/>
  </div>);
}