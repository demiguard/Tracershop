import React, { useEffect, useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'

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


export function IdempotentButton(props){
  const {onClick, children, ...rest} = props;

  const [isHandling, setIsHandling] = useState(false);

  useEffect(() => {
    if(isHandling){
      const onClickRes = onClick();
      if(onClickRes instanceof Promise){
        onClickRes.then(() => {
          setIsHandling(false);
        })
      } else {
        console.error("Idempotent Button didn't return a Promise as it should!")
      }
    }
  }, [isHandling])

  function wrappedOnClick(){
    setIsHandling(true);
  }

  if(isHandling){
    return <Spinner data-testid="idempotent-spinner"></Spinner>
  }

  return <Button onClick={wrappedOnClick} {...rest}>
    {children}
  </Button>
}