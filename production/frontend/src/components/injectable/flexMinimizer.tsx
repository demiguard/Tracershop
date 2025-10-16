import React from "react";



export function FlexMinimizer(props : React.HTMLAttributes<HTMLDivElement>){
  const {children, style, ...rest} = props;

  const newStyle = {
    display : "flex",
    flexGrow : "0",
    flexShrink : "1",
    flexBasis : "0%"
  }

  return (
    <div style={newStyle} {...rest}>
      {children}
    </div>
  );
}
