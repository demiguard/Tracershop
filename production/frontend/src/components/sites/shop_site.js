import React, {Component } from "react";
import { propsExtraction } from "../../lib/props_management";
import Navbar, { TracershopNavbar } from "../injectable/navbar";
import { ShopSetup } from "../shop_pages/shop_setup.js";
import { ShopOrderPage } from "../shop_pages/shop_order_page.js";
import { UserSetup} from "../shop_pages/user_setup.js"


export { ShopSite }

const Pages = {
  Bestillinger : ShopOrderPage,
  Opsætning : ShopSetup,
  Bruger : UserSetup
}


class ShopSite extends Component {
  constructor(props){
    super(props);
    this.state = {
      ActivePage : ShopOrderPage,
    };
  }

  setActivePage(NewPageName) {
    const NewPage = Pages[NewPageName];
    const NewState = {...this.state, ActivePage : NewPage};
    this.setState(NewState);
  }


  render(){
    const siteProps = {...this.props}

    return(
      <div>
        <TracershopNavbar
          Names={Object.keys(Pages)}
          logout={this.props.logout}
          isAuthenticated={true}
          NavbarElements={this.props.NavbarElements}
          setActivePage={this.setActivePage.bind(this)}
        />
        <this.state.ActivePage {...siteProps}/>
      </div>
    )
  }
}