import React from 'react';
import { ClickableIcon } from './icons';
import SiteStyles from "/src/css/Site.module.css"

/** Mostly here to ensure that all open / close buttons looks the same */


export function OpenCloseButton({open, setOpen, label}) {
  const openClassName = open ? SiteStyles.rotated : "";

  return (<ClickableIcon
    src="/static/images/next.svg"
    className={openClassName}
    label={label}
    onClick={() => setOpen(!open)}
  />);
}