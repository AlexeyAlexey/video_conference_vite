import { describe, it, expect, vi } from 'vitest';
import { ConferenceStreamParser } from './conferenceStreamParser.js';

// Silence HealthCheck speed logs
vi.spyOn(console, 'log').mockImplementation(() => {});

const M = 77, S = 83, E = 69; // 'M', 'S', 'E'

// <<'M', 'S', 'E', payload_length::32, payload>>
function frame(payload) {
  const f = new Uint8Array(7 + payload.length);
  f[0] = M; f[1] = S; f[2] = E;
  new DataView(f.buffer).setUint32(3, payload.length, false);
  f.set(payload, 7);
  return f;
}

function concat(...arrays) {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0));
  let pos = 0;
  for (const a of arrays) { out.set(a, pos); pos += a.length; }
  return out;
}

function collect(parser) {
  const out = [];
  const controller = { enqueue: (p) => out.push(p) };
  return { out, feed: (chunk) => parser.transform(chunk, controller) };
}

describe('ConferenceStreamParser', () => {
  it('extracts the payload of a complete frame', () => {
    const parser = new ConferenceStreamParser();
    const { out, feed } = collect(parser);

    feed(frame(new Uint8Array([1, 2, 3])));

    expect(out).toHaveLength(1);
    expect([...out[0]]).toEqual([1, 2, 3]);
    expect(parser.offset).toBe(0);
  });

  it('reassembles a frame split across chunks, including the header', () => {
    const parser = new ConferenceStreamParser();
    const { out, feed } = collect(parser);
    const f = frame(new Uint8Array([9, 8, 7, 6, 5]));

    feed(f.subarray(0, 4)); // 'MSE' + first length byte
    expect(out).toHaveLength(0);

    feed(f.subarray(4));
    expect(out).toHaveLength(1);
    expect([...out[0]]).toEqual([9, 8, 7, 6, 5]);
    expect(parser.offset).toBe(0);
  });

  it('extracts multiple frames from a single chunk', () => {
    const parser = new ConferenceStreamParser();
    const { out, feed } = collect(parser);

    feed(concat(frame(new Uint8Array([1])), frame(new Uint8Array([2, 2])), frame(new Uint8Array([3, 3, 3]))));

    expect(out.map((p) => [...p])).toEqual([[1], [2, 2], [3, 3, 3]]);
    expect(parser.offset).toBe(0);
  });

  it('skips garbage bytes before a frame', () => {
    const parser = new ConferenceStreamParser();
    const { out, feed } = collect(parser);

    feed(concat(new Uint8Array([0, 1, 2, M, 1, 2]), frame(new Uint8Array([42]))));

    expect(out).toHaveLength(1);
    expect([...out[0]]).toEqual([42]);
    expect(parser.offset).toBe(0);
  });

  it('recovers a split marker kept at the buffer tail', () => {
    const parser = new ConferenceStreamParser(16);
    const { out, feed } = collect(parser);

    const junk = new Uint8Array(20).fill(0xAA); // overflows the buffer, no marker inside
    junk[19] = M; // ends with 'M' which may start a marker split across chunks
    feed(junk);

    const f = frame(new Uint8Array([6]));
    feed(f.subarray(1)); // 'SE' + length + payload completes the 'M' tail

    expect(out).toHaveLength(1);
    expect([...out[0]]).toEqual([6]);
  });

  describe('maxPayloadSize', () => {
    it('skips a frame whose declared payload exceeds the cap and recovers the next frame', () => {
      const parser = new ConferenceStreamParser(1024, 8);
      const { out, feed } = collect(parser);

      feed(concat(frame(new Uint8Array(20)), frame(new Uint8Array([4, 4]))));

      expect(out).toHaveLength(1);
      expect([...out[0]]).toEqual([4, 4]);
    });

    it('accepts a payload exactly at the cap and rejects one byte over', () => {
      const parser = new ConferenceStreamParser(1024, 4);
      const { out, feed } = collect(parser);

      feed(frame(new Uint8Array([1, 2, 3, 4])));
      expect(out).toHaveLength(1);
      expect([...out[0]]).toEqual([1, 2, 3, 4]);

      feed(frame(new Uint8Array(5)));
      expect(out).toHaveLength(1);
    });
  });

  describe('maxBufferSize', () => {
    it('drops a stalled frame and resyncs to the next marker on overflow', () => {
      const parser = new ConferenceStreamParser(64);
      const { out, feed } = collect(parser);

      feed(frame(new Uint8Array(50)).subarray(0, 40)); // incomplete frame, offset=40
      expect(out).toHaveLength(0);

      const next = new Uint8Array(40);
      next.set(frame(new Uint8Array([8])), 0); // 40 + 40 > 64 triggers resync
      feed(next);

      expect(out).toHaveLength(1);
      expect([...out[0]]).toEqual([8]);
      expect(parser.offset).toBeLessThanOrEqual(64);
    });

    it('keeps only the newest bytes of a chunk larger than the cap', () => {
      const parser = new ConferenceStreamParser(32);
      const { out, feed } = collect(parser);

      const big = new Uint8Array(64).fill(0);
      const good = frame(new Uint8Array([1, 1]));
      big.set(good, 64 - good.length); // valid frame in the tail
      feed(big);

      expect(out).toHaveLength(1);
      expect([...out[0]]).toEqual([1, 1]);
    });

    it('never lets the buffered data exceed the cap', () => {
      const parser = new ConferenceStreamParser(64);
      const { feed } = collect(parser);
      const rand = new Uint8Array(50);

      for (let i = 0; i < 200; i++) {
        rand.fill(Math.floor(Math.random() * 256));
        feed(rand);
        expect(parser.offset).toBeLessThanOrEqual(64);
      }
    });
  });
});
