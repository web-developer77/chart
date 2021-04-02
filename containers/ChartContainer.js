import React from 'react';
import { ChartContextProvider } from '../contexts/ChartContext';
import Chart from '../components/Chart';
import Toolbar from '../components/Toolbar';
import Footer from '../components/Footer';
import StudyModal from '../components/StudyModal';
import Trading from '../components/Trading';

export default function ChartContainer(){
  return(
    <ChartContextProvider>
    <div className='trade-chart-container'>
    <div className='chart-area'>
      <Toolbar />
      <Chart />
      <Footer />
      <StudyModal />
    </div>
    <div className='trade-area'>
      <Trading />
    </div>
    </div>
    </ChartContextProvider>
  );
};
