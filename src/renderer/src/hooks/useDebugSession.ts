import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import {
  updateTestCase,
  createTestCase,
  initDebugSession,
  endDebugSession,
  setActiveTest,
} from '@/state/debugSlice';
import { DebugTestCase } from '@/types/debug';

export const useDebugSession = () => {
  const dispatch: AppDispatch = useDispatch();
  const session = useSelector((s: RootState) => s.debug);

  return {
    session,
    init: () => dispatch(initDebugSession()),
    end: () => dispatch(endDebugSession()),
    addTest: (test: DebugTestCase) => dispatch(createTestCase(test)),
    updateTest: (test: DebugTestCase) => dispatch(updateTestCase(test)), // Typed
    setActiveTest: (id?: string) => dispatch(setActiveTest(id)),
  };
};