import React, {useState, useLayoutEffect} from 'react';

// This code is stolen from
// https://www.robinwieruch.de/react-custom-hook-check-if-overflow/

export const useOverflow = (ref, callback) => {
  const [isOverflow, setIsOverflow] = useState(false);

  useLayoutEffect(() => {
    const { current } = ref;
    let observer = null;

    const trigger = () => {
      const hasOverflow = current.scrollHeight > current.clientHeight
                        || current.scrollWidth > current.clientWidth;
      setIsOverflow(hasOverflow);

      if (callback){
        callback(hasOverflow);
      }
    };

    if (current) {
      if('ResizeObserver' in window){
        observer = new ResizeObserver(trigger);
        observer.observe(current);
      }
      trigger();
    }
    return () => {
      if(observer){
        observer.disconnect();
      }
    }
  }, [callback, ref]);

  return isOverflow;
};