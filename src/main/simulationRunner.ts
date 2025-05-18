/**
 * SimulationRunner: Executes an agent scenario for testing/debugging.
 * This is a wrapper around the agent's prompt execution logic.
 */

import type { EditFormat } from '@common/types';

// In the future, this will use the agent's prompt logic with editFormat support.
export class SimulationRunner {
  static async run(scenario: string, format: EditFormat): Promise<string> {
    // TODO: Replace with actual agent prompt execution and use format in the logic.
    // For now, just echo the scenario and format for testing.
    return `[Format: ${format}] ${scenario}`;
  }
}