import { CIQ } from 'chartiq/js/chartiq';
//import Polygon from '../../util/polygon';
import Triangle from '../../util/triangle';
import uiSettings from '../../config/ui'; 
import localStorage from '../../util/localStorage';

const timeOptions = uiSettings.timeOptions('default');
const defaultStudyHelper = { inputs: [], outputs: [] };
export const initialState = {
  stx: null,
  polygon: Triangle(),
  pairs: uiSettings.pairs,
  pair: uiSettings.pairs[0].value,
  chartTypes: uiSettings.chartTypes,
  chartType: uiSettings.chartTypes[0].value,
  timeOptions,
  timeOption: timeOptions[0].value,
  studyList: uiSettings.studyList,
  study: null,
  studyHelper: defaultStudyHelper,
  lastQuote: { DT: new Date(), Value: 0 },
  showStudyModal: false,
  studyForm: {},
  studyOutputs: {},
  studyInitPassed: false,
  userId: localStorage.userId,
  bidAmountOptions: uiSettings.bidAmountOptions,
  bidAmountOption: uiSettings.bidAmountOptions[0].value,
  bidTimeOptions: uiSettings.bidTimeOptions,
  bidTimeOption: uiSettings.bidTimeOptions[0].value,
  trades: {}
};

export const reducer = (state, action) => {
  switch (action.type) {

    case 'POLYGON_INIT':
      state.polygon.init(state.userId)
      .then(() => state.polygon.subscribe(state.pair));
      return state;

    case 'SET_STX':
      return { ...state, stx: action.payload };

    case 'SET_TIME_OPTION':
      state.stx.setPeriodicity({
        period: action.payload,
        interval: 1,
        timeUnit: 'second'
      });
      return {...state, timeOption: action.payload};

    case 'SET_TIME_OPTIONS':
      return { ...state, timeOptions: action.payload };

    case 'LOAD_CHART':
      state.stx.loadChart(state.pair, []);
      return state;

    case 'SET_LAST_QUOTE':
      return { ...state, lastQuote: action.payload };

    case 'ATTACH_QUOTE_FEED':
      state.stx.attachQuoteFeed(state.polygon.quoteFeed, { 
        refreshInterval: 1, 
        callback: e => {
          if(e.chart.lastQuote)
            action.payload({type: 'SET_LAST_QUOTE', payload: e.chart.lastQuote})
        } 
      });
      return state;

    case 'SET_PAIR':
      state.polygon.unsubscribe()
        .then(() => {
          state.polygon.subscribe(action.payload);
          reducer(state, {type: 'LOAD_CHART'});
        });
      return { ...state, pair: action.payload };

    case 'SET_CHART_TYPE':
      state.stx.setChartType(action.payload);
      return { ...state, chartType: action.payload };

    case 'ADD_STUDY':
      CIQ.Studies.addStudy(state.stx, action.payload.name);
      return state;

    case 'SHOW_STUDY_MODAL':
      return { ...state, showStudyModal: action.payload};

    case 'CLOSE_STUDY_MODAL':
      return { ...state, showStudyModal: false, studyHelper: defaultStudyHelper, studyInitPassed: false };

    case 'OPEN_STUDY_MODAL':
      const sd = CIQ.Studies.addStudy(state.stx, action.payload);
      const studyHelper = new CIQ.Studies.DialogHelper({ sd, stx: state.stx });
      return { 
        ...state, 
        showStudyModal: true, 
        studyHelper,
        studyForm: {}
      };
    
    case 'SET_STUDY_FORM':
      return { ...state, studyForm: { ...state.studyForm, ...action.payload } };

    case 'SET_STUDY_OUTPUTS':
      return { ...state, studyOutputs: { ...state.studyOutputs, ...action.payload } };

    case 'STUDY_INIT_PASSED':
      return { ...state, studyInitPassed: action.payload };

    case 'STUDY_UPDATE':
      state.studyHelper.updateStudy({ inputs: state.studyForm, outputs: state.studyOutputs });
      return state;

    case 'SET_BID_AMOUNT':
      return { ...state, bidAmountOption: action.payload };

    case 'SET_BID_TIME':
      return { ...state, bidTimeOption: action.payload };

    case 'ADD_TRADE':
      const trades = { ...state.trades, [action.payload.id]: action.payload };
      return { ...state, trades };

    case 'SUBMIT_TRADE':
      const trade = { 
        user: state.userId,
        amount: state.bidAmountOption,  
        time: state.bidTimeOption,
        pair: state.pair,
        type: action.payload.tradeType
      };
      state.polygon.addTrade(trade, action.payload.dispatch);
      return state;

    default:
      console.log(action);
      throw new Error();
  }
};
