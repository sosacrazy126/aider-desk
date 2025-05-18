import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../state/store';
import { initDebugSession, endDebugSession, createTestCase, updateTestCase, setActiveTest } from '../state/debugSlice';

export const useDebugSession = () => {
  const debug = useSelector((state: RootState) => state.debug);
  const dispatch = useAppDispatch();
  return {
    debug,
    initDebugSession: () => dispatch(initDebugSession()),
    endDebugSession: () => dispatch(endDebugSession()),
    createTestCase: (input: { scenario: string; expected: string }) => dispatch(createTestCase(input)),
    updateTestCase: (id: string, updates: any) => dispatch(updateTestCase({ id, updates })),
    setActiveTest: (id?: string) => dispatch(setActiveTest(id)),
  };
};