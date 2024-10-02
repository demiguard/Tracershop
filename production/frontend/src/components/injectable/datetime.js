import React from "react";
import { datify } from "~/lib/chronomancy";


export function DateTime({dateLike}){
  const date = datify(dateLike);

  return <div>{date.toLocaleTimeString('da-DK', { hour: "2-digit", minute: "2-digit" })} - {date.toLocaleDateString('da-DK')}</div>
}