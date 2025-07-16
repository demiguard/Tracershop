import { useEffect } from "react";

export function useOnEnter(calledOnEnter){
  /** The actual function that is called by the
   *
   * @param {KeyboardEvent} event
   */
  function handler(event){
    if(event.key === "Enter"){
      calledOnEnter()
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler)
    }
  } , [])

}