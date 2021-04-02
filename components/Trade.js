import React from 'react';
import Timer from './Timer';

export default function Trade({trade}){
  return(
    <div className='trade-row'>
      <Timer seconds={ trade.time * 60 }/>
      <img src='/clock2.svg' className='trade-icon'/>
    </div>

  );
};
