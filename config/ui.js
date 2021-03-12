const pairs = ['EUR/SGD', 'USD/EUR'];
const chartTypes = ['Mountain', 'Line', 'Candle'];

const oneSecond = { value: 1, period: 1, timeUnits: 'second', label: '1 s' };
const minutes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(m => (
    {
      value: m,
      period: m * 60,
      timeUnits: 'minute',
      label: m + ' m'
    }));

const timeOptions = chartType => {
  if(!chartType)
    return [];
  if(chartType === 'candle')
    return minutes;
  return [oneSecond, ...minutes];
};

export default {
  pairs: pairs.map(p => ({pair: p, label: p})),
  chartTypes: chartTypes.map(t => ({type: t.toLowerCase(), label: t})),
  timeOptions
};
