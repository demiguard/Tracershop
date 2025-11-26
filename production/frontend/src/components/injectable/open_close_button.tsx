import React, { useState } from 'react';
import { ClickableIcon } from './icons';
import styled from 'styled-components';
import { rotation } from '~/lib/styles';

/** Mostly here to ensure that all open / close buttons looks the same */
const animationSpeedMS = 375;


const CWRotatingDiv = styled.div`
  animation : ${rotation.cw.deg90} ${animationSpeedMS / 1000}s linear;
  animation-iteration-count: 1
`

const CCWRotatingDiv = styled.div`
  animation : ${rotation.ccw.deg90} ${animationSpeedMS / 1000}s linear;
  animation-iteration-count: 1
`

const RotatedDiv = styled.div`
  transform : rotate(90deg)
`

interface OpenCloseButtonArgs {
  open : boolean,
  setOpen : React.Dispatch<React.SetStateAction<boolean>>
  label? : string,
}

export function OpenCloseButton({open, setOpen, ...rest}: OpenCloseButtonArgs) {
  const [rotated, setRotated] = useState(open);
  const [rotating, setRotating] = useState(false);

  function rotateClockwise(){
    setRotating(true);
    setTimeout(() => {
      setRotating(false);
      setRotated(true);
    }, animationSpeedMS)
  }

  function rotateCounterClockwise(){
    setRotating(true);
    setTimeout(() => {
      setRotating(false);
      setRotated(false);
    }, animationSpeedMS);
  }

  function rotate(){
    if(rotated){
        rotateCounterClockwise();
      } else {
        rotateClockwise();
      }

      setOpen((open) => !open);
  }

  const button = <ClickableIcon
    {...rest}
    src="/static/images/next.svg"
    onClick={rotate}
  />

  // This is a fucking mess!
  if(rotating){
    if(rotated){
      return (<CCWRotatingDiv>
              {button}
           </CCWRotatingDiv>);
    } else {
      return (<CWRotatingDiv>
              {button}
           </CWRotatingDiv>);
    }
  }

  if(rotated){
    return (<RotatedDiv>
      {button}
    </RotatedDiv>);
  } else {
    return button;
  }
}