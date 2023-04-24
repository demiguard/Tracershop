import React, {Component} from "react";
import propTypes from 'prop-types';
import { LoginSite } from "./login_site";
import { AdminSite } from "./admin_site";
import { ShopSite } from "./shop_site";
import { ProductionSite } from "./production_site";
import { ERROR_INSUFFICIENT_PERMISSIONS, ERROR_INVALID_JAVASCRIPT_VERSION, ERROR_UNHANDLED_USER_GROUP, PROP_USER, USER_GROUPS, PROP_TRACERSHOP_SITE } from "../../lib/constants";
import ErrorPage from "../error_pages/error_page";
import InvalidVersionPage from "../error_pages/invalid_version_page";
import { User } from "../../dataclasses/user";
import { propsExtraction } from "../../lib/props_management";

const SITES = {
  log_in_site : LoginSite,
  admin_site : AdminSite,
  shop_site : ShopSite,
  production_site : ProductionSite,
}

export { TracerShop }

/**Main site class */
class TracerShop extends Component {
  static propTypes = {
    user : propTypes.instanceOf(User) // PROP_USER
  }

  constructor(props){
    super(props)

    this.state = {
      site_error : "",
      site_error_info : "",
    }
  }
  /**
 * Extracts which site the sure should be showed based on User group
 * @param {User} user - User to figure out which site to return
 * @returns {Component}
 */
  get_site_from_user(user) {
    if (user.user_group == USER_GROUPS.ADMIN){
      return SITES.admin_site
    }
    if(user.user_group == USER_GROUPS.ANON){
      return SITES.log_in_site
    }
    if([USER_GROUPS.PRODUCTION_ADMIN,
        USER_GROUPS.PRODUCTION_USER,].includes(user.user_group)){
      return SITES.production_site
    }
    if([USER_GROUPS.SHOP_ADMIN,
        USER_GROUPS.SHOP_USER,
        USER_GROUPS.SHOP_EXTERNAL].includes(user.user_group)){
          return SITES.shop_site
        }
    throw "Unknown User group: " + user.user_group;
  }


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
      let Site = this.get_site_from_user(this.props[PROP_USER])
      let new_props = propsExtraction(this.props);

      new_props[PROP_TRACERSHOP_SITE] = TracerShop

      return (<Site
        {...new_props}
        />)
    } catch {
      return (<ErrorPage
        SiteError="Unknown User Group"
        SiteErrorInfo=""
      />);
    }
  }
}