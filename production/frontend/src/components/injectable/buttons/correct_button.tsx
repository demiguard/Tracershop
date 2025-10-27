import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { OrderCollection } from "~/lib/data_structures/order_collection";
import { Authenticate } from "../authenticate";
import { useErrorState } from "~/lib/error_handling";
import { useWebsocket } from "~/contexts/tracer_shop_context";
import { AUTH_PASSWORD, AUTH_USERNAME, DATA_AUTH, WEBSOCKET_DATA } from "~/lib/shared_constants";
import { getOrderType } from "~/lib/types";
import { toggleState } from "~/lib/state_management";
import { Optional } from "../optional";

type CorrectButtonProps = {
  collection : OrderCollection
}

export function CorrectButton({ collection } : CorrectButtonProps) {
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [authenticateError, setAuthenticateError] = useErrorState();

  const buttonText = isCorrecting ? "Tilbage" : "Ret ordre"

  const websocket = useWebsocket();

  function authenticate(username : string, password: string){
    const dataObject = {
      [getOrderType({collection : collection})] : collection.orders
    }
    if(collection.getVialType() !== ""){
      dataObject[collection.getVialType()] = collection.getVials();
    }

    websocket.send({
      [DATA_AUTH] : {
        [AUTH_USERNAME] : username,
        [AUTH_PASSWORD] : password,
      },
      [WEBSOCKET_DATA] : dataObject
    });
  }

  return (
    <div>
      <Modal
        style={{
          paddingTop : "25px",
          fontFamily : 'mariBook',
          background: "rgba(0, 0, 0, 0.5)", /* Semi-transparent black overlay */
        }}
        show={isCorrecting}
        onHide={() => {
          setIsCorrecting(false);
        }}
      >
        <Modal.Header>
          Ret ordre
        </Modal.Header>
        <Modal.Body>
          <Authenticate
            headerMessage={"Ret ordre"}
            authenticate={authenticate}
            setError={setAuthenticateError}
            error={authenticateError}
            login_message="Skriv under"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={toggleState(setIsCorrecting)}>Tilbage</Button>
        </Modal.Footer>
      </Modal>
      <Optional exists={!isCorrecting}>
        <Button onClick={toggleState(setIsCorrecting)} >{buttonText}</Button>
      </Optional>
    </div>
  );
}
