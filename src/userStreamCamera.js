import { AudioChunkDecoder } from '@/audioDecoder.js';
import { encodeVideoChunk } from '@/utils/encodeVideoChunk.js';
import { encodeAudioChunk } from '@/utils/encodeAudioChunk.js';
import { eventDispatcher } from '@/eventDispatcher.js';


class UserStreamCameraVideo {

  constructor(mediaStream, audioStream, settings = { codec: 'vp8' }) {
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false;
    // this.codec = settings.codec;
    this.mediaStream = mediaStream;
    this.audioStream = audioStream;
    this.settings = settings;
    this.videoEnabled = settings.videoEnabled;
    this.configure = {}
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
  }

  destroy() {

    // if (element) {
    //   element.remove();
    // }
  }

  enable() {
    console.log("this.videoEnabled")
    console.log(this.videoEnabled)
    this.videoEnabled = true;
  }

  disable() {
    this.videoEnabled = false;
  }

  abort() {
    this.abortController?.abort()
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.chunksCount = 0;

    const track = this.mediaStream.getVideoTracks()[0];
    const settings = track.getSettings();
    const width = settings.width || this.settings.width || 1280;
    const height = settings.height || this.settings.height || 720;
    const fr = Math.round(settings.frameRate || this.settings.frameRate || 30);
    const encWidth = (width & ~1) || this.settings.width || 1280;
    const encHeight = (height & ~1) || this.settings.height || 720;


    if (!('VideoEncoder' in window) || !('MediaStreamTrackProcessor' in window)) {
      console.warn('WebCodecs not supported in this browser/context');
      this.running = false;
      return;
    }

    const codec = this.settings.codec || 'vp8';

    const support = await VideoEncoder.isConfigSupported({
      codec,
      width: encWidth,
      height: encHeight,
      hardwareAcceleration: 'prefer-software',
      bitrate: 1_000_000,
      framerate: fr,
      latencyMode: 'realtime',
      avc: codec.startsWith('avc1') ? { format: 'annexb' } : undefined,
    }).catch((e) => {
      console.error('Error:', e);
      return { supported: false };
    });

    console.log('support:', support);

    if (!support?.supported) {
      console.warn('Config not supported falling back to baseline');
    }
    //   encoding bitrates are typically defined in bits per second (bps)
    const config = support?.config ?? {
      codec: codec,
      width: encWidth,
      height: encHeight,
      hardwareAcceleration: 'prefer-software',
      bitrate: 800_000,
      framerate: fr,
      latencyMode: 'realtime',
    };

    this.configure = {
      codec: config.codec,
      width: config.width,
      height: config.height,
      hardwareAcceleration: config.hardwareAcceleration,
      bitrate: config.bitrate,
      framerate: config.framerate,
      latencyMode: config.latencyMode
    }



    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        // TODO It can be pushed to a server for decoder
        if (this.videoEnabled) { this.#onChunk(chunk, metadata); }

      },
      error: (e) => {
        console.error('Encoder error:', e);
      }
    });

    try {
      this.encoder.configure(config);
    } catch (e) {
      try {
        this.encoder.close();
      } catch { }
      this.encoder = new VideoEncoder({
        output: (chunk, metadata) => {
          this.#onChunk(chunk, metadata);
        },
        error: (err) => {
          console.error('Encoder error:', err);
        }
      });
      const fallback = {
        codec: this.codec,
        width: encWidth,
        height: encHeight,
        hardwareAcceleration: 'no-preference',
        bitrate: 800_000,
        framerate: fr || 30,
        latencyMode: 'realtime',
      };

      this.configure = {
        codec: fallback.codec,
        width: fallback.width,
        height: fallback.height,
        hardwareAcceleration: fallback.hardwareAcceleration,
        bitrate: fallback.bitrate,
        framerate: fallback.framerate,
        latencyMode: fallback.latencyMode
      }
      try {
        this.encoder.configure(fallback);
      } catch (e2) {
        console.error('Encoder configure failed:', e2);
        this.running = false;
        try { this.reader?.releaseLock(); } catch { }
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(t => t.stop());
          this.mediaStream = null;
        }
        return;
      }
    }

    this.processor = new MediaStreamTrackProcessor({ track });
    this.reader = this.processor.readable.getReader();

    console.log('encoding');

    (async (self) => {
      while (self.running) {
        const { value: frame, done } = await self.reader.read().catch((e) => ({ done: true, value: undefined }));
        if (done || !frame) break;
        try {
          const insertKey = self.frameCount % self.keyInterval === 0;
          self.encoder.encode(frame, { keyFrame: insertKey });
          self.frameCount++;
        } catch (e) {
          console.error('encode failed', e);
        } finally {
          frame.close();
        }
        if (self.signal.aborted) break;
      }

      try {
        await self.encoder.flush();
      } catch (e) {
        console.warn('flush warn', e);
      }
    })(this);
  }

  // Improve package
  #encodeChunk(chunk) {
    return encodeVideoChunk(chunk)
  }


  #onChunk(chunk, metadata) {
    try {
      const u8 = new Uint8Array(chunk.byteLength);
      chunk.copyTo(u8);
      this.chunksCount += 1;

      this.#encodeChunk({
        type: String(chunk.type),
        ts: chunk.timestamp ?? 0,
        len: u8.byteLength,
        key: metadata?.delta ? false : true,
        seq: this.chunksCount,
        body: u8
      }).then(finalBuffer => {

        this.audioStream(finalBuffer)

      }).catch((e) => {
        console.error('Error encodeChunk: ', e);
      });

    } catch (e) {
      console.error('Chunk copy failed:', e);
    }
  }
}

class UserStreamCameraAudio {

  constructor(mediaStream, audioStream, settings = {}) {
    this.abortController = null;
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false;
    this.mediaStream = mediaStream;
    this.audioStream = audioStream;
    this.settings = settings;
    this.audioTrack = null;
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.audioEnabled = settings.audioEnabled;

    this.configure = {};
    this.codec = settings.codec ?? 'opus';
    this.bitrate = settings.bitrate ?? 64_000;


    this.localAudioDecode = new AudioChunkDecoder();


    this.audioEncoder = null;
    this.audioProcessor = null;
    this.audioReader = null;

  }

  destroy() {
    if (element) {
      element.remove();
    }
  }

  abort() {
    this.abortController?.abort()
  }

  enable() {
    this.audioEnabled = true;
  }

  disable() {
    this.audioEnabled = false;
  }

  async start() {
    if (this.running) return;

    this.audioTrack = this.mediaStream.getAudioTracks()[0];
    if (this.audioTrack && 'AudioEncoder' in window && 'MediaStreamTrackProcessor' in window) {
      try {
        this.chunksCount = 0;
        const aSettings = this.audioTrack.getSettings ? this.audioTrack.getSettings() : {};
        const sampleRate = aSettings.sampleRate ?? 48000;
        const numberOfChannels = aSettings.channelCount ?? 1;

        const support = await (AudioEncoder.isConfigSupported?.({
          codec: this.codec,
          sampleRate,
          numberOfChannels,
          bitrate: this.bitrate,
        }).catch(() => ({ supported: false })));

        const aConfig = support?.config ?? {
          codec: this.codec,
          sampleRate,
          numberOfChannels,
          bitrate: this.bitrate,
        };

        this.configure = {
          codec: this.codec,
          sampleRate: sampleRate,
          channelCount: numberOfChannels,
          bitrate: this.bitrate
        }

        this.audioEncoder = new AudioEncoder({
          output: (chunk /* EncodedAudioChunk */, metadata) => {

            if (this.audioEnabled) { this.#onChunk(chunk, metadata) }
          },
          error: (e) => {
            console.error('AudioEncoder error:', e);
          }
        });

        try {
          this.audioEncoder.configure(aConfig);
        } catch (e) {
          try { this.audioEncoder.close(); } catch { }
          this.audioEncoder = null;
        }

        if (this.audioEncoder) {
          this.audioProcessor = new MediaStreamTrackProcessor({ track: this.audioTrack });
          this.audioReader = this.audioProcessor.readable.getReader();

          this.running = true;

          (async (self) => {
            while (self.running) {
              const { value: audioData, done } = await self.audioReader.read().catch(() => ({ done: true, value: undefined }));
              if (done || !audioData) break;
              try {
                self.audioEncoder.encode(audioData);
              } catch (e) {
                console.error('audio encode failed', e);
              } finally {
                try { audioData.close?.(); } catch { }
              }
              if (self.signal.aborted) break;
            }

            try { await self.audioEncoder.flush(); } catch { }
          })(this);
        }
      } catch (e) {
        console.warn('Audio pipeline init failed:', e);
      }
    }
  }

  #encodeChunk(chunk) {
    return encodeAudioChunk(chunk);
  }

  #onChunk(chunk, metadata) {
    try {
      const u8 = new Uint8Array(chunk.byteLength);
      chunk.copyTo(u8);
      this.chunksCount += 1;

      this.#encodeChunk({
        seq: String(this.chunksCount),
        type: String(chunk.type),
        ts: String(chunk.timestamp ?? 0),
        body: u8
      }).then(finalBuffer => {

        this.audioStream(finalBuffer)

      }).catch((e) => {
        console.error('Error encodeChunk: ', e);
      });
    } catch (e) {
      console.error('Audio chunk copy failed:', e);
    }
  }


}

export class UserStreamCamera {
  constructor(videoElement, videoStream = null, audioStream = null, videoSettings = {}, audioSettings = {}) {
    this.mediaStream = null;
    this.abortController = null;
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false
    this.videoStream = videoStream;
    this.audioStream = audioStream;
    this.videoSettings = videoSettings;
    this.audioSettings = audioSettings;
    this.videoProcessor = null;
    this.videoEnabled = videoSettings.videoEnabled;
    this.audioEnabled = audioSettings.audioEnabled;

    this.runVideo = false;
    this.runAudio = false;

    this.video = videoElement;
    this.mediaRequest = null;

    this.video.setAttribute("autoplay", true);
    this.video.setAttribute("playsinline", '');


    this.ensureMediaStream()


  }

  setVideoStream(videoStream) {
    this.videoStream = videoStream;
  }

  setAudioStream(audioStream) {
    this.audioStream = audioStream;
  }

  enableVideo() {
    this.videoEnabled = true;
    this.videoSettings.videoEnabled = true;

    if (this.videoProcessor) {
      this.videoProcessor.videoEnabled = true;
    }
  }

  disableVideo() {
    this.videoEnabled = false;
    this.videoSettings.videoEnabled = false;

    if (this.videoProcessor) {
      this.videoProcessor.videoEnabled = false;
    }
  }

  stopVideo() {
    this.runVideo = false;
    this.audioEnabled = false;

    this.videoProcessor?.abort();
    this.videoProcessor = null;

    return true
  }

  enableAudio() {
    this.audioEnabled = true;
    this.audioSettings.audioEnabled = true;

    if (this.audioProcessor) {
      this.audioProcessor.audioEnabled = true;
    }
  }

  disableAudio() {
    this.audioEnabled = false;
    this.audioSettings.audioEnabled = false;

    if (this.audioProcessor) {
      this.audioProcessor.audioEnabled = false;
    }
  }

  async startVideo() {
    this.runVideo = true;

    if (this.videoProcessor) return true;

    if (!this.mediaStream) {
      await this.ensureMediaStream();
    }

    if (this.mediaStream && this.videoStream !== null) {
      this.videoProcessor = new UserStreamCameraVideo(
        this.mediaStream,
        this.videoStream,
        this.videoSettings)
      this.videoProcessor.start()

      console.log('video processing starting...');

      true
    } else {
      console.log('Media stream has not been initialized yet ...');
      false
    }
  }

  async startAudio() {
    this.runAudio = true;

    if (this.audioProcessor) return true;

    if (!this.mediaStream) {
      await this.ensureMediaStream();
    }

    if (this.mediaStream && this.audioStream !== null) {
      this.audioProcessor = new UserStreamCameraAudio(
        this.mediaStream,
        this.audioStream,
        { audioEnabled: this.audioEnabled })
      this.audioProcessor.start()
      console.log('audio processing starting...');
      true
    } else {
      console.log('Media stream has not been initialized yet ...');
      false
    }

  }

  stop(reason = 'stopped') {
    this.audioProcessor?.abort();
    this.videoProcessor?.abort();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  ensureMediaStream() {
    if (this.mediaStream) return Promise.resolve(this.mediaStream);
    if (this.mediaRequest) return this.mediaRequest;

    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error('Media devices are unavailable in this browser context');
      this.#onMediaError(err, 'unsupported');
      return Promise.resolve(null);
    }

    console.log('requesting camera');
    this.mediaRequest = navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: this.videoSettings.width },
        height: { ideal: this.videoSettings.height },
        frameRate: { ideal: this.videoSettings.frameRate }
      }
      // video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
    }).then(async (stream) => {
      console.info("mediaStream initialized")
      this.mediaStream = stream;

      this.video.srcObject = stream;
      await this.video.play().catch((e) => {
        console.error("video cannot be played", e)
      });

      return stream;
    }).catch((err) => {
      const reason = err?.name === 'NotAllowedError' ? 'denied'
        : (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') ? 'no-device'
          : err?.name === 'NotReadableError' ? 'in-use'
            : 'error';
      this.#onMediaError(err, reason);
      return null;
    }).finally(() => {
      this.mediaRequest = null;
    });

    return this.mediaRequest;
  }

  #onMediaError(err, reason) {
    if (reason === 'denied') {
      console.warn('Camera/microphone access denied — the call continues without local media. ' +
        'Allow camera and microphone in the browser (or open the app in a regular browser) to enable them.', err);
    } else {
      console.error('getUserMedia failed', err);
    }

    this.running = false;
    eventDispatcher.emit('user-media-error', { reason, error: err });
  }


}
