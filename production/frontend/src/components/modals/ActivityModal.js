import React, { Component } from "react";
import { ActivityModalStatus3 } from "./ActivityModalStatus3";
import ActivityModalAuthenticate from "./ActivityModalAuthenticate";
import ActivityModalStatus2 from "./ActivityModalStatus2";

export { ActivityModal }


/*
 * This is the modal that shows up when the user click on an order to recieve additional information
 * This modal also handles
 *
 *
 * Props :
 *  - show      - Boolean indicating if the modal should be shown
 *  - Order     - JavaScript Object with the following values:
 *      * oid    - int - the orders id
 *      * status - int - The status of an order where 1 = Ordered, 2 = Accepted, 3 = Finished, 4 Cancelled
 *  - Customer  - Javascript Object with the customer Information
 *  - onClose   - Function that closes the modal without any external state
 *  - onStatus3 - Function called when the user changes the status of an order to 3
 *  - applyVial - Function called when the user assigns a vial to an order.
 *
 *  TODO: This should be a composition of 3 (4 cancelled orders) different modals, dependant on which is shown.
 *
 */

const initial_state = {
  selectedVials : new Set(),
  isAuthenticating : false,
}

class ActivityModal extends Component {
  constructor(props){
    super(props);

    this.state = initial_state
  }

  /** Moves a Vial in or out of the selectedVials set in state
   *
   * @param {Number} vialID id of the vial being toggled
   */
  toggleVial(vialID){
    const selectedVials = new Set(this.state.selectedVials) //make a copy for new state
    if (selectedVials.has(vialID)){
      selectedVials.delete(vialID)
    } else {
      selectedVials.add(vialID)
    }

    this.setState({...this.state,
      selectedVials : selectedVials
    })
  }

  /**
   * This function is called to change the modal to an Authentication mode
   * This function is called from the status 2 Modal indicating, that the manager
   * should render the authentication component instead of the status2 modal. 
   */
  Authenticate(){
    this.setState({
      ...this.state,
      isAuthenticating : true
    });
  }

  cancel(){
    this.setState({
      ...this.state,
      isAuthenticating : false
    });
  }
  // Render functions

  CloseModal(){
    this.setState(initial_state);
    this.props.onClose();
  }

  render(){
    const Order = this.props.Order;

    if(Order) {
      if (Order.status == 3) {
        return (
          <ActivityModalStatus3
            show={this.props.show}
            Order={this.props.Order}
            customer={this.props.customer}
            onClose={this.props.onClose}
            vials={this.props.vials}
            employees={this.props.employees}
          />
        );
      } else if (Order.status == 2) {
        if (this.state.isAuthenticating) {
          return (<ActivityModalAuthenticate
            show={this.props.show}
            Order={this.props.Order}
            customer={this.props.customer}
            onClose={this.props.onClose}
            vials={this.props.vials}
            selectedVials={this.state.selectedVials}
            cancel={this.cancel.bind(this)}
            accept={this.props.AcceptOrder}
          />)
        } else {
          return (<ActivityModalStatus2
            show={this.props.show}
            Order={this.props.Order}
            customer={this.props.customer}
            onClose={this.props.onClose}
            vials={this.props.vials}
            editVial={this.props.editVial}
            createVial={this.props.createVial}
            selectedVials={this.state.selectedVials}
            toggleVial={this.toggleVial.bind(this)}
            Authenticate={this.Authenticate.bind(this)}
            date={this.props.date}
          />)
        }
      }
    }

    return(
    <div></div>
    );
  }
}