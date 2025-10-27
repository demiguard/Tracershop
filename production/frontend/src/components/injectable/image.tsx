import React from 'react'
import { Image as BTImage, ImageProps as BTImageProps } from 'react-bootstrap'
import { SVG } from './svg'


type ImageProps = {
  src : string,
  beforeInjection : (svg: SVGSVGElement) => void
  [key: string] : any
} & BTImageProps;

export function Image(props: ImageProps){
  const {src, beforeInjection, ...rest} = props

  if(src.endsWith('.svg')){
    //@ts-ignore
    return <SVG {...props} aria-label={`SVG-${src}`}/>
  } else {
    // remove the BeforeInjection
    return <BTImage src={src} {...rest}/>
  }
}
