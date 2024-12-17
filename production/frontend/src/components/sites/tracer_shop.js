/** Master Site */
import React, { useEffect } from "react";


import { LoginSite } from "./login_site";
import { AdminSite } from "./admin_site";
import { ShopSite } from "./shop_site";
import { ProductionSite } from "./production_site";
import { DATABASE_CURRENT_USER, DATABASE_TODAY, USER_GROUPS} from "~/lib/constants";
import { ErrorPage } from "../error_pages/error_page";
import { User } from "~/dataclasses/dataclasses";
import { ErrorBoundary } from "react-error-boundary";
import { useTracershopDispatch, useTracershopState, useWebsocket } from "../../contexts/tracer_shop_context";
import { WEBSOCKET_DATE, WEBSOCKET_MESSAGE_AUTH_LOGOUT, WEBSOCKET_MESSAGE_GET_STATE } from "~/lib/shared_constants";
import { UpdateCurrentUser } from "~/lib/state_actions";
import Cookies from "js-cookie";
import { db } from "~/lib/local_storage_driver";
import { Optional } from "~/components/injectable/optional";
import { ServerErrorPage } from "~/components/error_pages/server_error_page";

const SITES = {
  log_in_site : LoginSite,
  admin_site : AdminSite,
  shop_site : ShopSite,
  production_site : ProductionSite,
}

export function TracerShop() {
  /**
    * Extracts which site the sure should be showed based on User group
    * @param {User} user - User to figure out which site to return
    * @returns {Component}
  */
  const tracershopState = useTracershopState();
  const dispatch = useTracershopDispatch();
  const websocket = useWebsocket();

  function logout(){
    websocket.send(websocket.getMessage(WEBSOCKET_MESSAGE_AUTH_LOGOUT)).then(
      () => {
        dispatch(new UpdateCurrentUser(new User()));
        Cookies.remove('sessionid');
        document.location.reload();
        db.set(DATABASE_CURRENT_USER, new User());
      }
    )
  }

  /**
   * Mapping of user groups to the site that tracershop should display to them.
   * @param {User} user
   * @returns {Element}
   */
  function get_site_from_user(user) {

    if(user.user_group == USER_GROUPS.ANON || user.user_group === undefined){
      return SITES.log_in_site;
    }

    if (user.user_group == USER_GROUPS.ADMIN){
      return SITES.admin_site;
    }
    if([USER_GROUPS.PRODUCTION_ADMIN,
        USER_GROUPS.PRODUCTION_USER,].includes(user.user_group)){
      return SITES.production_site;
    }
    if([USER_GROUPS.SHOP_ADMIN,
        USER_GROUPS.SHOP_USER,
        USER_GROUPS.SHOP_EXTERNAL].includes(user.user_group)){
          return SITES.shop_site;
    }
    /* istanbul ignore next */
    throw "Unknown User group: " + user.user_group;
  }

  const Site = get_site_from_user(tracershopState.logged_in_user);
  useEffect(() => {
    if(websocket !== null){
      const message = websocket.getMessage(WEBSOCKET_MESSAGE_GET_STATE);
      message[WEBSOCKET_DATE] = tracershopState.today;
      websocket.send(message);
    }
  }, [websocket])

  const hasNoError = !tracershopState.error

  return(
  <ErrorBoundary FallbackComponent={ErrorPage}>
    <Optional exists={hasNoError} alt={<ServerErrorPage error={tracershopState.error}/>}>
      <Site logout={logout} NavbarElements={[]}/>
    </Optional>

  </ErrorBoundary>);
}
