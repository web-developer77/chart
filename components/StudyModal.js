import React, { useEffect, useContext } from 'react';
import { Button, Divider, Modal } from 'semantic-ui-react';
import { ChartContext } from '../contexts/ChartContext'; 
import StudyModalInput from './StudyModalInput';
import StudyModalOutput from './StudyModalOutput';
import { getValueField } from './fieldMappings';

export default function StudyModal(){
  
  const [state, dispatch] = useContext(ChartContext);

  const inputs = state.studyHelper.inputs;
  const outputs = state.studyHelper.outputs;

  const inputsInit = () => {
    const initialForm = {};
    for(let input of inputs){
      const valueField = getValueField(input);
      if(input.name === 'date' || input.name === 'time')
        initialForm[input.name] = new Date();
      else
        initialForm[input.name] = input[valueField];
      if(input.value)
        delete input.value;
    };
    dispatch({type: 'SET_STUDY_FORM', payload: initialForm});
  };

  const outputsInit = () => {
    const initialOutputs = {};
    for(let output of outputs)
      initialOutputs[output.name] = output.color;
    console.log(initialOutputs);
    dispatch({type: 'SET_STUDY_OUTPUTS', payload: initialOutputs});
  };

  useEffect(() => {
    if(!state.studyHelper || state.studyInitPassed === true || state.showStudyModal === false)
      return;
    inputsInit();
    outputsInit();
    dispatch({type: 'STUDY_INIT_PASSED', payload: true});
  });

  const closeDialog = () => {
    dispatch({type: 'STUDY_INIT_PASSED', payload: false});
    dispatch({type: 'SHOW_STUDY_MODAL', payload: false});
  };

  const studyUpdate = () => {
    dispatch({type: 'STUDY_UPDATE'});
    closeDialog();
  };

  return(
    <Modal
      size='mini'
      open={state.showStudyModal}
    >
      <Modal.Header>{state.studyHelper.name}</Modal.Header>
      <Modal.Content>
        <Divider horizontal>Inputs</Divider>
        {
          inputs.map((input, index) => (
            <div className='study-modal-row' key={input.name}>
              <span>{input.name + ':'}</span>
              <StudyModalInput inputParams={input} />
            </div>
          ))
        }
    
        <Divider horizontal>Outputs</Divider>
        {
          outputs.map((output, index) => (
              <StudyModalOutput 
                key={output.name}
                name={output.name}
                color={state.studyOutputs[output.name]} 
                onChange={color => dispatch({type: 'SET_STUDY_OUTPUTS', payload: { [output.name]: color }})} 
              />
          ))
        }
      </Modal.Content>
      <Modal.Actions>
        <Button className='cancel-btn' size='mini'  onClick={closeDialog}>
          Cancel
        </Button>
        <Button size='mini' onClick={studyUpdate}>
          Apply
        </Button>
      </Modal.Actions>
    </Modal>
    
  );
};
