import React, {useState } from "react";
import { TracershopNavbar } from "../injectable/navbar";
import { ShopSetup } from "../shop_pages/shop_setup.js";
import { ShopOrderPage } from "../shop_pages/shop_order_page.js";

import { PROP_RELATED_CUSTOMER, PROP_USER, USER_GROUPS } from "../../lib/constants";

import { User, UserAssignment } from "../../dataclasses/dataclasses";
import { NoAssociatedUser } from "../shop_pages/no_associated_user";
import { useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { Button, Col } from "react-bootstrap";
import { NAVBAR_STYLES } from "~/lib/styles";
import { openShopManual } from "~/lib/utils";

const Pages = {
  orders : ShopOrderPage,
  setup : ShopSetup,
}

const AdminPages = {
  orders : "Bestillinger",
  setup : "Opsætning",
}

const UserPages = {
  orders : "Bestillinger"
}

export function ShopSite ({logout, NavbarElements=[]}) {
  const state = useTracershopState();
  const [siteIdentifier, setSiteIdentifier] = useState("orders");
  const Site = Pages[siteIdentifier];

  const /**@type {User} */ user = state.logged_in_user;
  const relatedCustomer = (() => {
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
  })()
    // Blank site
  if(relatedCustomer.size === 0){
    return (
      <div>
        <TracershopNavbar
          ActiveKey={null}
          Names={{}}
          logout={logout}
          isAuthenticated={true}
          NavbarElements={[]}
          setActivePage={() => {}}
          />
        <NoAssociatedUser />
      </div>);
  }

  const availablePages = (() => {
    if([USER_GROUPS.SHOP_EXTERNAL, USER_GROUPS.SHOP_USER].includes(user.user_group)){
      return  UserPages
    } else {
      return AdminPages
    }
  })();

  const manualNavBarElement = (<Col style={{
    display : "flex",
    alignItems : "center"
  }} key="shop-manual">
      <Button
        style={NAVBAR_STYLES.navbarElement}
        onClick={openShopManual}>
          Manual
        </Button>
  </Col>);

  const newNavbarElements = [manualNavBarElement, ...NavbarElements]

  return(<div>
    <TracershopNavbar
          ActiveKey={siteIdentifier}
          Names={availablePages}
          logout={logout}
          isAuthenticated={true}
          NavbarElements={newNavbarElements}
          setActivePage={setSiteIdentifier}
    />
    <Site relatedCustomer={relatedCustomer} />
  </div>);
}