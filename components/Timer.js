import React, { useState } from 'react';

export default function Timer({ trade }){
  const [ timer, setTimer ] = useState(trade.time * 60);

  setTimeout(() => {
    if(timer > 0)
      setTimer(timer - 1);
  }, 1000);

  const timeStr = () => {
    const min = (timer / 60) >> 0;
    const sec = timer - min * 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <span className='trade-span'>{ timeStr() }</span>
  );

};
