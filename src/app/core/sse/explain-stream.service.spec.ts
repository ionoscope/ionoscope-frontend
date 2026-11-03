import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { ExplainStreamService } from './explain-stream.service';

const originalMocks = environment.useMocks;
const originalEnabled = environment.explanationsEnabled;
function response(text: string): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const bytes = encoder.encode(text);
        for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } },
  );
}
describe('POST explanation stream', () => {
  beforeEach(() => {
    environment.useMocks = false;
    environment.explanationsEnabled = true;
  });
  afterEach(() => {
    environment.useMocks = originalMocks;
    environment.explanationsEnabled = originalEnabled;
    vi.unstubAllGlobals();
  });
  it('does not fetch or simulate text while LLM is disabled', () => {
    environment.explanationsEnabled = false;
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const result = new ExplainStreamService().open('id', 'geodesist');
    expect(result.state().text).toBe('');
    expect(result.state().status).toBe('idle');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('reads split UTF-8 frames and replaces deltas with the final text', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        response(
          'event: start\ndata: {}\n\nevent: delta\ndata: {"text":"Часть"}\n\nevent: done\ndata: {"text":"Полный текст","model":"m"}\n\n',
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    const handle = new ExplainStreamService().open('server-id', 'geodesist');
    await vi.waitFor(() => expect(handle.state().status).toBe('done'));
    expect(handle.state().text).toBe('Полный текст');
    expect(fetcher.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ forecast_id: 'server-id', role: 'geodesist' }),
    );
  });
  it('reports an interrupted stream and keeps partial text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(response('event: delta\ndata: {"text":"Часть"}\n\n')),
    );
    const handle = new ExplainStreamService().open('id', 'drone_pilot');
    await vi.waitFor(() => expect(handle.state().status).toBe('error'));
    expect(handle.state().text).toBe('Часть');
  });
  it('maps HTTP forecast expiration using local text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{"detail":{"code":"forecast_expired","message":"untrusted"}}', {
          status: 409,
        }),
      ),
    );
    const handle = new ExplainStreamService().open('id', 'geodesist');
    await vi.waitFor(() => expect(handle.state().status).toBe('error'));
    expect(handle.state().error?.message).toBe('Прогноз устарел. Запросите новый.');
  });
  it('cancels its fetch and suppresses an abort error', async () => {
    let aborted = false;
    vi.stubGlobal(
      'fetch',
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const handle = new ExplainStreamService().open('id', 'geodesist');
    handle.cancel();
    await vi.waitFor(() => expect(aborted).toBe(true));
    expect(handle.state().status).toBe('idle');
    expect(handle.state().error).toBeNull();
  });
});
