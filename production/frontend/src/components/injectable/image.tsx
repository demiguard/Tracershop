import React from 'react'
import { Image as BTImage } from 'react-bootstrap'
import { ReactSVG } from 'react-svg'


type ImageProps = {
  src : string,
  beforeInjection : (svg: SVGSVGElement) => undefined
  [key: string] : any
}

export function Image(props: ImageProps){
  const {src} = props

  if(src.endsWith('.svg')){
    return <ReactSVG {...props}/>
  } else {
    return <BTImage {...props}/>
  }
}
