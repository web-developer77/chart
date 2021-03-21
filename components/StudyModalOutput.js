import React, { useState } from 'react';
import { CompactPicker }from 'react-color';

export default function StudyModalOutput({name, color, onChange}) {
  const [showPicker, setShowPicker] = useState(false);
  
  const togglePicker = e => setShowPicker(!showPicker);

  const onPickerChange = color => {
    onChange(color.hex);
    setShowPicker(false);
  };

  return (
    <>
    <div className='study-modal-row'>
      <span>{name}</span>
      <div className='color-rect' style={{background: color}} onClick={togglePicker}></div>
    </div>
    <div className='picker-row'>
    {showPicker
     ? <CompactPicker
        color={color}
        onChange={onPickerChange}
      />
     : null
    }
    </div>
    </>
  );
};
