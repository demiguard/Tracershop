import React, { ComponentProps } from 'react'
import { Col, Form, FormControl, FormControlProps } from 'react-bootstrap';
import { DISPLAY_STATUS } from '~/lib/constants';
import { MBqDisplay } from '../data_displays/mbq_display';
import { setStateToEvent } from '~/lib/state_management';
import { TracershopInputGroup } from './tracershop_input_group';
import { RecoverableError } from '~/lib/error_handling';


type ActivityInputProps = {
  displayStatus : typeof DISPLAY_STATUS[keyof typeof DISPLAY_STATUS],
  displayState : [string, React.Dispatch<React.SetStateAction<string>>],
  error? : string | RecoverableError,
} & Omit<FormControlProps, 'value' | 'onChange'> & React.HTMLAttributes<HTMLDivElement>;

export function ActivityInput({displayStatus, displayState, error="", ...rest}: ActivityInputProps){
  const [displayActivity, setDisplayActivity] = displayState;

  switch(displayStatus){
    case DISPLAY_STATUS.EDITING:
      return (
        <Col style={{ flexShrink : 1 }}>
          <TracershopInputGroup error={error} tail="MBq">
            <FormControl
              {...rest}
              onChange={setStateToEvent(setDisplayActivity)}
              value={displayActivity}
            />
          </TracershopInputGroup>
        </Col>
      );
    default:
      return (
        <Col  {...rest}>
          Bestilt : <MBqDisplay activity={Number(displayActivity)}/>
        </Col>

      )
  }
}