import { useEffect, useState, useRef } from 'react';
import styles from '../styles/Home.module.css'
import 'chartiq/js/advanced';
import 'chartiq/js/addOns';
import ChartContainer from '../containers/ChartContainer';

export default function Home() {
  return (
    <div className='ciq-night'>
      <ciq-UI-wraper>
        <ChartContainer />
      </ciq-UI-wraper>
    </div>
  )
};
