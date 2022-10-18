import React, { Component } from "react";
import { ActivityModalStatus3 } from "./ActivityModalStatus3";
import ActivityModalAuthenticate from "./ActivityModalAuthenticate";
import ActivityModalStatus2 from "./ActivityModalStatus2";
import { ActivityModalStatus1 } from "./ActivityModalStatus1";

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
    const Order = this.props.orders.get(this.props.order);

    var MyModal = null;
    switch(Order.status){
      case 1:
        MyModal = ActivityModalStatus1;
      break;
      case 2:
        this.state.isAuthenticating ? MyModal = ActivityModalAuthenticate :
          MyModal = ActivityModalStatus2;
      break;
      case 3:
        MyModal = ActivityModalStatus3;
    }

    if (MyModal != null) return (<MyModal
        accept={this.props.AcceptOrder}
        Authenticate={this.Authenticate.bind(this)}
        cancel={this.cancel.bind(this)}
        createVial={this.props.createVial}
        customers={this.props.customers}
        date={this.props.date}
        editVial={this.props.editVial}
        employees={this.props.employees}
        order={this.props.order}
        orders={this.props.orders}
        onClose={this.props.onClose}
        selectedVials={this.state.selectedVials}
        show={this.props.show}
        toggleVial={this.toggleVial.bind(this)}
        vials={this.props.vials}
        websocket={this.props.websocket}
      />);


    return(<div></div>);
  }
}