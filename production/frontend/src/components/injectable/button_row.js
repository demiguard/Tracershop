import React from 'react';
import { Row, Col } from 'react-bootstrap'
import { JUSTIFY } from '~/lib/styles';
/**
 * The row of buttons, ensuring different spacing
 */
export function ButtonRow({children=[], before_c_buttons=[], maxButtonsPerRow=8, style={}, ...rest}){
  if (maxButtonsPerRow < children.length){
    return (<ButtonMultiRow
              buttons={buttons}
              maxButtonsPerRow={maxButtonsPerRow}
              {...rest}
          />);
  }

  const buttons_to_be_rendered = [...before_c_buttons,...children]


  const wrappedButtons = [];
  let i = 0;
  for(const buttonJSX of buttons_to_be_rendered){
    wrappedButtons.push((
      <div key = {i + 1} style={{
        flexBasis : "min-content",
        flexGrow : 0,
        flexShrink : 0,
        whiteSpace : "nowrap"
      }}>
        {buttonJSX}
      </div>
    ));
    i++;
  }

  const RowStyle = {...JUSTIFY.left , ...style} ;

  return (
    <Row style={RowStyle} {...rest}>
      {wrappedButtons}
    </Row>
  );
}

function ButtonMultiRow({buttons=[], maxButtonsPerRow=8, ...rest}){
  return (
    <Row></Row>
  );
}