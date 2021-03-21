import React, { useEffect, useContext } from 'react';
import { Button, Divider, Modal } from 'semantic-ui-react';
import { ChartContext } from '../contexts/ChartContext'; 
import StudyModalInput from './StudyModalInput';
import StudyModalOutput from './StudyModalOutput';
import { getValueField } from './fieldMappings';

export default function StudyModal(){
  
  const [state, dispatch] = useContext(ChartContext);
  if(!state.studyHelper)
    return null;
  
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
    dispatch({type: 'SET_STUDY_OUTPUTS', payload: initialOutputs});
  };

  useEffect(() => {
    outputsInit();
    inputsInit();
  }, []);

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
            <div className='study-modal-row'>
              <span>{input.name + ':'}</span>
              <StudyModalInput inputParams={input} key={input.name}/>
            </div>
          ))
        }
        <Divider horizontal>Outputs</Divider>
          {
            Object.keys(outputs).map((output, index) => {(
              <div className='study-modal-row'>
                <span>{output + ':'}</span>
                <StudyModalOutput 
                  color={state.studyOutputs[output]}
                  onChange={color => dispatch({type: 'SET_STUDY_OUTPUTS', payload: {[output]: color}})}
                />
              </div>
            )})
          }
      </Modal.Content>
      <Modal.Actions>
        <Button color='cancelColor' size='mini'  onClick={e => dispatch({type: 'SHOW_STUDY_MODAL', payload: false})}>
          No
        </Button>
        <Button positive size='mini'>
          Yes
        </Button>
      </Modal.Actions>
    </Modal>
    
  );
};
