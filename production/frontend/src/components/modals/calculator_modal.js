/** A Modal wrapper for the Calculator, to be called when a calculator is need
 * Outside of a modal area
 */

import React from "react";
import { Modal, ModalBody } from "react-bootstrap";
import { JSON_ISOTOPE, PROP_ACTIVE_DATE, PROP_ACTIVE_TIME_SLOTS, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE } from "../../lib/constants";
import { CloseButton } from "../injectable/buttons";
import { Calculator } from "../injectable/calculator";

export function CalculatorModal(props){
  return (<Modal
    show={true}
    onHide={props[PROP_ON_CLOSE]}
  >
    <Modal.Body>
      <Calculator
        cancel={props[PROP_ON_CLOSE]}
        isotopes={props[JSON_ISOTOPE]}
        tracer={props[PROP_ACTIVE_TRACER]}
        productionTime={props[PROP_ACTIVE_DATE]}
        commit={props[PROP_COMMIT]}
      />
    </Modal.Body>
  </Modal>);
  }

