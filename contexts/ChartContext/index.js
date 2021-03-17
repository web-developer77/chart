import React, { useEffect, useReducer, createContext } from 'react';
import { initialState, reducer } from './reducer';

export const ChartContext = createContext();

export const ChartContextProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ChartContext.Provider value={[state, dispatch]}>
      {props.children}
    </ChartContext.Provider>
  );
};
