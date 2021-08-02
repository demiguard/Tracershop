import React, {} from "react";

export { renderStatusImage }


function renderStatusImage(status) {
  if (status === 1) return (<img className="statusIcon" src="/static/images/clipboard1.svg"></img>);
  if (status === 2) return (<img className="statusIcon" src="/static/images/clipboard2.svg"></img>);
  if (status === 3) return (<img className="statusIcon" src="/static/images/clipboard3.svg"></img>);
  if (status === 0) return (<img className="statusIcon" src="/static/images/clipboard0.svg"></img>);

  throw "Status not supproted!";
}

