import React from "react";

export function FlexMinimizer(props){
  const {children, ...rest} = props;

  return (
    <div style={{
      display : "flex",
      flexGrow : "0",
      flexShrink : "1",
      flexBasis : "0%"
    }} {...rest}>
      {children}
    </div>
  );
}
