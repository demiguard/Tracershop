import React, {useState} from "react";
import { ERROR_LEVELS } from "~/components/injectable/alert_box";

/**
 * Class for grouping error, that tracershop should be able to recover from.
 * This includes incorrect password, incorrect or missing inputs and so forth.
 * It doesn't include:
 *  * Syntax or other programmatic errors
 *  * Missing connection to the server
 */
export class RecoverableError {
  /**
   *
   * @param {string | React.ReactElement | undefined} message
   * @param {ERROR_LEVELS | undefined} level
   */
  constructor(message, level){
    this.message = message ? message : "";
    this.level = level ? level : message ? ERROR_LEVELS.error : ERROR_LEVELS.NO_ERROR;
  }

  is_error(){
    return this.level !== ERROR_LEVELS.NO_ERROR
  }

  [Symbol.toPrimitive](hint){
    return this.message;
  }
}

/**
 * A custom React hook for managing error state that ensures all errors are
 * instances of RecoverableError.
 * This hook follows the same pattern as useState but provides additional
 * type safety and error handling.
 *
 * @returns {[RecoverableError, (arg: Any) => void
 *  ]}
 *   A tuple containing:
 *   - The current error state (always a RecoverableError instance)
  *   - A setter function that accepts either a direct value or an updater function
 */
export function useErrorState(){
  const [error, innerSetError] = useState(new RecoverableError())

  /**
   * Sets the error to the argument:
   *   Falsy - resets the error
   *   Function - similar behavior to react state with function arguments
   *   Truthy - Sets the error to a recoverable error
   * @param {Any} newError
   */
  function setError(newError){
    if(typeof newError === "function"){
      innerSetError(
        (oldError) => {
          const result = newError(oldError);
          return result instanceof RecoverableError ? result : new RecoverableError(result)
        }
      )
    } else {
      const recoverableError = newError instanceof RecoverableError ? newError : new RecoverableError(newError);
      innerSetError(
        recoverableError
      )
    }
  }

  return [error, setError];
}