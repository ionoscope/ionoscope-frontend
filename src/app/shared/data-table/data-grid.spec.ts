import { describe, expect, it } from 'vitest';
import { compareCells } from './data-grid.component';
describe('table sorting preserves missing values', () => {
  it('sorts numbers numerically in either direction', () => {
    const values = [12, 2, 0.5];
    expect([...values].sort((a, b) => compareCells(a, b, 1))).toEqual([0.5, 2, 12]);
    expect([...values].sort((a, b) => compareCells(a, b, -1))).toEqual([12, 2, 0.5]);
  });
  it('keeps unknown errors after measured errors in both directions', () => {
    for (const direction of [1, -1]) {
      expect(compareCells(null, 0, direction)).toBe(1);
      expect(compareCells(0, null, direction)).toBe(-1);
      expect(compareCells(null, null, direction)).toBe(0);
    }
  });
});
