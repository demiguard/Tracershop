import React, { useState} from "react";
import { Col, Row, FormControl, Modal, Table, Form } from "react-bootstrap";
import propTypes from 'prop-types'

import { Authenticate } from "../injectable/authenticate.js"

import { setStateToEvent } from "../../lib/state_management.js";
import { ORDER_STATUS, PROP_MODAL_ORDER, PROP_ON_CLOSE} from "../../lib/constants.js";

import { AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, AUTH_IS_AUTHENTICATED,
  WEBSOCKET_DATA, DATA_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_DATA_ID
} from "~/lib/shared_constants.js"

import styles from '~/css/Site.module.css'
import { renderComment, renderTableRow } from "~/lib/rendering.js";

import { HoverBox } from "../injectable/hover_box.js";
import { CloseButton, MarginButton } from "../injectable/buttons.js";
import { compareDates, InjectionOrderPDFUrl } from "~/lib/utils.js";
import { getToday } from "~/lib/chronomancy.js";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box.js";
import { batchNumberValidator, nullParser } from "~/lib/formatting.js";
import { useTracershopState, useWebsocket } from "~/components/tracer_shop_context.js";
import { InjectionUsage } from "~/components/injectable/data_displays/injection_usage.js";
import { TracerDisplay } from "../injectable/data_displays/tracer_display.js";
import { TimeDisplay } from "../injectable/data_displays/time_display.js";
import { ReleaseRightHolder } from "~/lib/data_structures.js";
import { EditableInput } from "../injectable/inputs/number_input.js";
import { LotNumberHeader } from "../injectable/headers/lot_display.js";

export function InjectionModal ({modal_order, on_close}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const order = state.injection_orders.get(modal_order);

  const [freeing, setFreeing] = useState(false);
  const [lot_number, setLotNumber] = useState(nullParser(order.lot_number));
  const [error, setError] = useState("");
  const [errorLevel, setErrorLevel] = useState(ERROR_LEVELS.hint);

  const canEdit = !freeing && order.status !== ORDER_STATUS.RELEASED;

  const endpoint = state.delivery_endpoint.get(order.endpoint);
  const customer = state.customer.get(endpoint.owner);
  const tracer = state.tracer.get(order.tracer);
  const releaseRightHolder = new ReleaseRightHolder(state.logged_in_user, state.release_right);
  const RightsToFree = releaseRightHolder.permissionForTracer(tracer);

  function acceptOrder(){
    order.status = 2;
    websocket.sendEditModel(DATA_INJECTION_ORDER, [order]);
  }

  function startFreeing(){
    if(!batchNumberValidator(lot_number)){
      setError("Lot nummeret er ikke i det korrekte format");
      setErrorLevel(ERROR_LEVELS.error);
      return;
    }

    const today = getToday();
    const orderDate = new Date(order.delivery_date);
    if(!compareDates(today, orderDate)){

      setError("Du er i gang med at frigive en ordre som ikke er bestilt til i dag!");
      setErrorLevel(ERROR_LEVELS.hint);
      setFreeing(true);

      return; // This return statement is there to prevent two updates instead of one
    }

    setFreeing(true);
  }

  function cancelFreeing(){
    setFreeing(false);
  }

  function freeOrder(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_INJECTION);
    const auth = {};
    auth[AUTH_USERNAME] = username;
    auth[AUTH_PASSWORD] = password;
    message[DATA_AUTH] = auth;
    const data = {};
    data[WEBSOCKET_DATA_ID] = modal_order;
    data["lot_number"] = lot_number;
    message[WEBSOCKET_DATA] = data;

    websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        // Free The order
        setError("");
        setFreeing(false);

      } else {
        setError("Forkert Login");
        setErrorLevel(ERROR_LEVELS.error);
      }
    })
  }


  const freeingButton = RightsToFree ?
      <MarginButton onClick={startFreeing}>Frigiv Ordre</MarginButton>
    : <MarginButton disabled>Frigiv Ordre</MarginButton>;

  const colWidth = (freeing) ? 6 : 12;
  let secondaryElement = null; // Remember to wrap this is a <Col md={6}>
  if(freeing){
    secondaryElement = <Col md={6}>
          <Authenticate
                  fit_in={false}
                  authenticate={freeOrder}
                  headerMessage={`Frigiv Ordre - ${modal_order}`}
                  buttonMessage={`Frigiv Ordre`}
                  />
        </Col>;
    }

    return(
      <Modal
        show={true}
        size="lg"
        onHide={on_close}
        className={styles.mariLight}
      >
        <Modal.Header>Injection Ordre {modal_order}</Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={colWidth}>
              <Table>
                <tbody>
                  <tr>
                    <td>
                      <HoverBox
                        Base={<div>Destination:</div>}
                        Hover={<div>Kundens brugernavn, rigtige navn og bestillerens profil, hvis tilgændelig.</div>}
                      />
                    </td>
                    <td>{customer.short_name} - {endpoint.name}</td>
                  </tr>
                  <tr>
                    <td><div>Leverings tid:</div></td>
                    <td><div><TimeDisplay time={order.delivery_time}/></div></td>
                  </tr>
                  <tr>
                    <td><div>Tracer:</div></td>
                    <td><TracerDisplay tracer={tracer}/></td>
                  </tr>
                  <tr>
                    <td><div>Anvendelse:</div></td>
                    <td><InjectionUsage usage={order.tracer_usage}/></td>
                  </tr>
                  {
                   order.comment ? <tr>
                    <td>Kommentar</td>
                    <td>{order.comment}</td> {/* Note I render the comment rather than render a comment Icon */}
                  </tr> : ""
                  }
                  {
                    [ORDER_STATUS.ACCEPTED,ORDER_STATUS.RELEASED].includes(order.status) ?
                    <tr>
                      <td><LotNumberHeader/></td>
                      <td>
                        <EditableInput
                          aria-label="lot-input"
                          value={lot_number}
                          canEdit={canEdit}
                          onChange={setStateToEvent(setLotNumber)}
                        />
                      </td>
                    </tr> : ""
                  }
                </tbody>
              </Table>
            </Col>
            {secondaryElement ? secondaryElement : ""}
          </Row>
          {error != "" ? <AlertBox
            level={errorLevel}
            message={error}
          /> : ""}
        </Modal.Body>
        <Modal.Footer>
          <Row style={{width : "100%"}}>
            <Col md={3}>
              <HoverBox
                Base={<MarginButton>Afvis ordre</MarginButton>}
                Hover={"Ikke bygget færdig endnu!"}
              />
            </Col>
            <Col md={{ span : 3, offset : 5}}>
                {order.status == 1 ? <MarginButton onClick={acceptOrder}>Accepter Ordre</MarginButton> : ""}
                {order.status == 2 && !freeing ? freeingButton : ""}
                {order.status == 2 && freeing ? <MarginButton onClick={cancelFreeing}>Rediger Ordre</MarginButton> : ""}
                {order.status == 3 ? <MarginButton onClick={() => {
                  window.location = InjectionOrderPDFUrl(order)}
                }>Se følgeseddel</MarginButton> : ""}
           </Col>
            <Col md={1}>
                <CloseButton onClick={on_close}/>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    );
}

InjectionModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [PROP_MODAL_ORDER] : propTypes.number.isRequired,
}

