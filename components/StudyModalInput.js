import React, { useContext } from 'react';
import { Checkbox, Dropdown, Input } from 'semantic-ui-react';
import DateTimePicker from 'react-datetime-picker';
import { getValueField } from './fieldMappings';
import { ChartContext } from '../contexts/ChartContext'; 

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
    element: DateTimePicker,
    props: { disableClock: true }
  },

  time: {
    element: DateTimePicker,
    props: { disableCalendar: true }
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
  console.log(inputParams.type);

  const mapping = elMappings[inputParams.type];
  const normalizedParams = paramsNormalize(inputParams);
  console.log(normalizedParams);
  const valueField = getValueField(inputParams);

  const onChange = (e, data) => {
    dispatch({type: 'SET_STUDY_FORM', payload: {[inputParams.name]: data[valueField]}});
  };

  const totalProps = {...mapping.props, ...normalizedParams, onChange, [valueField]: state.studyForm[inputParams.name] };
  return <mapping.element {...totalProps} />;
};
