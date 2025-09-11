import React from 'react'
import { Image as BTImage } from 'react-bootstrap'
import { SVG } from './svg'


type ImageProps = {
  src : string,
  beforeInjection : (svg: SVGSVGElement) => void
  [key: string] : any
}

export function Image(props: ImageProps){
  const {src, beforeInjection, ...rest} = props

  if(src.endsWith('.svg')){

    return <SVG {...props}/>
  } else {
    // remove the BeforeInjection
    return <BTImage src={src} {...rest}/>
  }
}
