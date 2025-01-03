import React, { useEffect, useRef, useState, useMemo } from "react";
import { useOverflow } from "~/effects/overflow";
import { clamp } from "~/lib/utils";

const scrollSpeed = 100;


export function TestScrollableSite({rowHeight = 40}){
  // Reference to the div that
  const overflowDivRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [heightOffset, setHeightOffset] = useState(0);

  const data = useMemo(() => {
    console.log("Creating data!")

    const out = []
    for(let i = 0; i < 1000; i++){
      out.push(<tr style={{height : rowHeight}} key={i}>
        <td>{i}</td>
        <td>Row {i}</td>
      </tr>);
    }
    return out;
  }, []);

  useEffect(() => {
    if(overflowDivRef.current){
      const { y } = overflowDivRef.current.getBoundingClientRect();
      setHeightOffset(y);
    }
  },[overflowDivRef.current]);

    // Calculate visible rows based on scroll position
  const virtualizedData = useMemo(() => {
    if (!overflowDivRef.current){
      return [];
    }

    const containerHeight = overflowDivRef.current.clientHeight;
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const startIndex = clamp(Math.floor(scrollOffset / rowHeight), 0, data.length - visibleRowCount);
    const endIndex = Math.min(startIndex + visibleRowCount + 2, data.length);
    return data.slice(startIndex, endIndex);
  }, [overflowDivRef.current, data, scrollOffset, rowHeight]);

  const contentHeight = data.length * rowHeight;


  function test_function(event){
    setScrollOffset((oldOffset) => clamp(oldOffset + event.deltaY, 0, contentHeight));
  }

  useEffect(() => {
    window.addEventListener('wheel', test_function);

    return () => {
      window.removeEventListener('wheel', test_function);
    }
  }, []);

  const height = `calc(100vh - ${heightOffset}px)`;

  return (
  <div
    style={{
      height : height,
      overflow : "auto"
    }}
    ref={overflowDivRef}
  >
    <table>
      {scrollOffset <= 100 ?
      <thead>
          <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead> : <thead/>}

      <tbody>
        {virtualizedData}
      </tbody>
    </table>
  </div>);
}