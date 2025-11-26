import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react'
import { Button, ButtonProps, Spinner } from 'react-bootstrap'
import { useTracershopState, useWebsocket } from '~/contexts/tracer_shop_context';
import { injectionOrdersFilter } from '~/lib/filters';
import { dateToDateString } from '~/lib/formatting';
import { MARGIN } from '~/lib/styles';
import { StatusButton } from './buttons/status_buttons';

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


export type IdempotentButtonProps = {
  onClick : () => Promise<any>
} & Omit<ButtonProps, "onClick">;

export function IdempotentButton({
  onClick, children, ...rest
} : IdempotentButtonProps){
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

  console.log(rest);

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
      onClick={onClick}
    >
      {buttonMessage}
    </Button>
  );
}

export function SpecialTracerButton({is_active, onClick}){
  const state = useTracershopState();

  const injection_orders = injectionOrdersFilter(state, {
    delivery_date : dateToDateString(state.today)
  })

  const buttonMessage = is_active ? <u>Special</u> : <div>Special</div>;

  return (
    <StatusButton
      orders={injection_orders}
      style={MARGIN.leftRight.px15}
      key="Special"
      onClick={onClick}
    >
      {buttonMessage}
    </StatusButton>
  );
}
