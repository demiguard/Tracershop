import React from "react";



type CalenderIcon2CProps = {
  height : number,
  width : number,
  dayNumber : number
  innerColor : string
  outerColor : string
}

export function CalenderIcon2C(
  props : CalenderIcon2CProps
){
  const {height, width, dayNumber, outerColor, innerColor} = props

  return <svg
    height={height}
    width={width}
    viewBox="0 0 200 200"
    xmlnsXlink="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="100" r="95" fill={outerColor} stroke={outerColor} stroke-width="2"/>
    <circle cx="100" cy="100" r="45" fill={innerColor} stroke={innerColor} stroke-width="2"/>
    <text x="100" y="110" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#333">{dayNumber}</text>
  </svg>
}
