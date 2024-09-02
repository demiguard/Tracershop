import React from 'react';
import { ClickableIcon } from './icons';


/** Mostly here to ensure that all open / close buttons looks the same */


export function OpenCloseButton({open, setOpen, label}) {
  const openClassName = open ? "" : "";

  return (<ClickableIcon
    src="/static/images/next.svg"
    className={openClassName}
    label={label}
    onClick={() => setOpen(!open)}
  />);
}