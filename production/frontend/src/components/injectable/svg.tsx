import React from "react";
import { ReactSVG } from "react-svg";


type SVGProps = {
  src : string,
  height? : Number,
  width? : Number
  beforeInjection? : (svg: SVGSVGElement) => void
}

export function SVG({src, beforeInjection, height, width, ...rest}: SVGProps){
  if(!(src.endsWith('.svg'))){
    throw `ERROR: An SVG was created without a path to svg: ${src}?`
  }

  function injectedBeforeInjection (svg:SVGSVGElement){
    if(width !== undefined){
      svg.setAttribute('width', `${width}`)
    }

    if(height !== undefined){
      svg.setAttribute('height', `${height}`)
    }

    if(beforeInjection !== undefined){
      beforeInjection(svg);
    }
  }



  return <ReactSVG
    src={src}
    beforeInjection={injectedBeforeInjection}
    {...rest}
  />
}