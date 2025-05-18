import { SimulationRunner } from '@/main/simulationRunner';
import { setEditFormat } from '@/state/projectSettingsSlice';
import store from '@/state/store';
import { runDebugLoop } from '@/state/debugSlice';

describe('edit-format propagation', () => {
  it('stores selected format in projectSettings', () => {
    store.dispatch(setEditFormat('udiff'));
    expect(store.getState().projectSettings.editFormat).toBe('udiff');
  });

  it('passes format to SimulationRunner', async () => {
    vi.spyOn(SimulationRunner, 'runScenario').mockResolvedValue('ok');
    store.dispatch(setEditFormat('udiff'));
    await store.dispatch(runDebugLoop('2+2=5', '4') as any);
    expect(SimulationRunner.runScenario).toHaveBeenCalledWith(
      '2+2=5', 'udiff'
    );
  });
});