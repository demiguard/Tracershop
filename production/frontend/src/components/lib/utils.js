export { CompareDates, BooleanMapping }


function CompareDates(d1, d2) {
  //Compares if two date objects refer to the same date
  return d1.getFullYear() == d2.getFullYear() && d1.getMonth() == d2.getMonth() && d1.getDate() == d2.getDate();
}

function BooleanMapping(bool){
  return (bool) ? 1 : 0
}