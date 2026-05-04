import pcmPlayerProcessorUrl from './pcm-player-processor.js?&url'

export class AudioChunkDecoder {
  constructor({ audioContext = null } = {}) {
    this.ctx = audioContext || null;
    this.node = null;
    this.decoder = null;
    this.initialized = false;
    this.configured = false;
  }

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    }
    if (!this.ctx.audioWorklet) throw new Error('AudioWorklet unsupported');

    if (!this.initialized) {
      // Load the PCM player processor
      // await this.ctx.audioWorklet.addModule(new URL('./pcm-player-processor.js', import.meta.url));
      await this.ctx.audioWorklet.addModule(pcmPlayerProcessorUrl);

      this.node = new AudioWorkletNode(this.ctx, 'pcm-player');
      this.node.connect(this.ctx.destination);

      this.initialized = true;
      if (this.ctx.state === 'suspended') {
        try { await this.ctx.resume(); } catch { }
      }
    }
  }

  configure(config) {
    if (this.decoder) {
      try { this.decoder.flush(); } catch { }
      try { this.decoder.close(); } catch { }
      this.decoder = null;
    }
    const self = this;
    this.decoder = new AudioDecoder({
      output(audioData) {
        try {
          const ch = audioData.numberOfChannels;
          const frames = audioData.numberOfFrames;
          const format = 'f32';
          const planes = [];
          for (let i = 0; i < ch; i++) {
            const buf = new Float32Array(frames);
            audioData.copyTo(buf, { planeIndex: i, format });
            planes.push(buf);
          }
          // Post to worklet; transfer underlying buffers
          const transfer = planes.map(p => p.buffer);
          self.node?.port.postMessage({ type: 'push', frames, channels: planes.length, planes }, transfer);
        } catch { }
        try { audioData.close(); } catch { }
      },
      error(e) { console.error('AudioDecoder error:', e); }
    });
    try {
      this.decoder.configure({
        codec: config.codec ?? 'opus',
        sampleRate: config.sampleRate ?? 48000,
        numberOfChannels: config.numberOfChannels ?? 2,
        description: config.description,
      });
      this.configured = true;
    } catch (e) {
      console.error('AudioDecoder configure failed:', e);
      this.configured = false;
    }
  }

  enqueue(data) {
    if (!this.decoder || this.decoder.state !== 'configured') return;
    try {

      const u8 = (data.body instanceof Uint8Array) ? data.body : new Uint8Array(data.body);
      const chunk = new EncodedAudioChunk({ type: 'key', timestamp: Number(data.ts || 0), data: u8 });

      this.decoder.decode(chunk);
    } catch (e) {
      console.error('audio decode submit failed:', e);
    }
  }

  async reset() {
    try { await this.decoder?.flush(); } catch { }
    try { this.decoder?.close(); } catch { }
    this.decoder = null;
    try { this.node?.disconnect(); } catch { }
    this.node = null;
    try { await this.ctx?.close(); } catch { }
    this.ctx = null;
    this.initialized = false;
    this.configured = false;
  }
}

