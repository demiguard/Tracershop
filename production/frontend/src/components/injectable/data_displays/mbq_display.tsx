import React from "react";

type MBqDisplayProps = {
  activity : number
}

export function MBqDisplay({activity} : MBqDisplayProps){
  return `${Math.floor(activity)} MBq`;
}