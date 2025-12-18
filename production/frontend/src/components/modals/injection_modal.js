import React, { useEffect, useState} from "react";
import propTypes from 'prop-types'
import { Col, Row, Modal, Table } from "react-bootstrap";
import { Authenticate } from "../injectable/authenticate"
import { setStateToEvent } from "~/lib/state_management";
import { ERROR_TYPE_HINT, ORDER_STATUS, PROP_MODAL_ORDER, PROP_ON_CLOSE} from "~/lib/constants";
import { AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, AUTH_IS_AUTHENTICATED,
  WEBSOCKET_DATA, DATA_INJECTION_ORDER, WEBSOCKET_MESSAGE_FREE_INJECTION,
  WEBSOCKET_DATA_ID, WEBSOCKET_DATATYPE, WEBSOCKET_MESSAGE_CORRECT_ORDER,
  WEBSOCKET_MESSAGE_TYPE
} from "~/lib/shared_constants"
import { HoverBox } from "../injectable/hover_box";
import { CloseButton, MarginButton } from "../injectable/buttons";
import { compareDates, InjectionOrderPDFUrl, openInjectionReleasePDF } from "~/lib/utils";
import { getToday, toLotDateString } from "~/lib/chronomancy";
import { AlertBox, ERROR_LEVELS } from "../injectable/alert_box";
import { batchNumberValidator, nullParser } from "~/lib/formatting";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { InjectionUsage } from "~/components/injectable/data_displays/injection_usage";
import { TracerDisplay } from "../injectable/data_displays/tracer_display";
import { TimeDisplay } from "../injectable/data_displays/time_display";
import { EditableInput } from "../injectable/inputs/editable_input";
import { LotNumberHeader } from "../injectable/headers/lot_display";
import { Optional } from "~/components/injectable/optional";
import { CancelBox } from "~/components/injectable/cancel_box";
import { FONT } from "~/lib/styles";
import { DateTime } from "~/components/injectable/datetime";
import { RecoverableError, useErrorState } from "~/lib/error_handling";
import { useUserReleaseRights } from "~/contexts/user_release_right";
import { CancelButton } from "~/components/injectable/cancel_button";

export function InjectionModal ({modal_order, on_close}) {
  const state = useTracershopState();
  const websocket = useWebsocket();
  const order = state.injection_orders.get(modal_order);
  const tracer = state.tracer.get(order.tracer);
  const endpoint = state.delivery_endpoint.get(order.endpoint);
  const customer = state.customer.get(endpoint.owner);
  const defaultLotNumber = order.lot_number ? nullParser(order.lot_number) :
                           tracer.vial_tag ? `${tracer.vial_tag}-${toLotDateString(order.delivery_date)}-1` : "";

  const [freeing, setFreeing] = useState(false);
  const [showCorrectAuth, setShowCorrectAuth] = useState(false);
  const [lot_number, setLotNumber] = useState(defaultLotNumber);
  const [loginError, setLoginError] = useErrorState();
  const [formattingError, setFormattingError] = useErrorState();
  const [dateError, setDateError] = useErrorState();

  const canEdit = !freeing && (order.status === ORDER_STATUS.ACCEPTED
        || order.status === ORDER_STATUS.ORDERED);

  const releaseRightHolder = useUserReleaseRights();
  const RightsToFree = releaseRightHolder.permissionForTracer(tracer);

  const released_user = (() => {
    if(order.status === ORDER_STATUS.RELEASED){
      const user = state.user.get(order.freed_by);
      return user.username.toUpperCase();
    }

    return null;
  })();

  function acceptOrder(){
    order.status = ORDER_STATUS.ACCEPTED;
    websocket.sendEditModels(DATA_INJECTION_ORDER, [order]);
  }

  function startFreeing(){
    if(!batchNumberValidator(lot_number)){
      setFormattingError(
        new RecoverableError(
          "Lot nummeret er ikke i det korrekte format",
          ERROR_LEVELS.error
        )
      );

      return;
    }

    const today = getToday();
    const orderDate = new Date(order.delivery_date);
    if(!compareDates(today, orderDate)){
      setDateError(new RecoverableError(
        "Du er i gang med at frigive en ordre som ikke er bestilt til i dag!",
        ERROR_LEVELS.hint
      ));
    }

    setFreeing(true);
  }

  function cancelFreeing(){
    setFreeing(false);
  }

  function freeOrder(username, password){
    const message = websocket.getMessage(WEBSOCKET_MESSAGE_FREE_INJECTION);
    message[DATA_AUTH] = {
      [AUTH_USERNAME] : username,
      [AUTH_PASSWORD] : password,
    };
    message[WEBSOCKET_DATA] = {
      [WEBSOCKET_DATA_ID] : modal_order,
      "lot_number" : lot_number,
    };
    return websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        setLoginError(new RecoverableError());
        setFreeing(false);
      } else {
        setLoginError(new RecoverableError(
          "Forkert login"
        ));
      }
    })
  }

  function correctOrder(username, password) {
    const message = {
      [DATA_AUTH] : {
        [AUTH_USERNAME] : username,
        [AUTH_PASSWORD] : password
      },
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_CORRECT_ORDER,
      [WEBSOCKET_DATA] : {
         DATA_INJECTION_ORDER : [modal_order]
      }
    };

    return websocket.send(message).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        setLoginError(new RecoverableError());
        setShowCorrectAuth(false);
      } else {
        setLoginError(new RecoverableError(
          "Forkert login"
        ));
      }
      }
    )
  }

  const freeingButton = RightsToFree ?
      <MarginButton onClick={startFreeing}>Frigiv ordre</MarginButton>
    : <MarginButton disabled>Frigiv ordre</MarginButton>;

  const colWidth = (freeing || showCorrectAuth) ? 6 : 12;
  let secondaryElement = null; // Remember to wrap this is a <Col md={6}>
  if(freeing){
    secondaryElement = <Col md={6}>
          <Authenticate
                  error={loginError}
                  fit_in={false}
                  authenticate={freeOrder}
                  headerMessage={`Frigiv ordre - ${modal_order}`}
                  buttonMessage={`Frigiv ordre`}
                  setError={setLoginError}
          />
        </Col>;
    } else if(showCorrectAuth){
      secondaryElement = <Col md={6}>
          <Authenticate
                  error={loginError}
                  fit_in={false}
                  authenticate={correctOrder}
                  headerMessage={`Ret ordre - ${modal_order}`}
                  buttonMessage={`Ret ordre`}
                  setError={setLoginError}
          />
        </Col>

    }

    return(
      <div>
      <Modal
        show={true}
        size="lg"
        onHide={on_close}
        style={FONT.light}
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
                  <Optional exists={!!order.comment}>
                    <tr>
                      <td>Kommentar</td>
                      <td>{order.comment /* Note I render the comment rather than render a comment Icon */}</td>
                    </tr>
                  </Optional>
                  <Optional exists={[ORDER_STATUS.ACCEPTED,ORDER_STATUS.RELEASED].includes(order.status)}>
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
                    </tr>
                  </Optional>
                  <Optional exists={order.status === ORDER_STATUS.RELEASED}>
                    <tr>
                      <td>Frigivet af: </td>
                      <td>{released_user}</td>
                    </tr>
                  </Optional>
                  <Optional exists={order.status === ORDER_STATUS.RELEASED}>
                    <tr>
                      <td>Frigivet kl: </td>
                      <td><DateTime dateLike={order.freed_datetime}/></td>
                    </tr>
                  </Optional>
                  </tbody>
              </Table>
            </Col>
            {secondaryElement ? secondaryElement : null}
          </Row>
          <Optional exists={!tracer.vial_tag}>
            <AlertBox
              error={new RecoverableError(
                "Traceren har ikke opsat et vial tag, derfor kan auto batch nummer ikke udfyldes",
                ERROR_LEVELS.hint,
              )}
            />
          </Optional>
          <AlertBox error={dateError}/>
          <AlertBox error={formattingError}/>
        </Modal.Body>
        <Modal.Footer>
          <Row style={{width : "100%"}}>
            <Col md={3}>
              <Optional exists={canEdit}>
                <CancelButton order={order}/>
              </Optional>
              <Optional exists={order.status == ORDER_STATUS.RELEASED && !showCorrectAuth}>
                <MarginButton onClick={() => {setShowCorrectAuth(true)}}>Ret ordre</MarginButton>
              </Optional>
            </Col>
            <Col md={{ span : 3, offset : 5}}>
              <Optional exists={order.status == ORDER_STATUS.ORDERED}>
                <MarginButton onClick={acceptOrder}>Accepter ordre</MarginButton>
              </Optional>
              <Optional exists={order.status == ORDER_STATUS.ACCEPTED && !freeing}>
                {freeingButton}
              </Optional>
              <Optional exists={order.status == ORDER_STATUS.ACCEPTED && freeing}>
                <MarginButton onClick={cancelFreeing}>Rediger ordre</MarginButton>
              </Optional>
              <Optional exists={order.status == ORDER_STATUS.RELEASED && freeing}>
                <MarginButton onClick={openInjectionReleasePDF(order)}>Frigivelsecertifikat</MarginButton>
              </Optional>
              <Optional exists={showCorrectAuth}>
                <MarginButton onClick={() => {setShowCorrectAuth(false)}}>Tilbage</MarginButton>
              </Optional>
            </Col>
            <Col md={1}>
              <CloseButton onClick={on_close}/>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    </div>);
}

InjectionModal.propTypes = {
  [PROP_ON_CLOSE] : propTypes.func.isRequired,
  [PROP_MODAL_ORDER] : propTypes.number.isRequired,
}
