import React, { useContext } from 'react';

import { ChartContext } from '../contexts/ChartContext'; 
import BuyButton from './BuyButton';

export default function Footer(){
  const [state, dispatch] = useContext(ChartContext);
  return(
    <div className='ciq-footer'>
      <BuyButton /> 
    </div>
  );
};
