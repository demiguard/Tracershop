/** This mostly cannibalizes the code from
 * {@link https://github.com/cht8687/react-hover} into something that i like a
 * bit better, namely a single prop, with two properties.
 */

import React, { useState } from 'react'
import { cssCenter } from '~/lib/constants';

const HOVER_BOX_CSS = {
  maxWidth: '350px',
  backgroundColor: '#FFFFFF',
  padding: '5px',
  zIndex: '999',
  border: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--grey-1)',
};


/**
 * Box that is displayed in a Hover
 */


function Hover({setVisibility, hoverState, children}){
  return(
    <div
      onMouseEnter={() => setVisibility(true)}
      onMouseLeave={() => setVisibility(false)}
      style={{
        ...HOVER_BOX_CSS,
        ...hoverState
      }}
    >
      {children}
    </div>
  );
}

function Trigger({ setVisibility, triggerTestID, children }){
  return (
    <div data-testid={triggerTestID}
      onMouseEnter={() => setVisibility(true)}
      onMouseLeave={() => setVisibility(false)}
      onTouchStart={() => setVisibility(true)}
      onTouchEnd={() => setVisibility(false)}
    >
      {children}
    </div>
  );
}

export function HoverBox (props){
  const styleProps = props.styles !== undefined ? {...props.styles} : {}
  const [hoverState, updateHoverComponentStyle] = useState({
    zIndex : 999,
    ...cssCenter,
    position: 'absolute',
    display: 'none',
    ...styleProps
  })

  function setVisibility (flag) {
    updateHoverComponentStyle(previousState => {
      return {
      ...previousState,
      display : flag ? 'block' : 'none'
    }});
  }

  return (
    <div style={{position : 'relative'}}>
      <Trigger
        triggerTestID={props.triggerTestID}
        setVisibility={setVisibility}
      >
        {props.Base}
      </Trigger>
      <Hover
        hoverState={hoverState}
        setVisibility={setVisibility}
      >
        {props.Hover}
      </Hover>
    </div>
  )
}