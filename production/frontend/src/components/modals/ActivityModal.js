import React, { Component } from "react";
import { ActivityModalStatus3 } from "./ActivityModalStatus3";
import ActivityModalAuthenticate from "./ActivityModalAuthenticate";
import ActivityModalStatus2 from "./ActivityModalStatus2";
import { ActivityModalStatus1 } from "./ActivityModalStatus1";
import PropTypes from 'prop-types'
import { Button, ButtonGroup, Modal, Table } from "react-bootstrap";


import styles from '../../css/Site.module.css'
import { renderClickableIcon, renderComment, renderHoverMessage, renderOnClose, renderTableRow } from "../../lib/Rendering";
import { changeState, toggleState } from "../../lib/stateManagement";
import { Calculator } from "../injectables/calculator";
import Authenticate from "../injectables/Authenticate";

export { ActivityModal }

const initial_state = {
  selectedVials : new Set(),
  isFreeing : false,
  editingActivity : false,
  usingCalculator : false,
  activityValue : 0,
  loginMessage : "",
  loginSpinner : false
}

const modals = {
  Status_1 : ActivityModalStatus1,
  Status_2 : ActivityModalStatus2,
  Status_3 : ActivityModalStatus3,
  Auth     : ActivityModalAuthenticate,
}

class ActivityModal extends Component {
  static propTypes = {
    isotopes : PropTypes.instanceOf(Map).isRequired,
    tracers  : PropTypes.instanceOf(Map).isRequired
  }

  /** This is the modal that shows up when the user click on an order to receive additional information
  * This modal also handles
  *
  *
  * @param {Object} props - Object with attributes:
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

  constructor(props){
    super(props);
    const order = this.props.orders.get(this.props.order);
    const state = initial_state;
    state.activityValue = order.amount;
    if (order.status == 3) for (const [_, vial] of this.props.vials){
      if(vial.order_id == order.oid){
        state.selectedVials.add(vial.ID)
      }
    }

    this.state = state;
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
  FreeingOrder(){
    this.setState({
      ...this.state,
      isFreeing : true
    });
  }

  cancel(){
    this.setState({
      ...this.state,
      isFreeing : false
    });
  }
  // Render functions

  CloseModal(){
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
        this.state.isFreeing ? MyModal = ActivityModalAuthenticate :
          MyModal = ActivityModalStatus2;
      break;
      case 3:
        MyModal = ActivityModalStatus3;
    }

    if (MyModal != null) return (<MyModal
        Authenticate={this.FreeingOrder.bind(this)}
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
    return null;
  }

  onClickAccept(){

  }


  onFree(username, password){

  }

  onClickToPDF(){
    const order    = this.props.orders.get(this.props.order);
    const customer = this.props.customer.get(order.BID);
    const username = customer.UserName;
    const year     = order.deliver_datetime.substring(0,4);
    const month    = order.deliver_datetime.substring(5,7);
    const pdfID    = order.COID == -1 ? order.oid : order.COID;
    const path     = `pdfs/${username}/${year}/${month}/${pdfID}`;
    window.location.href = path;
  }

  render_2() {
    const order = this.props.orders.get(this.props.order);
    const customer = this.props.customers.get(order.BID);

    const ColWidth = (this.state.usingCalculator || this.state.isFreeing) ? 6 : 12;


    const DestinationHover = renderHoverMessage(
      <div>Destination:</div>,
      "Kundens brugernavn, rigtige navn og bestillerens profil, hvis tilgændelig."
    );
    const DestinationMessage = order.username ?
                                `${customer.UserName} - ${customer.Realname} - ${order.username}` :
                                `${customer.UserName} - ${customer.Realname}`;
    const formattetOrderTime = `${order.deliver_datetime.substring(11,13)
    }:${order.deliver_datetime.substring(14,16)} - ${order.deliver_datetime.substring(8,10)
    }/${order.deliver_datetime.substring(5,7)}/${order.deliver_datetime.substring(0,4)} - Kørsel ${order.run}`;

    const ActivityTableCellEditable = <Col
                                        md="auto"
                                        className="justify-content-end">
      <Col>{Math.floor(order.amount)}</Col>
      <Col>{renderClickableIcon("/static/images/pen.svg")}</Col>
      <Col>{renderClickableIcon("/static/images/calculator.png")}</Col>
    </Col>

    const ActivityHover = renderHoverMessage(
        <div>Bestilt Aktivitet</div>,
        "Den mængde af aktivit kunden ønsket ved denne ordre. \
        Ikke korrigeret for andre ordre eller eventuel overhead.")

    const ActivityTableCellEditing = <Col md="auto" >
        <FormControl value={this.state.activityValue} onChange={changeState("activityValue", this)}/>
        {renderClickableIcon("/static/images/accept.svg", this.acceptNewActivity)}
      </Col>

    const ActivityTableCellFixed = <div>{Math.floor(order.amount)}</div>

    const canEdit = (order.status == 1 || order.status == 2) && !this.state.isFreeing;
    var ActivityTableCell;
    if (!canEdit) {
      ActivityTableCell = ActivityTableCellFixed;
    } else if (this.state.editingActivity){
      ActivityTableCell = ActivityTableCellEditing
    } else {
      ActivityTableCell = ActivityTableCellEditable
    }

    const TotalActivityHover = renderHoverMessage(
        <div>Total Aktivitet</div>,
        "Mængde af aktivitet der skal produceres til ordren."
    )
    const totalActivity = Math.floor(
      order.total_amount * (1 + customer.overhead / 100));

    const hasAllocation = (order.status == 2) || (order.status == 3);
    const AllocationMessage = order.status == 2 ?
                      "Allokeret aktivitet:"
                    : "Frigivet aktivitet:";
    var allocationTotal = 0;
    for(const vid of this.state.selectedVials.values()){
      const vial = this.props.vials.get(vid);
      allocationTotal += vial.activity;
    }

    const AllocationRow = renderTableRow(
      "5",
      [AllocationMessage, Math.floor(allocationTotal)]
    )

    const freedTime = order.frigivet_datetime != undefined ? `${order.frigivet_datetime.substring(11,13)
    }:${order.frigivet_datetime.substring(14,16)} - ${order.frigivet_datetime.substring(8,10)
    }/${order.frigivet_datetime.substring(5,7)}/${order.frigivet_datetime.substring(0,4)}` : null

    var SideElement = null;
    if(this.state.usingCalculator){
      SideElement = (<Col md={6}>
        <Calculator
          cancel={this.cancel_calculator}
          commit={this.commit_calculator}
          defaultMBq={300}
          isotope={this.props.isotopes}

        />
      </Col>)
    } else if (this.state.isFreeing){
      SideElement = (<Col md={6}>
        <Authenticate
          authenticate={this.onFree}
          errorMessage={this.state.loginMessage}
          fit_in={false}
          headerMessage={`Frigiv Ordre - ${order.oid}`}
          spinner={this.state.loginSpinner}
        />
      </Col>)
    }

    const AcceptButton = <Button onClick={this.onClickAccept}>Accepter Ordre</Button>;
    const ConfirmButton = <Button onClick={this.onClickConfirm}>Godkend Ordre</Button>;
    const PDFButton = <Button onClick={this.onClickToPDF}>Se føgleseddel</Button>;

    return(
    <Modal
      show={true}
      size="lg"
      onHide={this.props.onClose}
      className={styles.mariLight}>
      <Modal.Header>Order {order.oid}</Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={ColWidth}>
            <Table>
              <tbody>
                {renderTableRow("1", [DestinationHover, DestinationMessage])}
                {renderTableRow("2", ["Levering tidspunkt:", formattetOrderTime])}
                {renderTableRow("3", [ActivityHover, ActivityTableCell])}
                {renderTableRow("4", [TotalActivityHover, totalActivity])}
                {hasAllocation ? AllocationRow : null}
                {freedTime != null ? renderTableRow("6", ["Frigivet tidspunkt:", freedTime]) : null}
                {order.comment ? renderTableRow("99", ["Kommentar:", order.comment]) : null}
              </tbody>
            </Table>
          </Col>
          <SideElement/>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <ButtonGroup>
          {order.status == 1 ? <AcceptButton/> : null }
          {order.status == 2 && !this.state.isFreeing ? <ConfirmButton/> : null}
          {order.status == 3 ? <PDFButton/> : null}
          {renderOnClose(this.props.onClose)}
        </ButtonGroup>
      </Modal.Footer>
    </Modal>)
  }
}

