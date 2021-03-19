import React from 'react';
import { ChartContextProvider } from '../contexts/ChartContext';
import Chart from '../components/Chart';
import Toolbar from '../components/Toolbar';
import Footer from '../components/Footer';
import StudyModal from '../components/StudyModal';

export default function ChartContainer(){
  return(
    <ChartContextProvider>
      <Toolbar />
      <Chart />
      <Footer />
      <StudyModal />
    </ChartContextProvider>
  );
};
