import React, { useContext } from 'react';
import MenuSelect from './MenuSelect';
import { CIQ } from 'chartiq/js/chartiq';

import { ChartContext } from '../contexts/ChartContext'; 
import uiConfig from '../config/ui';

export default function Toolbar(props){

  const [state, dispatch] = useContext(ChartContext);

  return (
    <nav className='ciq-nav'>
      <div className='left'>
        <MenuSelect
          options={state.pairs}
          keyName='pair'
          name='label'
          handleOptionSelect={e => dispatch({type: 'SET_PAIR', payload: e})}
          menuId='pairSelect'
          title={state.pair.pair}
          selected={state.pair} 
        />
        <MenuSelect
          options={state.chartTypes}
          keyName='type'
          name='label'
          handleOptionSelect={e => {
            const timeOptions = uiConfig.timeOptions(e.type);
            dispatch({type: 'SET_TIME_OPTIONS', payload: timeOptions});
            dispatch({type: 'SET_TIME_OPTION', payload: timeOptions[0]});
            dispatch({type: 'SET_CHART_TYPE', payload: e });
          }}
          menuId='chartTypeSelect'
          title='Chart Type'
          hasCheckboxes={true}
          selected={state.chartType} 
        />
        <MenuSelect
          options={state.timeOptions}
          keyName='value'
          name='label'
          handleOptionSelect={e => dispatch({type: 'SET_TIME_OPTION', payload: e})}
          menuId='timeOptionSelect'
          title={state.timeOption.label}
          selected={state.timeOption} 
        />
        <MenuSelect hasButtons={false}
          options={state.studyList}
          keyName='study'
          name='name'
          handleOptionSelect={e => dispatch({type: 'ADD_STUDY', payload: e})}
          menuId='studySelect'
          title='Studies' 
        />
      </div>
      <div className='right'>
      </div>
    </nav>
  )
};
