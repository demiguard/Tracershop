import React from 'react'
import { DAYS } from '~/lib/constants';
import { Capitalize } from '~/lib/formatting'

export function DayDisplay({day, capitalize=false}){
  const dayName = ((day) =>{
    switch (day){
      case DAYS.MONDAY:
        return "mandag";
      case DAYS.TUESDAY:
        return "tirsdag";
      case DAYS.WENDSDAY:
        return "onsdag";
      case DAYS.THURSDAY:
        return "torsdag";
      case DAYS.FRIDAY:
        return "fredag";
      case DAYS.SATURDAY:
        return "lørdag";
      case DAYS.SUNDAY:
        return "søndag";
      default:
        return "";
    }
  })(day)

  return capitalize ? Capitalize(dayName) : dayName;

}