import { Injectable, Signal, signal } from '@angular/core';
import { AppError, Role } from '../api/api.models';
import { appError, fromCode } from '../api/errors';
import { record } from '../api/guards';
import { environment } from '../../../environments/environment';
import { MOCK_EXPLANATIONS, mockMode } from '../../mocks/fixtures';
import { SseParser } from './sse-parser';

export interface ExplainState {
  status: 'idle' | 'streaming' | 'done' | 'error';
  text: string;
  error: AppError | null;
  model?: string;
}
export interface ExplainHandle {
  state: Signal<ExplainState>;
  cancel: () => void;
}

@Injectable({ providedIn: 'root' })
export class ExplainStreamService {
  get enabled(): boolean {
    return environment.explanationsEnabled;
  }
  open(forecastId: string, role: Role): ExplainHandle {
    if (!this.enabled) {
      const disabled = signal<ExplainState>({ status: 'idle', text: '', error: null });
      return { state: disabled.asReadonly(), cancel: () => undefined };
    }
    const controller = new AbortController();
    const state = signal<ExplainState>({ status: 'streaming', text: '', error: null });
    const run = async () => {
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      try {
        let stream: ReadableStream<Uint8Array>;
        if (environment.useMocks) stream = this.mockStream(role, controller.signal);
        else {
          const response = await fetch(`${environment.apiUrl}/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
            body: JSON.stringify({ forecast_id: forecastId, role }),
            signal: controller.signal,
          });
          if (!response.ok) {
            const body: unknown = await response.json().catch(() => null);
            throw appError(body);
          }
          if (
            !response.body ||
            !response.headers.get('content-type')?.includes('text/event-stream')
          )
            throw fromCode('explanation_unavailable');
          stream = response.body;
        }
        reader = stream.getReader();
        const parser = new SseParser();
        const decoder = new TextDecoder();
        while (!controller.signal.aborted) {
          const chunk = await reader.read();
          const frames = parser.push(decoder.decode(chunk.value, { stream: !chunk.done }));
          for (const frame of frames) {
            const data: unknown = JSON.parse(frame.data);
            if (!record(data)) throw fromCode('explanation_unavailable');
            if (frame.event === 'delta' && typeof data['text'] === 'string')
              state.update((s) => ({ ...s, text: s.text + data['text'] }));
            else if (
              frame.event === 'done' &&
              typeof data['text'] === 'string' &&
              typeof data['model'] === 'string'
            ) {
              state.set({ status: 'done', text: data['text'], model: data['model'], error: null });
              return;
            } else if (frame.event === 'error')
              throw fromCode(
                typeof data['code'] === 'string' ? data['code'] : 'explanation_unavailable',
              );
            else if (frame.event !== 'start') throw fromCode('explanation_unavailable');
          }
          if (chunk.done) throw fromCode('explanation_unavailable');
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted)
          state.update((s) => ({ ...s, status: 'error', error: appError(error) }));
      } finally {
        await reader?.cancel().catch(() => undefined);
        reader?.releaseLock();
      }
    };
    void run();
    return {
      state: state.asReadonly(),
      cancel: () => {
        controller.abort();
        state.update((s) => (s.status === 'streaming' ? { ...s, status: 'idle' } : s));
      },
    };
  }
  private mockStream(role: Role, signal: AbortSignal): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setTimeout> | undefined;
    return new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, body: unknown) =>
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(body)}\n\n`));
        send('start', { role });
        const words = MOCK_EXPLANATIONS[role].match(/.{1,12}/gu) ?? [];
        let index = 0;
        const stop = () => {
          clearTimeout(timer);
          try {
            controller.close();
          } catch {
            /* Already closed. */
          }
        };
        signal.addEventListener('abort', stop, { once: true });
        const tick = () => {
          if (signal.aborted) return;
          if (mockMode() === 'explain-error') {
            send('error', { code: 'explanation_unavailable', message: 'mock' });
            stop();
            return;
          }
          const word = words[index++];
          if (word !== undefined) {
            send('delta', { text: word });
            timer = setTimeout(tick, 30 + Math.random() * 30);
          } else {
            send('done', { text: MOCK_EXPLANATIONS[role], model: 'Демонстрационный режим' });
            stop();
          }
        };
        timer = setTimeout(tick, 40);
      },
      cancel() {
        clearTimeout(timer);
      },
    });
  }
}
