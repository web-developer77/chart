import { CIQ } from 'chartiq/js/chartiq';
const pairs = ['BTC-USD', 'ETH-BTC'];
const chartTypes = ['Mountain', 'Line', 'Candle'];

const oneSecond = { value: 1, period: 1, timeUnits: 'second', label: '1 s' };
const minutes = [1, 5, 10]
  .map(m => (
    {
      value: m,
      period: m * 60,
      timeUnits: 'minute',
      label: m + ' m'
    }));

const seconds = [10, 30, 60];
const buildTimeOptions = chartType => {
  if(!chartType)
    return [];
  if(chartType === 'candle')
    return seconds;
  return [1, ...seconds];
};

const timeOptions = chartType => {
  return buildTimeOptions(chartType).map(option => {
    let text = '';
    if(option === 60)
      text = '1 m';
    else text = `${option} s`;
    return ({ text, value: option });
  });
};

const studyList = () => {
  const studies = CIQ.Studies.studyLibrary;
  return Object.keys(studies)
    .sort()
    .filter(studyName => typeof studies[studyName] === 'object')
    .map(studyName => ({text: studyName, value: studyName}));
};

const bidAmountOptions = [10, 20, 30].map(bid => ({ text: '$' + bid, value: bid, key: 'bidAmount' + bid }));
const bidTimeOptions = [1, 2, 3, 4, 5].map(time => ({ text: time + ' min.', value: time, key: 'bidTime' + time }));

export default {
  pairs: pairs.map(pair => ({text: pair, value: pair, key: pair})),
  chartTypes: chartTypes.map(t => ({text: t, value: t.toLowerCase(), key: t})),
  timeOptions,
  //studyList: ['ATR Bands', 'AVWAP', 'Stochastics'].map(study => ({text: study, value: study}))
  studyList: studyList(),
  bidAmountOptions,
  bidTimeOptions
};
