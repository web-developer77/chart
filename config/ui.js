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

const buildTimeOptions = chartType => {
  if(!chartType)
    return [];
  if(chartType === 'candle')
    return [oneMinute];
  return [...seconds, oneMinute];
};

const timeOptions = chartType => {
  return buildTimeOptions(chartType).map(option => ({text: option.label, value: option, key: option.label}));
};

const studyList = () => {
  const studies = CIQ.Studies.studyLibrary;
  const result = Object.keys(studies)
    .sort()
    .map(studyName => ({text: studyName, value: studies[studyName], key: studyName}));
  return result;
};

export default {
  pairs: pairs.map(pair => ({text: pair, value: pair, key: pair})),
  chartTypes: chartTypes.map(t => ({text: t, value: t.toLowerCase(), key: t})),
  timeOptions,
  studyList: studyList()
};
