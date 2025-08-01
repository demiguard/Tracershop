import React from "react";
import { FormatDateStr } from "~/lib/formatting";

type DateDisplayProps = {
  date : Date
}

export function DateDisplay({date}: DateDisplayProps){
  const year = date.getFullYear();
  const month = FormatDateStr(date.getMonth() + 1);
  const dato = FormatDateStr(date.getDate());

  return `${dato}/${month}/${year}`
}