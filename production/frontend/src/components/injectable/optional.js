import React, { Children } from 'react';
import propTypes from 'prop-types';

// WHY THE FUCK DIDN'T I MAKE THIS COMPONENT YEARS AGO?

export function Optional({children, exists=true, alternative=null}){
  if(exists){
    return children;
  } else {
    return alternative;
  }
}

Optional.propTypes = {
  alternative : propTypes.element,
  exists : propTypes.bool.isRequired,
}

export function Options({children, index=0}){
  const options = Children.toArray(children);

  if(options.length < index){
    // you could argue for a throw here
    return null;
  } else {
    return options[index];
  }
}

Options.propTypes = {
  index : propTypes.number.isRequired
}