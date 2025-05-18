import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import {
  updateTestCase,
  createTestCase,
  initDebugSession,
  endDebugSession,
  setActiveTest,
} from '@/state/debugSlice';
import { DebugTestCase, DebugSession } from '@/types/debug';

export type TestStatus = 'pending' | 'failing' | 'passing';

export interface DebugSessionHook {
  session: DebugSession;
  selectAllTests: () => DebugTestCase[];
  selectTestStatus: (id: string) => TestStatus | undefined;
  init: () => void;
  end: () => void;
  addTest: (test: DebugTestCase) => void;
  updateTest: (test: DebugTestCase) => void;
  setActiveTest: (id?: string) => void;
}

export const useDebugSession = (): DebugSessionHook => {
  const dispatch: AppDispatch = useDispatch();
  const session = useSelector((s: RootState) => s.debug);

  // Selector: returns all test cases
  const selectAllTests = () => session.tests;

  // Selector: returns the status of a test case by id
  const selectTestStatus = (id: string) => {
    const test = session.tests.find((t) => t.id === id);
    return test?.status;
  };

  return {
    session,
    selectAllTests,
    selectTestStatus,
    init: () => dispatch(initDebugSession()),
    end: () => dispatch(endDebugSession()),
    addTest: (test: DebugTestCase) => dispatch(createTestCase(test)),
    updateTest: (test: DebugTestCase) => dispatch(updateTestCase(test)),
    setActiveTest: (id?: string) => dispatch(setActiveTest(id)),
  };
};