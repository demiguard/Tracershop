import React from "react";
import { InputGroup } from "react-bootstrap";
import { Optional } from "~/components/injectable/optional";
import { HoverBox } from "~/components/injectable/hover_box";
import { cssError, cssHintColor, cssWarningColor } from "~/lib/styles";
import { ERROR_LEVELS } from "~/components/injectable/alert_box";
import { RecoverableError } from "~/lib/error_handling";
import  propTypes  from "prop-types";

/**
 *
 * Also for the love of god, do not put complex components in here.
 *
 * @param {*} param0
 * @returns
 */
export function TracershopInputGroup({children, label, error, tail, ...extra_props}) {
  const showLabel = !!label;
  const showTail = !!tail;

  if(error === "" || error === undefined || error.level === ERROR_LEVELS.NO_ERROR){
    return (
      <InputGroup
      style={{
        marginTop : '5px',
        marginBottom : '5px',
      }}
      >
        <Optional exists={showLabel}><InputGroup.Text>{label}</InputGroup.Text></Optional>
          {children}
        <Optional exists={showTail}><InputGroup.Text>{tail}</InputGroup.Text></Optional>
      </InputGroup>
    );
  } else {
    try {
      React.Children.only(children); // Where my error as return values? Heard about booleans?
      children = [children];
    } catch {
      /* istanbul ignore next */
    }

    const style = (() => {
      if(error instanceof RecoverableError){
        if(error.level === ERROR_LEVELS.hint){
          return cssHintColor;
        }
        if(error.level === ERROR_LEVELS.warning){
          return cssWarningColor;
        }
        // NO error is eliminated from initial if statement and error is covered
        // by fallthrough.
      }

      return cssError;
    })()

    const newComps = React.Children.map(children,(child) =>
      React.cloneElement(child, {
        ...child.props,
        style : {...child.props.style, ...style}
      })
    );

    const error_message = error instanceof RecoverableError ? error.message : error;

    return <HoverBox
      {...extra_props}
      Base={
        <InputGroup
          style={{
            marginTop : '5px',
            marginBottom : '5px',
          }}
        >
          <Optional exists={showLabel}><InputGroup.Text>{label}</InputGroup.Text></Optional>
            {newComps}
          <Optional exists={showTail}><InputGroup.Text>{tail}</InputGroup.Text></Optional>
        </InputGroup>
        }
      Hover={<p>{error_message}</p>}
    />;
  }
}
