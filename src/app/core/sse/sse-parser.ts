export interface SseFrame {
  event: string;
  data: string;
}
/** Incremental line parser: LF, CRLF, CR, comments and multiline data. */
export class SseParser {
  private line = '';
  private name = '';
  private data: string[] = [];
  private skipLf = false;
  push(chunk: string): SseFrame[] {
    const frames: SseFrame[] = [];
    for (const char of chunk) {
      if (this.skipLf && char === '\n') {
        this.skipLf = false;
        continue;
      }
      this.skipLf = false;
      if (char === '\r' || char === '\n') {
        if (this.line === '') {
          if (this.data.length)
            frames.push({ event: this.name || 'message', data: this.data.join('\n') });
          this.name = '';
          this.data = [];
        } else if (!this.line.startsWith(':')) {
          const colon = this.line.indexOf(':');
          const field = colon < 0 ? this.line : this.line.slice(0, colon);
          let value = colon < 0 ? '' : this.line.slice(colon + 1);
          if (value.startsWith(' ')) value = value.slice(1);
          if (field === 'event') this.name = value;
          if (field === 'data') this.data.push(value);
        }
        this.line = '';
        this.skipLf = char === '\r';
      } else this.line += char;
    }
    return frames;
  }
}
