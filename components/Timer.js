import React, { useEffect, useState } from 'react';

export default function Timer({ seconds }){
  const [ timer, setTimer ] = useState(seconds);

  useEffect(() => {
  }, []);

  useEffect(() => console.log(timer));

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
    <span>{ timeStr() }</span>
  );

};
