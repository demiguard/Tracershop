import React, { useState } from "react";
import { FormControl, Modal } from "react-bootstrap";
import { ERROR_LEVELS } from "~/components/injectable/alert_box";
import { Authenticate } from "~/components/injectable/authenticate";
import { CloseButton } from "~/components/injectable/buttons";
import { TracershopInputGroup } from "~/components/injectable/inputs/tracershop_input_group";
import { useWebsocket } from "~/contexts/tracer_shop_context";
import { InjectionOrder } from "~/dataclasses/dataclasses";
import { ORDER_STATUS } from "~/lib/constants";
import { RecoverableError, useErrorState } from "~/lib/error_handling";
import { AUTH_IS_AUTHENTICATED, WEBSOCKET_DATA, WEBSOCKET_DATA_ID, WEBSOCKET_MESSAGE_TYPE } from "~/lib/shared_constants";
import { setStateToEvent } from "~/lib/state_management";
import { parseBatchNumberInput } from "~/lib/user_input";
import { getId } from "~/lib/utils";

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



  const [loginError, setLoginError] = useErrorState();
  const [batchNumber, setBatchNumber] = useState("");
  const [batchNumberError, setBatchNumberError] = useErrorState()

  const to_be_freed = orders.filter(
    inj_order => inj_order.status === ORDER_STATUS.ACCEPTED && selected.has(inj_order.id)
  );

  const to_be_freed_id = getId(to_be_freed);

  function authenticate(username, password){
    const [validBatchNumber, formattedBatchNumber] = parseBatchNumberInput(batchNumber, 'Lot nummeret')
    if(!validBatchNumber){
      setBatchNumberError("batchNumberet er ikke formatteret korrekt.")
      return Promise.resolve();
    }

    return websocket.send({
      [WEBSOCKET_DATA] : formattedBatchNumber,
      [WEBSOCKET_MESSAGE_TYPE] : WEBSOCKET_MESSAGE_RELEASE_MULTI,
      [WEBSOCKET_DATA_ID] : to_be_freed_id
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

  return (
    <Modal show={true} size="lg" onHide={on_close}>
      <Modal.Header>
        Frigiv Flere ordre
      </Modal.Header>
      <Row>
        <Col xs={6}>
          <TracershopInputGroup error={batchNumberError}>
            <FormControl value={batchNumber} onChange={setStateToEvent(setBatchNumber)}/>
          </TracershopInputGroup>
        </Col>
        <Col xs={6}>
          <Authenticate
            authenticate={authenticate}
            headerMessage={"Frigiv ordre"}
            error={loginError}
            setLoginError={setLoginError}
            buttonMessage={"Frigiv ordre"}
            fit_in={true}
          />
        </Col>
      </Row>


      <Modal.Footer>
        <CloseButton></CloseButton>
      </Modal.Footer>
    </Modal>

  )
}