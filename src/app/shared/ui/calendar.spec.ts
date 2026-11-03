import { describe, expect, it } from 'vitest';
import { monthGrid, shiftDay } from './calendar';
describe('UTC calendar boundaries', () => {
  it('starts on Monday and includes leap day without timezone drift', () => {
    const grid = monthGrid(2024, 1);
    expect(grid[0]?.iso).toBe('2024-01-29');
    expect(grid).toHaveLength(42);
    expect(grid.filter((day) => day.current)).toHaveLength(29);
    expect(grid.find((day) => day.iso === '2024-02-29')?.current).toBe(true);
  });
  it('moves across year and leap day boundaries', () => {
    expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftDay('2024-03-01', -1)).toBe('2024-02-29');
  });
});
