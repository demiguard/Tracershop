import React from "react";
import { formatUsername } from "~/lib/formatting";


export function UserDisplay(props){
  const {user, ...rest} = props;
  return <div {...rest}>{formatUsername(user)}</div>;
}
