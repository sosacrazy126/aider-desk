import { SimulationRunner } from '../../src/main/simulationRunner';
import type { EditFormat } from '../../src/common/types';

describe('EditFormat in Debug Mode', () => {
  it('maintains format consistency', async () => {
    const format: EditFormat = 'diff';
    const scenario = 'test scenario';
    const result = await SimulationRunner.run(scenario, format);
    expect(result.startsWith(`[Format: ${format}]`)).toBe(true);
    expect(result).toContain(scenario);
  });
});