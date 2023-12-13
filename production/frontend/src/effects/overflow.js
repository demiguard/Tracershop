import React, {useState, useLayoutEffect} from 'react';

// This code is stolen from
// https://www.robinwieruch.de/react-custom-hook-check-if-overflow/

export const useOverflow = (ref, callback) => {
  const [isOverflow, setIsOverflow] = useState(false);

  useLayoutEffect(() => {
    const { current } = ref;

    const trigger = () => {
      const hasOverflow = current.scrollHeight > current.clientHeight
                        || current.scrollWidth > current.clientWidth;
      setIsOverflow(hasOverflow);

      if (callback) callback(hasOverflow);
    };

    if (current) {
      if('ResizeObserver' in window){
        new ResizeObserver(trigger).observe(current);
      }
      trigger();
    }
  }, [callback, ref]);

  return isOverflow;
};