import { vi } from 'vitest';
import { TEST_APP_URL } from './environment';

/** Pull-controlled Web request; header rejection can be proved without a read. */
export function streamedRequest(chunks: Iterable<Uint8Array>, headers?: HeadersInit, method = 'POST') {
  const iterator = chunks[Symbol.iterator]();
  const cancel = vi.fn();
  const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => {
    const next = iterator.next();
    if (next.done) controller.close();
    else controller.enqueue(next.value);
  });
  const body = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
  const init: RequestInit & { duplex: 'half' } = { method, headers, body, duplex: 'half' };
  return { request: new Request(`${TEST_APP_URL}/api/synthetic`, init), pull, cancel };
}

export function* byteChunks(text: string, size = 64 * 1024): Generator<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  for (let offset = 0; offset < bytes.length; offset += size) yield bytes.subarray(offset, offset + size);
}
