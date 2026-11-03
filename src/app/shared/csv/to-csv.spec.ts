import { describe, expect, it } from 'vitest';
import { toCsv } from './to-csv';
describe('CSV', () => {
  it('uses BOM, CRLF, units, column order and empty nulls', () => {
    expect(
      toCsv({
        columns: [
          { key: 'value', label: 'foF2 (MHz)', unit: 'MHz' },
          { key: 'time', label: 'Время (UTC)', unit: null },
        ],
        rows: [
          { time: '2026-01-01T00:00:00Z', value: null },
          { value: 6.2, time: null },
        ],
      }),
    ).toBe('\uFEFFfoF2, MHz;Время (UTC)\r\n;2026-01-01T00:00:00Z\r\n6.2;\r\n');
  });
  it('escapes separators, quotes and multiline cells', () => {
    expect(
      toCsv({
        columns: [{ key: 'x', label: 'Подпись; "x"', unit: null }],
        rows: [{ x: 'строка\n"ещё";а' }],
      }),
    ).toBe('\uFEFF"Подпись; ""x"""\r\n"строка\n""ещё"";а"\r\n');
  });
  it('exports headers for an empty table', () => {
    expect(toCsv({ columns: [{ key: 'x', label: 'X', unit: 'MHz' }], rows: [] })).toBe(
      '\uFEFFX, MHz\r\n',
    );
  });
});
