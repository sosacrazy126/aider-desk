import { createAsyncThunk } from '@reduxjs/toolkit';
import { createTestCase } from './debugSlice';

export const runDebugLoop = createAsyncThunk(
  'debug/runDebugLoop',
  async (
    { scenario, expected }: { scenario: string; expected: string },
    { dispatch }
  ) => {
    // Create the test case as 'pending'
    dispatch(createTestCase({ scenario, expected }));
    // Stub for future simulation, patching, and verification steps
    // TODO: Integrate simulation, patching, and verification here
    return;
  }
);