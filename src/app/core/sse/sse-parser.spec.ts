import { describe, expect, it } from 'vitest';
import { SseParser } from './sse-parser';
describe('SSE parser', () => {
  it('parses every possible chunk boundary, including CRLF', () => {
    const input =
      ': heartbeat\r\nevent: delta\r\ndata: {"text":"Привет"}\r\n\r\nevent: done\ndata: {"text":"Всё","model":"test"}\n\n';
    const expected = [
      { event: 'delta', data: '{"text":"Привет"}' },
      { event: 'done', data: '{"text":"Всё","model":"test"}' },
    ];
    for (let i = 0; i <= input.length; i++) {
      const parser = new SseParser();
      expect([...parser.push(input.slice(0, i)), ...parser.push(input.slice(i))]).toEqual(expected);
    }
  });
  it('handles single character chunks, comments and multiline data', () => {
    const parser = new SseParser();
    const input = ':ignored\revent: delta\rdata: one\rdata: two\r\r';
    expect([...input].flatMap((char) => parser.push(char))).toEqual([
      { event: 'delta', data: 'one\ntwo' },
    ]);
  });
  it('does not dispatch an incomplete frame at EOF', () => {
    expect(new SseParser().push('event: delta\ndata: partial')).toEqual([]);
  });
  it('preserves UTF-8 split between bytes with streaming decoder', () => {
    const bytes = new TextEncoder().encode('event: delta\ndata: Ионосфера\n\n');
    const decoder = new TextDecoder();
    const parser = new SseParser();
    const frames = Array.from(bytes).flatMap((byte) =>
      parser.push(decoder.decode(new Uint8Array([byte]), { stream: true })),
    );
    expect(frames).toEqual([{ event: 'delta', data: 'Ионосфера' }]);
  });
});
