import React, { Profiler } from "react";

function onRenderCallback(
  id, // the "id" prop of the Profiler tree that has just committed
  phase, // either "mount" or "update"
  actualDuration, // time spent rendering the committed update
  baseDuration, // estimated time to render the entire subtree without memoization
  startTime, // when React began rendering this update
  commitTime, // when React committed this update
){
    console.log(`${id}'s ${phase} phase took ${actualDuration}ms`);
}

export function TracerProfiler({children, profile_id}){
  return (
    <Profiler id={profile_id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}