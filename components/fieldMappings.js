const fieldMappings = {
  checkbox: 'checked',
};

const getValueField = inputParams => {
  if(!fieldMappings[inputParams.type])
    return 'value';
  return fieldMappings[inputParams.type];
};

export {
  getValueField
};
