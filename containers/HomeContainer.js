import React from 'react';
import ChartContainer from '../containers/ChartContainer';
import LeftMenu from './LeftMenu';

export default function HomeContainer(){
  return (
    <div className='home-container'>
      <LeftMenu />
          <ChartContainer />
    </div>
  )
};
