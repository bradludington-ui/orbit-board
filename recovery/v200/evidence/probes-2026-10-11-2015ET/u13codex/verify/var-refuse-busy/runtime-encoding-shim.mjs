// Task-local environment adaptation only. Product and existing tools remain byte-identical.
import { JSDOM } from 'jsdom';
import { TextEncoder, TextDecoder } from 'node:util';
const d = Object.getOwnPropertyDescriptor(JSDOM.prototype, 'window');
Object.defineProperty(JSDOM.prototype, 'window', {
  ...d,
  get() {
    const w = d.get.call(this);
    if (!w.TextEncoder) w.TextEncoder = TextEncoder;
    if (!w.TextDecoder) w.TextDecoder = TextDecoder;
    return w;
  }
});
