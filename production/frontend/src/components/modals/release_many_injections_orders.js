import React, { useState } from "react";
import { Col, Container, FormControl, FormLabel, Modal, Row } from "react-bootstrap";
import { AlertBox, ERROR_LEVELS } from "~/components/injectable/alert_box";
import { Authenticate } from "~/components/injectable/authenticate";
import { CloseButton } from "~/components/injectable/buttons";
import { EndpointDisplay } from "~/components/injectable/data_displays/endpoint";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { useTracershopState, useWebsocket } from "~/contexts/tracer_shop_context";
import { InjectionOrder, Tracer } from "~/dataclasses/dataclasses";
import { ORDER_STATUS, TRACER_TYPE } from "~/lib/constants";
import { RecoverableError, useErrorState } from "~/lib/error_handling";
import { FormatDateStr } from "~/lib/formatting";
import { AUTH_IS_AUTHENTICATED, AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, TRACER_USAGE, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_RELEASE_MULTI, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { setStateToEvent } from "~/lib/state_management";
import { FONT, MARGIN, PADDING } from "~/lib/styles";
import { parseBatchNumberInput } from "~/lib/user_input";
import { compareDates, getId } from "~/lib/utils";

/**
 *
 * @param {{
 *  injection_order : InjectionOrder
 * }} param0
 */
export function InjectionOrderRow({injection_order}){
  const state = useTracershopState();

  return (
    <Row data-testid={`release-injection-${injection_order.id}`}>
      <Col><EndpointDisplay endpoint={injection_order.endpoint}/></Col>
      <Col>{injection_order.delivery_time}</Col>
      <Col>{injection_order.injections}</Col>
    </Row>
  )
}


/**
 *
 * @param {{
 *   orders : Array<InjectionOrder>,
 *   selected : Set<Number>,
 *   on_close : CallableFunction,
 * }} param
 * @returns
 */
export function ReleaseManyInjectionOrdersModal({orders, on_close, selected}){
  const websocket = useWebsocket();
  const state = useTracershopState();

  const to_be_freed = orders.filter(
    inj_order => inj_order.status === ORDER_STATUS.ACCEPTED && selected.has(inj_order.id)
  );

  const tracer = (() => {
    for(const injection_order of to_be_freed){
      const tracer = state.tracer.get(injection_order.tracer);
      if(tracer){
        return tracer
      }
    }

    return new Tracer(
      -1,
      "Ukendt tracer",
      "Hvordan er det lykkes dig at finde dette",
      -1,
      TRACER_TYPE.DOSE,
      "",
      false,
      false
    )
  })();

  const vial_tag = (() => {
    if(!tracer.vial_tag){ return ""; }
    const ys = String(state.today.getFullYear()).substring(2,4);
    const ms = FormatDateStr(state.today.getMonth() + 1);
    const ds = FormatDateStr(state.today.getDate());

    return `${tracer.vial_tag}-${ys}${ms}${ds}-1`;
  })();

  const displayFreedError = !compareDates(state.today, new Date()) ?
    new RecoverableError(
      "Du er i gang med at frigive til en anden dato end i dag!",
      ERROR_LEVELS.warning)
  : new RecoverableError();

  const vialTagHint = vial_tag === "" ?
    new RecoverableError(
      `Sporestoffet ${tracer.shortname} har ikke nogen hætteglas kode`,
      ERROR_LEVELS.hint)
  : new RecoverableError();

  const [loginError, setLoginError] = useErrorState();
  const [batchNumber, setBatchNumber] = useState(vial_tag);
  const [batchNumberError, setBatchNumberError] = useErrorState();

  function authenticate(username, password){
    const to_be_freed_id = to_be_freed.map(getId);
    const [validBatchNumber, formattedBatchNumber] = parseBatchNumberInput(batchNumber, 'Lot nummeret')
    if(!validBatchNumber){
      setBatchNumberError("batchNumberet er ikke formatteret korrekt.")
      return Promise.resolve();
    }

    return websocket.send({
      [WEBSOCKET_DATA] : formattedBatchNumber,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_RELEASE_MULTI,
      [WEBSOCKET_DATA_ID] : to_be_freed_id,
      [DATA_AUTH] : {
        [AUTH_USERNAME] : username,
        [AUTH_PASSWORD] : password
      },
    }).then((data) => {
      if(data[AUTH_IS_AUTHENTICATED]){
        on_close();
      } else {
        setLoginError(new RecoverableError(
          "Forkert Kodeord", ERROR_LEVELS.error
        ));
      }
    });
  }

  const renderedInjectionOrders = to_be_freed.map((inj) => <InjectionOrderRow injection_order={inj} key={inj.id}/> )

  return (
    <Modal data-testid="release_many_injections" show={true} size="lg" onHide={on_close} style={FONT.light}>
      <Modal.Header>
        Frigiv Flere ordre
      </Modal.Header>
      <Container style={{...PADDING.all.px25}}>
        <Row>
          <Col xs={6}>
            <Row>
              <TracershopInputGroup error={batchNumberError} label="Fælles batch nummer">
                <FormControl data-testid="batch" value={batchNumber} onChange={setStateToEvent(setBatchNumber)}/>
              </TracershopInputGroup>
            </Row>
            <Row>
              <Col><strong>Destination</strong></Col>
              <Col><strong>Bestillings tid</strong></Col>
              <Col><strong>Injektioner</strong></Col>
            </Row>
            <hr style={MARGIN.all.px0}></hr>
            { renderedInjectionOrders }
          </Col>
          <Col xs={6}>
            <Authenticate
              authenticate={authenticate}
              headerMessage={"Frigiv ordre"}
              error={loginError}
              setLoginError={setLoginError}
              buttonMessage={"Frigiv ordre"}
              fit_in={false}
              />
          </Col>
        </Row>
        <Row style={{...MARGIN.all.px0, ...PADDING.all.px25}}>
          <AlertBox error={displayFreedError} />
          <AlertBox error={vialTagHint} />
        </Row>
      </Container>
      <Modal.Footer>
        <CloseButton></CloseButton>
      </Modal.Footer>
    </Modal>
  );
}