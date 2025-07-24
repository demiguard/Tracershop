/** A Modal wrapper for the Calculator, to be called when a calculator is need
 * Outside of a modal area
 */

import React from "react";
import { Modal } from "react-bootstrap";
import { PROP_ACTIVE_DATE, PROP_ACTIVE_TRACER, PROP_COMMIT, PROP_ON_CLOSE } from "../../lib/constants";
import { DATA_ISOTOPE } from "~/lib/shared_constants"
import { Calculator } from "../injectable/calculator";

/**
 *
 * @param {Object} props
 * @param {on_close}
 * @returns
 */

export function CalculatorModal({
  on_close, isotopes, active_tracer, active_date, commit
}){
  return (<Modal
    show={true}
    onHide={on_close}
  >
    <Modal.Body>
      <Calculator
        cancel={on_close}
        isotopes={isotopes}
        tracer={active_tracer}
        productionTime={active_date /* I am sorry but wtf naming? */}
        commit={commit}
      />
    </Modal.Body>
  </Modal>);
  }
