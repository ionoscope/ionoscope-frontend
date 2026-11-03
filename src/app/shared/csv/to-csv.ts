import { ForecastTable } from '../../core/api/api.models';
function escape(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function toCsv(table: ForecastTable): string {
  const headers = table.columns.map((column) => {
    // API labels may already include units. Avoid "foF2 (MHz), MHz".
    const label =
      column.unit && column.label.endsWith(` (${column.unit})`)
        ? column.label.slice(0, -(column.unit.length + 3))
        : column.label;
    return escape(column.unit ? `${label}, ${column.unit}` : label);
  });
  return (
    '\uFEFF' +
    [
      headers.join(';'),
      ...table.rows.map((row) => table.columns.map((column) => escape(row[column.key])).join(';')),
    ].join('\r\n') +
    '\r\n'
  );
}
export function downloadCsv(table: ForecastTable, filename: string): void {
  const url = URL.createObjectURL(new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
