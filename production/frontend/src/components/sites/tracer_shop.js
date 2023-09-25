/** Master Site */

import React, {Component, useState} from "react";
import propTypes from 'prop-types';
import { LoginSite } from "./login_site";
import { AdminSite } from "./admin_site";
import { ShopSite } from "./shop_site";
import { ProductionSite } from "./production_site";
import { ERROR_INSUFFICIENT_PERMISSIONS, ERROR_INVALID_JAVASCRIPT_VERSION, ERROR_UNHANDLED_USER_GROUP, PROP_USER, USER_GROUPS, PROP_TRACERSHOP_SITE } from "../../lib/constants";
import ErrorPage from "../error_pages/error_page";
import InvalidVersionPage from "../error_pages/invalid_version_page";
import { User } from "../../dataclasses/dataclasses";
import { ErrorBoundary } from "react-error-boundary";

const SITES = {
  log_in_site : LoginSite,
  admin_site : AdminSite,
  shop_site : ShopSite,
  production_site : ProductionSite,
}


export function TracerShop(props) {
  /**
    * Extracts which site the sure should be showed based on User group
    * @param {User} user - User to figure out which site to return
    * @returns {Component}
  */
  function get_site_from_user(user) {
    if (user.UserGroup == USER_GROUPS.ADMIN){
      return SITES.admin_site
    }
    if(user.UserGroup == USER_GROUPS.ANON || user.UserGroup === undefined){
      return SITES.log_in_site
    }
    if([USER_GROUPS.PRODUCTION_ADMIN,
        USER_GROUPS.PRODUCTION_USER,].includes(user.UserGroup)){
      return SITES.production_site
    }
    if([USER_GROUPS.SHOP_ADMIN,
        USER_GROUPS.SHOP_USER,
        USER_GROUPS.SHOP_EXTERNAL].includes(user.UserGroup)){
          return SITES.shop_site
        }
    throw "Unknown User group: " + user.UserGroup;
  }

  const Site = get_site_from_user(props[PROP_USER]);

  console.log(props[PROP_USER])

  return <ErrorBoundary FallbackComponent={ErrorPage}>
    <Site {...props}/>
  </ErrorBoundary>
  /*
  render() {
    if (this.state.site_error){
      if(this.state.site_error == ERROR_INVALID_JAVASCRIPT_VERSION) {
        return (<InvalidVersionPage/>);
      } else if (this.state.site_error == ERROR_INSUFFICIENT_PERMISSIONS) {
        // Do Nothing? Assume the operation have handled the insuficient permissions
      } else
      return (<ErrorPage
        SiteError={this.state.site_error}
        SiteErrorInfo={this.state.site_error_info}
      />);
    }
    try {
      
      let new_props = {...this.props}

      new_props[PROP_TRACERSHOP_SITE] = TracerShop

      return (<Site
        {...new_props}
        />)
    } catch {
      return (<ErrorPage
        SiteError={this.state.site_error}
        SiteErrorInfo={this.state.site_error_info}
      />);
    }
  }
  */
}