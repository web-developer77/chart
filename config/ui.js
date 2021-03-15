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

const seconds = [1, 10, 30].map(s => ({ value: s, period: s, timeUnits: 'second', label: s + ' s' }));
const oneMinute = { value: 1, period: 60, timeUnits: 'minute', label: '1 m' };

const timeOptions = chartType => {
  if(!chartType)
    return [];
  if(chartType === 'candle')
    return oneMinute;
  return [...seconds, oneMinute];
};

const studyList = () => {
  const studies = CIQ.Studies.studyLibrary;
  const result = Object.keys(studies)
    .sort()
    .map(studyName => studies[studyName]);
  console.log(result);
  return result;
};

export default {
  pairs: pairs.map(p => ({pair: p, label: p})),
  chartTypes: chartTypes.map(t => ({type: t.toLowerCase(), label: t})),
  timeOptions,
  studyList: studyList()
};
