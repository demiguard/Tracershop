/**
 * @author Christoffer Vilstrup Jensen
 */
import React from "react";
import { HoverBox } from "../hover_box";
import { cssError } from "~/lib/styles";

export function ErrorInput({error, children}){
  if(error === ""){
    return children;
  }
  try {
    React.Children.only(children); // Where my error as return values? Heard about booleans?
    children = [children];
  } catch {
    /* istanbul ignore next */
  }
  const newComps = React.Children.map(children,(child) =>
    React.cloneElement(child, {
      ...child.props,
      style : {...child.props.style, ...cssError}
    })
  );

  return <HoverBox
    Base={newComps}
    Hover={<p>{error}</p>}
  />;
}
