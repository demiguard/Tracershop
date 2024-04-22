import React from "react";

export function RelativeAnchor(props){
  const {children, propStyle, ...rest} = props;


  return <div style={{
    ...propStyle,
    height : "0px",
    width : "0px",
    position : "absolute"
  }}

  {...rest}>
    {children}
  </div>
}