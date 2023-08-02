import React, { Component, useState } from 'react'
import propTypes, { element } from 'prop-types'
import styles from "../../css/Site.module.css"
import { Container } from 'react-bootstrap'

export { HoverBox }
/**
 * Box that is displayed in a Hover
 */


function Hover(props){
  const { setVisibility, hoverState } = props;

  return(
    <div
      className={styles.HoverBox}
      onMouseOver={() => setVisibility(true)}
      onMouseOut={() => setVisibility(false)}
      style={hoverState}
    >
      {props.children}
    </div>
  )
}

function Trigger(props){
  const { setVisibility } = props
  // css import?
  return(
    <Container
      onMouseOver={() => setVisibility(true)}
      onMouseOut={() => setVisibility(false)}
      onTouchStart={() => setVisibility(true)}
      onTouchEnd={() => setVisibility(false)}
    >
      {props.children}
    </Container>
  )
}

function HoverBox (props){
  const styleProps = props.styles !== undefined ? {...props.styles} : {}
  const [hoverState, updateHoverComponentStyle] = useState({
    display: 'none',
    position: 'absolute',
    zIndex : 999,
    ...styleProps
  })

  function setVisibility (flag) {
    let updatedStyles = null
    if (flag) {
      updatedStyles = { ...hoverState, display: 'block' }
    } else {
      updatedStyles = { ...hoverState, display: 'none' }
    }
    updateHoverComponentStyle(updatedStyles)
  }

  return (
    <div>
      <Trigger
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