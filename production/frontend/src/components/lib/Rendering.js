import React, {} from "react";

import { noop } from "./utils";

export { renderStatusImage }


function renderStatusImage(status, func) {
  
  const onclickFunc = (func === undefined) ? noop : func
  if (status === 1) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard1.svg"></img>);
  if (status === 2) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard2.svg"></img>);
  if (status === 3) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard3.svg"></img>);
  if (status === 0) return (<img onClick={onclickFunc} className="statusIcon" src="/static/images/clipboard0.svg"></img>);

  throw "Status not supproted!";
}

