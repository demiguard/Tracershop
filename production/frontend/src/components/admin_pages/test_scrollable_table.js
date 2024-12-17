import React, { useEffect, useRef, useState, useMemo } from "react";
import { useOverflow } from "~/effects/overflow";


export function TestScrollableSite({rowHeight = 40}){
  const divRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [heightOffset, setHeightOffset] = useState(0);

  const data = ((iMax) => {
    const out = []
    for(let i = 0; i < iMax; i++){
      out.push(<tr style={{height : rowHeight}} key={i}>
        <td>{i}</td>
        <td>Row {i}</td>
      </tr>)
    }

    return out;
  })(1000);

  useEffect(() => {
    if(divRef.current){
      console.log("Updating height!")
      const { y } = divRef.current.getBoundingClientRect();

      setHeightOffset(y);
    }
  },[divRef.current])

    // Calculate visible rows based on scroll position
  const virtualizedData = useMemo(() => {
    const containerRef = divRef;
    if (!containerRef.current) return [];

    const containerHeight = containerRef.current.clientHeight;
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const startIndex = Math.floor(scrollOffset / rowHeight);
    const endIndex = Math.min(startIndex + visibleRowCount + 2, data.length);

    return data.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      originalIndex: startIndex + index
    }));
  }, [data, scrollOffset, rowHeight]);



  function scrollTrigger(event){
    if(divRef.current !== null){
      const element = divRef.current;
      console.log({
        getBoundingClientRect: element.getBoundingClientRect(),
        computedStyle: window.getComputedStyle(element),
        offsetTop: element.offsetTop,
        offsetLeft: element.offsetLeft,
        clientTop: element.clientTop,
        clientLeft: element.clientLeft,
        devicePixelRatio : window.devicePixelRatio,
        pageXOffset : window.scrollY
      });

    } else {
      console.log("tableRef is null :( ")
    }
  }

  if(divRef.current !== null){
    const box = divRef.current.getBoundingClientRect()
    console.log(box);
  } else {
    console.log("tableRef is null :( ")
  }

  const contentHeight = data.length * rowHeight;


  const height = `calc(100vh - ${heightOffset}px)`;

  return (
  <div onScroll={scrollTrigger}
    style={{
      height : height,
      overflowY  : "scroll"
    }}
    ref={divRef}
  >
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {virtualizedData}
      </tbody>
    </table>
  </div>);
}