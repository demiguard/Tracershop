import React from 'react'
import { Button, ButtonProps } from 'react-bootstrap';
import { toggleState } from '~/lib/state_management';
import { ReactState } from '~/lib/types';

type ReleaseButtonProps = {
  authenticationState : ReactState<boolean>
  sideEffect? : (newValue: boolean) => void
  canFree? : boolean
} & Omit<ButtonProps, 'onClick' | 'disabled'>

export function ReleaseButton({
  authenticationState,
  sideEffect,
  canFree=true,
  ...rest
} : ReleaseButtonProps){

  const [isAuthenticating, setIsAuthenticating] = authenticationState;

  if (isAuthenticating){
    return <Button onClick={toggleState(setIsAuthenticating, sideEffect)} {...rest}>Redigering</Button>
  } else {
    return <Button
              disabled={!canFree}
              onClick={toggleState(setIsAuthenticating, sideEffect)}
              {...rest}
           >Frigiv</Button>
  }
}