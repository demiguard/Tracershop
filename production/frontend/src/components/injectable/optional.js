import React from 'react';


// WHY THE FUCK DIDN'T I MAKE THIS COMPONENT YEARS AGO?

export function Optional({children, exists=true, alternative=null}){
  if(exists){
    return children;
  } else {
    return alternative;
  }
}

