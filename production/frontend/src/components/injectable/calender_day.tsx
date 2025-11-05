import React, { useCallback } from 'react'
import { StaticCanvas } from './canvas'
import { COLORS, ORDER_STATUS } from '~/lib/constants'
import { OrderColor } from '~/contexts/calender_color_map'


type CalenderDayProps = {
  day : number
  orderColor : OrderColor
  onClick? : React.MouseEventHandler
} & React.ComponentPropsWithoutRef<'canvas'>

function status_to_color(status : number){
  switch(status) {
    case ORDER_STATUS.AVAILABLE:
      return COLORS.grey1;
    case ORDER_STATUS.ORDERED:
      return COLORS.red1;
    case ORDER_STATUS.ACCEPTED:
      return COLORS.yellow1;
    case ORDER_STATUS.RELEASED:
      return COLORS.green1;
    default:
      return COLORS.visual_error;
  }
}

export function CalenderDay({
    day,
    orderColor,
    ...rest
  } : CalenderDayProps
){
  if(day === 20){
    console.log("Rerendering Calender Day: ", orderColor)
  }

  function draw (context: CanvasRenderingContext2D, frame_number: number) {
    const center_x = context.canvas.width / 2;
    const center_y = context.canvas.height / 2;
    const outer_radius = 0.95 * Math.min(center_x, center_y);
    const inner_radius = 0.60 * Math.min(center_x, center_y);

    const degrees = [-Math.PI / 2, Math.PI / 2];

    context.beginPath(); // Draw Injection Outer Circle
    context.fillStyle = status_to_color(orderColor.getInjectionCode());
    context.arc(center_x, center_y, outer_radius, degrees[0], degrees[1]);
    context.fill();
    context.closePath();

    context.beginPath(); // Draw Isotope Outer Circle
    context.fillStyle = status_to_color(orderColor.getIsotopeCode());
    context.arc(center_x, center_y, outer_radius, degrees[1], degrees[0]);
    context.fill();
    context.closePath();


    // Draw inner Circle - Activity Orders
    context.beginPath();
    context.fillStyle = status_to_color(orderColor.getActivityCode());
    context.arc(center_x, center_y, inner_radius, degrees[0], degrees[0] + 2 * Math.PI);
    context.fill();
    context.closePath();

    const days_text = String(day)

    context.font = "20px Maribook";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000000";
    context.fillText(days_text, center_x, center_y);
  }

  return <StaticCanvas {...rest} draw={draw} />;
}
