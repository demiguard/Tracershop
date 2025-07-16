import { useEffect, useRef } from "react";


/** An effect, except it won't run the effect on the first trigger.
 *
 * @param {React.EffectCallback} effect
 * @param {React.DependencyList} deps
 */
export function useUpdatingEffect(effect, deps){
  // We use refs here to prevent rerenders
  const isFirstRender = useRef(true);

  useEffect(() => {
    if(isFirstRender.current){
      isFirstRender.current = false;
      return
    }

    return effect()
  }, deps);
}