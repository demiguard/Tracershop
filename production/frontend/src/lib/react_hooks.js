import React, { useEffect, useState } from "react";

export function useContainerDimensions(ref) {
  const [dimensions, setDimensions] = useState({width : 0, height : 0});

  useEffect(() => {
    function getDims() {
      return {
        width : ref.current.offsetWidth,
        height : ref.current.offsetHeight,
      }
    }

    function handleResize(){
      setDimensions(getDims());
    }

    if(ref.current){
      setDimensions(getDims());

      window.addEventListener('resize', handleResize);
      return () => {window.removeEventListener('resize', handleResize);}
    }
  },  [ref]);

  return dimensions
}