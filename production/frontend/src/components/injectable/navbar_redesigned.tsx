import React from "react";
import { Container, Navbar, NavbarProps } from "react-bootstrap";
import { COLORS } from "~/lib/constants";
import { PADDING } from "~/lib/styles";

type NavbarRedesignedProps = {
  children? : React.ReactNode
}

export function NavbarRedesigned({children} : NavbarProps){
  return (
  <Navbar style={{
    backgroundColor : COLORS.secondaryColor3,
    ...PADDING.lr.px25
  }}>
      <Navbar.Brand>
        <img height={"63px"} src="/static/images/logo.png"/>
      </Navbar.Brand>
      {children}

  </Navbar>)
}