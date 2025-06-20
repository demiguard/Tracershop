import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useWebsocket } from '~/contexts/tracer_shop_context';
import { MARGIN } from '~/lib/styles';

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

CloseButton.propTypes = {
  onClick : PropTypes.func.isRequired
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

export function WeeklyViewButton({is_active, onClick}){
  const buttonMessage = is_active ? <u>Uge plan</u> : <div>Uge plan</div>;

  return (
    <Button
      key="week-plan"
      style={MARGIN.leftRight.px15}
      sz="sm"
      onClick={onClick}
    >
      {buttonMessage}
    </Button>
  );
}

export function SpecialTracerButton({is_active, onClick}){
  const buttonMessage = is_active ? <u>Special</u> : <div>Special</div>;

  return (
    <Button
      style={MARGIN.leftRight.px15}
      key="Special"
      sm="sm"
      onClick={onClick}
    >
      {buttonMessage}
    </Button>
  );
}
