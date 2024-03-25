import React, {useRef, useEffect} from "react";

export function Canvas(props){
  const ref = useRef(null);
  const {draw, ...rest} = props;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');

    let frameCount = 0;
    let animationFrameId;

    function render () {
      frameCount++;
      draw(context, frameCount);
      animationFrameId = window.requestAnimationFrame(render);
    }

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    }
  }, [draw]);


  return <canvas ref={ref} {...rest}/>
}

export function StaticCanvas(props){
  const ref = useRef(null);
  const {draw, ...rest} = props;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');
    draw(context, 0);
  }, [draw]);


  return <canvas ref={ref} {...rest}/>
}
