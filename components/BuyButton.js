import React, { useContext, useEffect } from 'react';
import { ChartContext } from '../contexts/ChartContext'; 

export default function BuyButton(){
  const [state, dispatch] = useContext(ChartContext);

  //useEffect(() => {
  //  setInterval(() => console.log(state), 1000);
  //}, []);

  const onClick = e => {
    window.alert(`${state.pair}: ${state.lastQuote.Value}`);
  };
  //return(
  //  <div className='buy-button'>
  //    <span className='pair'>{state.pair.pair}</span>
  //    <span className='price'>{state.lastQuote.Value}</span>
  //  </div>
  //);
  return (
    <div className='buy-button' onClick={onClick}>
      <span className='pair'>Get Price</span>
    </div>
  );
};
