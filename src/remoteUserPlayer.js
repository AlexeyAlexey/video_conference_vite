import { VideoChunkDecoder } from '@/videoDecoder.js';
import { AudioChunkDecoder } from '@/audioDecoder.js';

export class RemoteUserPlayer {

  constructor(videoElement) {
    this.mediaStream = null;
    this.decodedTrackGen = null;
    this.decodedWriter = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false
    this.codec = 'vp8'
    this.videoDecoder = null;
    this.audioDecoder = null;
    this.isAudioDecoderReady = false;


    this.video = videoElement;
    this.video.setAttribute("autoplay", true);
    this.video.setAttribute("muted", true);
    this.video.setAttribute("playsinline", '');
  }

  async startVideo(settings = {}) {
    this.videoDecoder = new VideoChunkDecoder({ videoElement: this.video });

    try {
      if ('VideoDecoder' in window && typeof VideoDecoder.isConfigSupported === 'function') {
        const config = {
          codec: settings.codec || 'vp8',
          codedWidth: settings.codedWidth || 1280,
          codedHeight: settings.codedHeight || 720,
          hardwareAcceleration: settings.hardwareAcceleration || 'prefer-software',
          optimizeForLatency: true,
        };
        const support = await VideoDecoder.isConfigSupported(config);
        if (support && support.supported) {
          this.videoDecoder.configure(support.config || config);
        }
      }
    } catch { }
  }

  async startAudio(settings = {}) {
    this.audioDecoder = new AudioChunkDecoder();

    const sampleRate = settings.sampleRate ?? 48000;
    const numberOfChannels = settings.channelCount ?? 1;

    try {
      try { await this.audioDecoder.init(); } catch (e) { console.log(`Audio decoder cannot be initialized ${e}`) }
      try { this.audioDecoder.configure({ codec: 'opus', sampleRate, numberOfChannels }); } catch (e) { console.log(`Audio decoder cannot be configured ${e}`) }
      console.log(`Audio decoder initialized and configured`)
    } catch { }

    this.isAudioDecoderReady = true;
  }

  async start(videoSettings = {}, audioSettings = {}) {

    this.startVideo(videoSettings);
    this.startAudio(audioSettings);

  }

  destroy() {

    if (element) {
      element.remove();
    }
  }

  playVideo(videoChunk) {
    this.videoDecoder.enqueue(videoChunk);
  }

  playAudio(videoChunk) {
    if (this.isAudioDecoderReady = true) { this.audioDecoder.enqueue(videoChunk) }

  }
}