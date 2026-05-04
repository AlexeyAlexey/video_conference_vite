class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.queue = []; // each item: { planes: Float32Array[], frames: number, offset: 0 }
    this.channelsOut = 2;
    this.port.onmessage = (e) => {
      const msg = e.data;
      if (msg && msg.type === 'push' && Array.isArray(msg.planes)) {
        const planes = msg.planes.map((p) => new Float32Array(p));
        const frames = msg.frames >>> 0;
        this.queue.push({ planes, frames, offset: 0 });
      }
    };
  }

  process(inputs, outputs /*, parameters */) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const outChannels = output.length;
    const renderFrames = output[0].length;

    let written = 0;
    while (written < renderFrames) {
      if (this.queue.length === 0) {
        // no data, write silence for remaining frames
        for (let ch = 0; ch < outChannels; ch++) {
          output[ch].fill(0, written);
        }
        break;
      }
      const cur = this.queue[0];
      const available = cur.frames - cur.offset;
      const toCopy = Math.min(available, renderFrames - written);

      // For each output channel, copy from corresponding input plane if exists, else mix or silence
      for (let ch = 0; ch < outChannels; ch++) {
        const out = output[ch];
        const srcCh = ch < cur.planes.length ? cur.planes[ch] : null;
        if (srcCh) {
          // copy contiguous slice
          out.set(srcCh.subarray(cur.offset, cur.offset + toCopy), written);
        } else if (cur.planes.length === 1) {
          // mono -> duplicate
          const mono = cur.planes[0];
          out.set(mono.subarray(cur.offset, cur.offset + toCopy), written);
        } else {
          // more complex mismatch, just silence
          for (let i = 0; i < toCopy; i++) out[written + i] = 0;
        }
      }

      written += toCopy;
      cur.offset += toCopy;
      if (cur.offset >= cur.frames) {
        this.queue.shift();
      }
    }

    // If we didn't fully fill, ensure silence in remaining region
    if (written < renderFrames) {
      for (let ch = 0; ch < outChannels; ch++) {
        const out = output[ch];
        for (let i = written; i < renderFrames; i++) out[i] = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-player', PCMPlayerProcessor);
