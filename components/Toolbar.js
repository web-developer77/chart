import React from 'react';
import MenuSelect from './MenuSelect';
import { CIQ } from 'chartiq/js/chartiq';

export default function Toolbar(props){
  const { 
    stx,
    pairs, 
    chartTypes,
    timeOptions,
    studyList,
    pair,
    timeOption,
    chartType,
    setPair,
    setChartType,
    setTimeOption
  } = props;

  return (
    <nav className='ciq-nav'>
      <div className='left'>
        <MenuSelect
          options={pairs}
          keyName='pair'
          name='label'
          handleOptionSelect={e => setPair(e)}
          menuId='pairSelect'
          title={pair.pair}
          selected={pair} 
        />
        <MenuSelect
          options={chartTypes}
          keyName='type'
          name='label'
          handleOptionSelect={e => setChartType(e)}
          menuId='chartTypeSelect'
          title='Chart Type'
          hasCheckboxes={true}
          selected={chartType} 
        />
        <MenuSelect
          options={timeOptions}
          keyName='value'
          name='label'
          handleOptionSelect={e => setTimeOption(e)}
          menuId='timeOptionSelect'
          title={timeOption.label}
          selected={timeOption} 
        />
        <MenuSelect hasButtons={false}
          options={studyList}
          keyName='study'
          name='name'
          handleOptionSelect={(stx, study) => CIQ.Studies.addStudy(stx, study)}
          needsCiq={true}
          ciq={stx}
          menuId='studySelect'
          title='Studies' 
        />
      </div>
      <div className='right'>
      </div>
    </nav>
  )
};
