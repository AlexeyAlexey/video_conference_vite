export class VideoChunkDecoder {
  constructor({ videoElement, writable, maxQueue = 10, lossRate = 0 }) {
    this.videoElement = videoElement || null;
    this.externalWritable = writable || null;
    this.maxQueue = maxQueue;
    this.lossRate = lossRate;
    this.decoder = null;
    this.trackGen = null;
    this.writer = null;
    // TODO replace it by Queue
    // current implementation O(n)
    this.queue = [];
    this.processing = false;
  }

  configure(config) {
    try {
      if (this.decoder) {
        try { this.decoder.flush(); } catch { }
        try { this.decoder.close(); } catch { }
        this.decoder = null;
      }
      if (!this.externalWritable) {
        try { this.writer?.close(); } catch { }
        this.writer = null;
        try { this.trackGen?.stop?.(); } catch { }
        this.trackGen = new MediaStreamTrackGenerator({ kind: 'video' });
        const decodedStream = new MediaStream([this.trackGen]);
        if (this.videoElement) {
          try { this.videoElement.srcObject = decodedStream; } catch { }
          try { this.videoElement.play?.(); } catch { }
        }
        this.writer = this.trackGen.writable.getWriter();
      } else {
        this.writer = this.externalWritable;
      }

      const self = this;
      this.decoder = new VideoDecoder({
        output(frame) {
          try {
            const w = self.writer;
            if (w) {
              const f = frame;
              w.write(f)
                .then(() => { try { f.close(); } catch { } })
                .catch(() => { try { f.close(); } catch { } });
            } else {
              frame.close();
            }
          } catch {
            try { frame.close(); } catch { }
          }
        },
        error(e) { console.warn('Decoder error:', e); }
      });
      this.decoder.configure(config);
    } catch (e) {
      console.warn('Decoder configure failed:', e);
    }
  }

  async _pump() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length) {
        const decodedChunk = this.queue.shift();
        this.process(decodedChunk);
        await Promise.resolve();
      }
    } finally {
      this.processing = false;
      if (this.queue.length) this._pump();
    }
  }

  // enqueue(data, { timestamp = 0, isDelta = false, seq = 0 } = {}) {
  enqueue(decodedChunk) {
    if (this.queue.length >= this.maxQueue) {
      if (decodedChunk.isDelta) return;
      this.queue = [];
    }
    this.queue.push(decodedChunk);
    this._pump();
  }

  process(decodedChunk) {
    try {
      if (this.decoder && this.decoder.state === 'configured') {
        let evc;
        try {
          evc = new EncodedVideoChunk({ type: decodedChunk.type, timestamp: decodedChunk.ts, data: decodedChunk.body });
        } catch (ctorErr) {
          console.debug('Failed to construct EncodedVideoChunk from bytes', ctorErr);
          evc = null;
        }
        if (evc) {
          this.decoder.decode(evc);
        }
      }
    } catch (e) {
      console.debug('decode submit failed:', e);
    }
  }

  reset() {
    try { this.decoder?.flush(); } catch { }
    try { this.decoder?.close(); } catch { }
    this.decoder = null;
    if (!this.externalWritable) {
      try { this.writer?.close(); } catch { }
      this.writer = null;
      try { this.trackGen?.stop?.(); } catch { }
      this.trackGen = null;
      if (this.videoElement) {
        try { this.videoElement.srcObject = null; } catch { }
      }
    } else {
      this.writer = null;
    }
    this.queue = [];
    this.processing = false;
  }

}

// const config = {
//   codec: 'avc1.42001E',
//   description: avcConfigBuffer, // Uint8Array/ArrayBuffer with avcC
//   codedWidth: 1280,
//   codedHeight: 720,
//   hardwareAcceleration: 'prefer-hardware',
//   optimizeForLatency: true
// };
// const config = {
//   codec: 'vp8',
//   codedWidth: 1280,
//   codedHeight: 720,
//   hardwareAcceleration: 'prefer-software',
//   optimizeForLatency: true
// };
// <script type="module">
//   import { VideoChunkDecoder } from './decoder.js';

//   const dec = new VideoChunkDecoder({ videoElement: document.getElementById('decoded') });

//   // When you receive config (e.g., from remote server)
//   dec.configure(decoderConfig);

//   // When you receive a chunk (e.g., Uint8Array body, headers carry ts/keyframe)
//   dec.enqueue(u8, { timestamp: Number(ts), isDelta: keyframe === false, seq });
// </script>