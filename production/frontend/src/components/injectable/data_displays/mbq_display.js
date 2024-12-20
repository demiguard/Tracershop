import React from "react";


export function MBqDisplay(props){
  const {activity, ...rest} = props;
  return <div {...rest}>{Math.floor(activity)} MBq</div>;
}