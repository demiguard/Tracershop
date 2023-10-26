import React from 'react'
import { Button } from 'react-bootstrap'

export {MarginButton, CloseButton}

function MarginButton (props) {
    const newProps = {...props}

    if ("style" in props){
      newProps["style"].marginLeft = "10px";
      newProps["style"].marginRight = "10px";
    } else {
      newProps["style"] = {
        marginLeft : "10px",
        marginRight : "10px",
      }
    }

    return (<Button {...newProps}>{props.children}</Button>)

}

function CloseButton (props) {
  return (<MarginButton {...props}>Luk</MarginButton>);
}
