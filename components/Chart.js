import { useContext, useEffect, useState, useRef } from 'react';
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Polygon from '../util/polygon';
import { CIQ } from 'chartiq/js/chartiq';
import 'chartiq/js/advanced';
import 'chartiq/js/addOns';

import { ChartContext } from '../contexts/ChartContext'; 

export default function Home() {
  const [state, dispatch] = useContext(ChartContext);
  var container = useRef(null);

  const createStx = () => {
    const stx = new CIQ.ChartEngine({ 
      container, 
      layout: { 
        chartType: state.chartType
      },
      preferences: {
        currentPriceLine: true
      }
    });
    stx.dataCallback = () => {
      console.log('data received');
    };
    //stx.streamParameters.maxWait = 500;
    //stx.chart.xAxis.timeUnit = CIQ.MILLISECOND;
    //new CIQ.Animation(stx, { tension: 0 });
    //stx.attachQuoteFeed(state.polygon.quoteFeed, {refreshInterval: 1});
    stx.setPeriodicity(state.timeOptions[0].value);
    return stx;
  };
  
  useEffect(() => {
    dispatch({
      type: 'SET_STX', 
      payload: createStx() 
    });
    dispatch({
      type: 'LOAD_CHART'
    });
    dispatch({
      type: 'SET_TIME_OPTION',
      payload: state.timeOptions[0].value
    });
    dispatch({type: 'POLYGON_INIT'});
    dispatch({type: 'ATTACH_QUOTE_FEED', payload: dispatch});
  }, []);


  return (
    <div 
      className='ciq-chart-area'
    >
      <div className='chartContainer' ref={node => container = node}></div>
      <div className='chart-title' style={{top: '0px'}}>{state.pair}</div>
    </div>
  );
}
