import React from 'react';
import propTypes from 'prop-types';
import { HoverBox } from '../hover_box';
import { ClickableIcon } from '../icons';

export function Comment({comment}){
  if(comment){
    return <HoverBox
      Base={<ClickableIcon
        src="/static/images/comment.svg"
      />}
      Hover={<div>{comment}</div>}
    />
  }

  return <div></div>
}

Comment.propTypes = {
  comment : propTypes.string
}