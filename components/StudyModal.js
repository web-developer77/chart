import React, { useEffect, useContext } from 'react';
import { Button, Modal } from 'semantic-ui-react';
import { ChartContext } from '../contexts/ChartContext'; 
import StudyModalInput from './StudyModalInput';
import { getValueField } from './fieldMappings';

export default function StudyModal(){
  
  const [state, dispatch] = useContext(ChartContext);
  if(!state.studyHelper)
    return null;
  
  const inputs = state.studyHelper.inputs;
  console.log(inputs);

  useEffect(() => {
    const initialForm = {};
    for(let input of inputs){
      const valueField = getValueField(input);
      initialForm[input.name] = input[valueField];
      if(input.value)
        delete input.value;
    };
    dispatch({type: 'SET_STUDY_FORM', payload: initialForm});
  }, []);

  return(
    <Modal
      size='mini'
      open={state.showStudyModal}
    >
      <Modal.Header>{state.studyHelper.name}</Modal.Header>
      <Modal.Content>
      {
        inputs.map((input, index) => (
          <StudyModalInput inputParams={input} key={input.name}/>
        ))
      }
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={e => dispatch({type: 'SHOW_STUDY_MODAL', payload: false})}>
          No
        </Button>
        <Button positive>
          Yes
        </Button>
      </Modal.Actions>
    </Modal>
    
  );
};
