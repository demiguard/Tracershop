import React from "react";
import { InputGroup } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { HoverBox } from "~/components/injectable/hover_box";
import { cssError } from "~/lib/constants";


export function TracershopInputGroup({children, label, error, tail}) {
  if(error === "" || error === undefined){
    return (
      <InputGroup
      style={{
        marginTop : '5px',
        marginBottom : '5px',
      }}
      >
      <Optional exists={label !== undefined}><InputGroup.Text>{label}</InputGroup.Text></Optional>
        {children}
      <Optional exists={tail !== undefined}><InputGroup.Text>{tail}</InputGroup.Text></Optional>
      </InputGroup>
    );
  } else {
    try {
      React.Children.only(children); // Where my error as return values? Heard about booleans?
      children = [children];
    } catch {
      /* istanbul ignore next */
    }
    const newComps = React.Children.map(children,(child) =>
      React.cloneElement(child, {
        ...child.props,
        style : {...child.props.style, ...cssError}
      })
    );

    return <HoverBox
      Base={
        <InputGroup
          style={{
            marginTop : '5px',
            marginBottom : '5px',
          }}
        >
          <Optional exists={label !== undefined}><InputGroup.Text>{label}</InputGroup.Text></Optional>
            {newComps}
          <Optional exists={tail !== undefined}><InputGroup.Text>{tail}</InputGroup.Text></Optional>
        </InputGroup>
        }
      Hover={<p>{error}</p>}
    />;
  }
}