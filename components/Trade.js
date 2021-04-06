import React from 'react';
import Timer from './Timer';

export default function Trade({trade}){

  const typeImages = {
    put: '/put.svg',
    call: '/call.svg'
  };

  const statusImages = {
    pending: '/pending.svg',
    won: '/won.svg',
    lost: '/lost.svg'
  };

  return(
    <div className='row'>
      <img src={typeImages[trade.type]} className='trade-icon'/>
      <span className='trade-span'>{'$' + trade.amount}</span>
      <span className='trade-span'>{trade.price}</span>
      {
        trade.status === 'pending'
        ? <Timer trade={trade} />
        : <span className='trade-span'>{ trade.finishPrice }</span>
      }
      <img src={statusImages[trade.status]} className='trade-icon'/>
    </div>

  );
};
