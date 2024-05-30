import React, { useEffect, useState } from "react";

function getPixelNumber(pixelString){

  const words = pixelString.split(" ");
  const pixelRegex = /\d+(\.\d+)?px/g // Matches stuff like 0px and 141.13px

  for(const pixelString of words){
    if(!pixelRegex.test(pixelString)){
      continue
    }

    const numberString = pixelString.substring(0, pixelString.length - 2)
    return Number(numberString);
  }
  return 0;
}

export function useContainerDimensions(ref) {
  const [dimensions, setDimensions] = useState({
    width : 0,
    height : 0,
    padding : {
      bottom : 0,
      top : 0,
      left : 0,
      right : 0,
    },
    border : {
      bottom : 0,
      top : 0,
      left : 0,
      right : 0,
    }
  });

  function getDims() {
    if(ref.current === null){
      return dimensions;
    }
    const style = window.getComputedStyle(ref.current);
    return {
      width : ref.current.clientWidth,
      height : ref.current.clientHeight,
      padding : {
        bottom : getPixelNumber(style["paddingBottom"]),
        top : getPixelNumber(style["paddingTop"]),
        right : getPixelNumber(style["paddingRight"]),
        left : getPixelNumber(style["paddingLeft"]),
      },
      border : {
        bottom : getPixelNumber(style["borderBottom"]),
        top : getPixelNumber(style["borderTop"]),
        right : getPixelNumber(style["borderRight"]),
        left : getPixelNumber(style["borderLeft"]),
      }
    }
  }

  function handleResize(){
    setDimensions(getDims());
  }

  useEffect(() => {
    if(ref.current){
      setTimeout(() => {
        setDimensions(getDims());
      }, 42);

      window.addEventListener('resize', handleResize);
      return () => {window.removeEventListener('resize', handleResize);}
    }
  },  [ref.current]);

  return dimensions
}