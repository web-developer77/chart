import React, { useContext } from 'react';
import MenuSelect from './MenuSelect';
import { CIQ } from 'chartiq/js/chartiq';

import { ChartContext } from '../contexts/ChartContext'; 
import uiConfig from '../config/ui';

import { Button, Dropdown } from 'semantic-ui-react';

export default function Toolbar(props){

  const [state, dispatch] = useContext(ChartContext);

  return (
    <nav className='ciq-nav'>
      <div className='left'>
        <Dropdown
          options={uiConfig.pairs}
          value={state.pair}
          onChange={(e, data) => dispatch({type: 'SET_PAIR', payload: data.value})}
        />
        <Dropdown
          text='Chart Type'
          options={state.chartTypes}
          value={state.chartType}
          onChange={(e, data) => {
            const timeOptions = uiConfig.timeOptions(data.value);
            dispatch({type: 'SET_TIME_OPTIONS', payload: timeOptions});
            dispatch({type: 'SET_TIME_OPTION', payload: timeOptions[0].value});
            dispatch({type: 'SET_CHART_TYPE', payload: data.value });
          }}
        />
        <Dropdown
          options={state.timeOptions}
          value={state.timeOption}
          onChange={(e, data) => dispatch({type: 'SET_TIME_OPTION', payload: data.value})}
        />
        <Dropdown
          pointing
          text='Studies'
          onChange={(e, data) => console.log(data)}
          scrolling
        >
          <Dropdown.Menu>
          {
            uiConfig.studyList.map((study, index) => (
              <Dropdown.Item 
                key={study.value}
                onClick={(e, data) => dispatch({type: 'OPEN_STUDY_MODAL', payload: data.children})}
              >{study.value}
              </Dropdown.Item>)
          )}
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div className='right'>
      </div>
    </nav>
  )
};
