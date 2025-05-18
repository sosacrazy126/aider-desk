import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DebugSession, DebugTestCase } from '../types/debug';

const initialState: DebugSession = {
  isActive: false,
  tests: [],
  activeTestId: undefined,
};

const debugSlice = createSlice({
  name: 'debug',
  initialState,
  reducers: {
    initDebugSession(state) {
      state.isActive = true;
      state.tests = [];
      state.activeTestId = undefined;
    },
    endDebugSession(state) {
      state.isActive = false;
      state.tests = [];
      state.activeTestId = undefined;
    },
    createTestCase(state, action: PayloadAction<Omit<DebugTestCase, "id" | "attempts" | "status" | "patches">>) {
      const id = crypto.randomUUID();
      const testCase: DebugTestCase = {
        id,
        scenario: action.payload.scenario,
        expected: action.payload.expected,
        actual: undefined,
        attempts: 1,
        status: 'pending',
        patches: [],
      };
      state.tests.push(testCase);
      state.activeTestId = id;
    },
    updateTestCase(state, action: PayloadAction<{ id: string; updates: Partial<DebugTestCase> }>) {
      const idx = state.tests.findIndex(tc => tc.id === action.payload.id);
      if (idx >= 0) {
        state.tests[idx] = { ...state.tests[idx], ...action.payload.updates };
      }
    },
    setActiveTest(state, action: PayloadAction<string | undefined>) {
      state.activeTestId = action.payload;
    },
  },
});

export const {
  initDebugSession,
  endDebugSession,
  createTestCase,
  updateTestCase,
  setActiveTest,
} = debugSlice.actions;

export default debugSlice.reducer;