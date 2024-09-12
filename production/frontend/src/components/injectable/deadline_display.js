import React, { useState } from 'react'
import { useTracershopState } from '~/components/tracer_shop_context';
import { TimeStamp, calculateDeadline, compareTimeStamp, sameDate } from '~/lib/chronomancy';
import { renderDateTime } from '~/lib/formatting';


export function DeadlineDisplay(props){
  if (props.deadline === undefined){
    return <div></div>;
  }
  const state = useTracershopState();

  const {deadline, deadline_name: deadlineName, ...rest} = props;

  const [clockDateTime, setClockDateTime] = useState(new Date())

  setInterval(() => {
    setClockDateTime(new Date());
  }, 1000);

  const deadlineDateTime = calculateDeadline(deadline, state.today);

  if (deadlineDateTime < clockDateTime){
    return <div {...rest}>Deadlinen for {deadlineName} er udløbet</div>;
  }

  const deadline_string = (() => {
    if (sameDate(deadlineDateTime, clockDateTime)){
      const deadlineTimeStamp = new TimeStamp(deadlineDateTime);
      const currentTimeStamp = new TimeStamp(clockDateTime);

      const timeDifference = compareTimeStamp(deadlineTimeStamp,currentTimeStamp);
      // Consider to move this to string method on timestramp
      return ` om ${timeDifference.toDisplayString()}`
    } else {
      return renderDateTime(deadlineDateTime);
    }
  })()

  return <div {...rest}>Deadlinen for {deadlineName} udløber {deadline_string}</div>
}