import React, { useState } from "react"
import { Col, Dropdown } from "react-bootstrap";
import { useHover } from "~/effects/use_hover";

export function NavbarSubElement({}){

}


function NavbarElementSingle({children}){
  return <Col style={{
    display : "flex",
    alignItems : "center"
  }}>
    {children}
  </Col>
}

function NavbarElementMulti({children}){
  const [ref, isHovered] = useHover<HTMLDivElement>(150);
  const childrenArray = React.Children.toArray(children);

  const [header_element, ...rest] = childrenArray;
  const mappedElements = rest.map((child, i) =>
    <Dropdown.Item key={i}>{child}</Dropdown.Item>
  )

  return (
    <Col style={{
    display : "flex",
    alignItems : "center",
    padding : "6px 12px",
  }}>
    <Dropdown ref={ref} show={isHovered}>
      <Dropdown.Toggle className="d-flex align-items-center gap-2">
        {header_element}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {mappedElements}
      </Dropdown.Menu>
    </Dropdown>
    </Col>
  )
}


export function NavbarElement({ children }) {
  const numberOfChildren = React.Children.count(children)

  switch (numberOfChildren) {
    case 0:
      throw {error : "NAVBAR ELEMENT DEFINED WITHOUT CHILD ELEMENTS!"};
    case 1:
      return <NavbarElementSingle>{children}</NavbarElementSingle>
    default:
      return <NavbarElementMulti>{children}</NavbarElementMulti>
  }
}