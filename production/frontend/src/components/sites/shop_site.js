import React, {useState } from "react";
import Navbar, { TracershopNavbar } from "../injectable/navbar";
import { ShopSetup } from "../shop_pages/shop_setup.js";
import { ShopOrderPage } from "../shop_pages/shop_order_page.js";
import { UserSetup} from "../shop_pages/user_setup.js"
import { JSON_CUSTOMER, JSON_USER_ASSIGNMENT, PROP_RELATED_CUSTOMER, PROP_USER, USER_GROUPS } from "../../lib/constants";
import { User, UserAssignment } from "../../dataclasses/dataclasses";
import { NoAssociatedUser } from "../shop_pages/no_associated_user";

const Pages = {
  orders : ShopOrderPage,
  setup : ShopSetup,
  users : UserSetup
}

const AdminPages = {
  orders : "Bestillinger",
  setup : "Opsætning",
  users : "Bruger"
}

const UserPages = {
  orders : "Bestillinger"
}

export function ShopSite (props) {
  const [siteIdentifier, setSiteIdentifier] = useState("orders");
  const Site = Pages[siteIdentifier];
  const siteProps = {...props};
  const /**@type {User} */ user = props[PROP_USER]


  let relatedCustomer
  if([USER_GROUPS.SHOP_ADMIN, USER_GROUPS.SHOP_EXTERNAL, USER_GROUPS.SHOP_USER].includes(user.user_group)){
    relatedCustomer = [...props[JSON_USER_ASSIGNMENT].values()].filter((_userAssignment) => {
      const /**@type {UserAssignment} */ userAssignment = _userAssignment
      return userAssignment.user === user.id
    }).map((userAssignment) => {return userAssignment.customer})

    if(relatedCustomer.length === 0){
      // Blank site
      return (
        <div>
          <TracershopNavbar
            ActiveKey={null}
            Names={{}}
            logout={props.logout}
            isAuthenticated={true}
            NavbarElements={[]}
            setActivePage={() => {}}
          />
          <NoAssociatedUser
            {...props}
          />
        </div>)
    }
  } else {
    relatedCustomer = [...props[JSON_CUSTOMER].values()].map((customer)=> {return customer.id})
  }

  let availablePages
  if([USER_GROUPS.SHOP_EXTERNAL, USER_GROUPS.SHOP_USER].includes(user.user_group)){
    availablePages = UserPages
  } else {
    availablePages = AdminPages
  }

  siteProps[PROP_RELATED_CUSTOMER] = relatedCustomer;

  return(<div>
    <TracershopNavbar
          ActiveKey={siteIdentifier}
          Names={availablePages}
          logout={props.logout}
          isAuthenticated={true}
          NavbarElements={props.NavbarElements}
          setActivePage={setSiteIdentifier}
    />
    <Site {...siteProps}/>
  </div>);
}