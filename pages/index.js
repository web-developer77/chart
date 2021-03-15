import { useEffect, useState, useRef } from 'react';
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Polygon from '../util/polygon';
import { CIQ } from 'chartiq/js/chartiq';
import 'chartiq/js/advanced';
import 'chartiq/js/addOns';

import uiConfig from '../config/ui';
import Toolbar from '../components/Toolbar';

export default function Home() {
  var container = useRef(null);

  const [settings, setSettings] = useState({
    pair: uiConfig.pairs[0],
    chartType: uiConfig.chartTypes[0]
  });

  const [chartType, setChartType] = useState(uiConfig.chartTypes[0]);
  const [pair, setPair] = useState(uiConfig.pairs[0]);
  const [stx, setStx] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const [timeOptions, setTimeOptions] = useState(uiConfig.timeOptions('default'));
  const [timeOption, setTimeOption] = useState(uiConfig.timeOptions('default')[0]);

  const loadChart = () => {
    stx.loadChart(
      pair.pair, 
      []
    );
  };

  const createStx = () => {
    const stx = new CIQ.ChartEngine({ 
      container, 
      layout: { 
        chartType: chartType.type 
      },
      preferences: {
        currentPriceLine: true
      }
    });
    stx.dataCallback = () => {
      //stx.loadChart(pair.pair, stx.chart.masterData);
    };
    stx.streamParameters.maxWait = 500;
    //stx.chart.xAxis.timeUnit = CIQ.MILLISECOND;
    //new CIQ.Animation(stx, { tension: 0 });
    setStx(stx);
  };

  const createPolygon = () => {
    console.log('creating polygon');
    const polygon = Polygon('4uVVJPuqfx3sSr0YA8MFGAO9aTreizZV');
    return polygon.init()
      .then(() => {
        console.log('polygon initialized');
        setPolygon(polygon);
      });
  };

  const pairSubscribe = () => {
    polygon.subscribe(pair.pair);
    stx.attachQuoteFeed(polygon.quoteFeed, {refreshInterval: 1});
  };

  const setPeriodicity = () => {
    if(!stx)
      return;
    stx.setPeriodicity({
      period: timeOption.period,
      interval: 1,
      timeUnit: 'second'
    });
  };

  useEffect(() => {
    createStx();
    createPolygon();
  }, []);

  useEffect(() => {
    if(stx === null || polygon === null)
      return;
    loadChart();
    setPeriodicity();
    pairSubscribe();
  }, [stx, polygon]);

  useEffect(() => {
    const newTimeOptions = uiConfig.timeOptions(chartType.type); 
    setTimeOptions(timeOptions);
    setTimeOption(timeOptions[0]);
    if(stx)
      stx.setChartType(chartType.type);
  }, [chartType]);

  useEffect(() => {
    setPeriodicity();
  }, [timeOption]);

  useEffect(() => {
    console.log(polygon, stx, pair.pair);
    if(!polygon || !stx || pair.pair === polygon.pairSubscribed)
      return;
    polygon.unsubscribe()
    .then(() => {
      stx.clearCurrentMarketData();
      loadChart();
      setPeriodicity();
      pairSubscribe();
    });
  }, [pair]);

  return (
    <div className='ciq-night'>
    <ciq-UI-wraper>
      <Toolbar 
        stx={stx}
        pairs={uiConfig.pairs}
        chartTypes={uiConfig.chartTypes}
        timeOptions={timeOptions}
        studyList={uiConfig.studyList}
        pair={pair}
        chartType={chartType}
        timeOption={timeOption}
        setPair={setPair}
        setChartType={setChartType}
        setTimeOption={setTimeOption}
      />
      <div 
        className='ciq-chart-area'
      >
        <div className='chartContainer' ref={node => container = node}></div>
        <div className='chart-title' style={{top: '0px'}}>{pair.pair}</div>
      </div>
    </ciq-UI-wraper>
    </div>
  )
}
