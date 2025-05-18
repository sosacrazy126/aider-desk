import { runPrompt } from '@/agent';
import type { EditFormat } from '@common/types';

export class SimulationRunner {
  static async runScenario(scenario: string, format: EditFormat): Promise<string> {
    const res = await runPrompt(scenario, { mode: 'debug', editFormat: format });
    return res[0]?.content ?? '';
  }
}