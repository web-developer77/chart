import React, { useContext } from 'react';
import { Checkbox, Dropdown, Input } from 'semantic-ui-react';
import { getValueField } from './fieldMappings';
import { ChartContext } from '../contexts/ChartContext'; 
import { TimePicker, DatePicker } from 'antd';

const elMappings = {

  number: {
    element: Input,
    props: { type: 'number', size: 'mini' }
  },

  select: { 
    element: Dropdown,
    props: {}
  },

  checkbox: {
    element: Checkbox,
    props: {}
  },

  date: {
    element: DatePicker,
    props: { size: 'small'}
  },

  time: {
    element: TimePicker,
    props: { size: 'small' }
  }

};

const paramsNormalize = (params) => {
  const pickFields = ['name', 'options'];
  const result = Object.keys(params).reduce((result, param) => {
    if(!pickFields.includes(param))
      return result;
    result[param] = params[param];
    return result;
  }, {});

  if(result.options)
    result.options = Object.keys(result.options).map(option => ({text: option, value: result.options[option]}));
  return result;
};

export default function StudyModalInput({inputParams}){
  const [state, dispatch] = useContext(ChartContext);

  const mapping = elMappings[inputParams.type];
  const normalizedParams = paramsNormalize(inputParams);
  const valueField = getValueField(inputParams);

  const onChange = (e, data) => {
    dispatch({type: 'SET_STUDY_FORM', payload: {[inputParams.name]: data[valueField]}});
  };

  const totalProps = {...mapping.props, ...normalizedParams, onChange, [valueField]: state.studyForm[inputParams.name] };
  return <mapping.element {...totalProps} />;
};
