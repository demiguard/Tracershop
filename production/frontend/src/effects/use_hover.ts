import { useEffect, useRef, useState, type RefObject } from 'react'


const DOM_ON_HOVER_KEYWORD = "mouseenter"
const DOM_OFF_HOVER_KEYWORD = "mouseleave"

export function useHover<T extends HTMLElement = HTMLElement>(delay: number): [RefObject<T>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) { return; }

    let timeoutID : ReturnType<typeof setTimeout> | undefined;
    const mouseEnter = () => {
      clearTimeout(timeoutID);
      setIsHovered(true);
    }
    const mouseLeave = () => {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => setIsHovered(false), delay);
    }

    node.addEventListener(DOM_ON_HOVER_KEYWORD, mouseEnter);
    node.addEventListener(DOM_OFF_HOVER_KEYWORD, mouseLeave);

    return () => {
      clearTimeout(timeoutID)
      node.removeEventListener(DOM_ON_HOVER_KEYWORD, mouseEnter);
      node.removeEventListener(DOM_OFF_HOVER_KEYWORD, mouseLeave);
    }

  }, []);


  return [ref, isHovered]
}