import React, {useRef, useEffect, PropsWithoutRef} from "react";


type CanvasProps = {
  draw : (context: CanvasRenderingContext2D, frameCount: number) => void
} & React.ComponentPropsWithoutRef<'canvas'>


export function Canvas(props : CanvasProps){
  const ref = useRef(null);
  const {draw, ...rest} = props;

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas.getContext('2d');

    let frameCount = 0;
    let animationFrameId: number;

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


export function StaticCanvas(props : CanvasProps){
  const ref: React.RefObject<HTMLCanvasElement> = useRef(null);
  const {draw, ...rest} = props;

  useEffect(() => {
    const canvas = ref.current;
    if(!canvas){ return; }
    const context = canvas.getContext('2d');
    if(!context){ return; }

    const animationFrameId = requestAnimationFrame(() => {
      draw(context, 0);
    })

    return () => cancelAnimationFrame(animationFrameId);

  }, [draw]);


  return <canvas ref={ref} {...rest}/>
}
