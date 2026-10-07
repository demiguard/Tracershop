import { useEffect } from "react";

const DOM_KEYPRESS_KEY = "keypress"

export function useOnEnter(calledOnEnter, deps=[]){
  /** The actual function that is called by the
   *
   * Remember to
   *
   * @param {KeyboardEvent} event
   */
  function handler(event){
    if(event.key === "Enter"){
      calledOnEnter()
    }
  }

  useEffect(() => {
    document.addEventListener(DOM_KEYPRESS_KEY, handler);
    return () => {
      document.removeEventListener(DOM_KEYPRESS_KEY, handler)
    }
  } , deps)

}