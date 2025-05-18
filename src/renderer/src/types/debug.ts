export type DebugTestCaseStatus = 'pending' | 'failing' | 'passing';

export interface DebugTestCase {
  id: string;
  scenario: string;
  expected: string;
  actual?: string;
  attempts: number;
  status: DebugTestCaseStatus;
  patches: string[]; // In future, could be an array of patch objects
}

export interface DebugSession {
  isActive: boolean;
  tests: DebugTestCase[];
  activeTestId?: string;
}