import React from 'react';
import { Row } from 'react-bootstrap'
/**
 * The row of buttons, ensuring different spacing
 */
export function ButtonRow({children=[], maxButtonsPerRow=8, ...rest}){
  if (maxButtonsPerRow < children.length){
    return (<ButtonMultiRow
              buttons={buttons}
              maxButtonsPerRow={maxButtonsPerRow}
              {...rest}
          />);
  }


  const wrappedButtons = [];
  let i = 0;
  for(const buttonJSX of children){
    wrappedButtons.push((
      <Col key = {i + 1} style={{}}>
        {buttonJSX}
      </Col>
    ))
  }

  return (
    <Row>
      {wrappedButtons}
    </Row>
  );
}

function ButtonMultiRow({buttons=[], maxButtonsPerRow=8, ...rest}){
  return (
    <Row></Row>
  );
}