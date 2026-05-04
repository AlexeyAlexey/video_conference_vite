import { ParticipantPlayer } from './participant_player.js';
import { AudioChunkDecoder } from './audio_decoder.js';



class CurrentParticipantCameraVideo {
  buffer = 'not defined'

  constructor(participantId, mediaStream, http3ServerStreamSendData, settings = { codec: 'vp8' }) {
    this.abortController = null;
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false;
    // this.codec = settings.codec;
    this.participantId = participantId;
    this.mediaStream = mediaStream;
    this.http3ServerStreamSendData = http3ServerStreamSendData;
    this.settings = settings;
    this.videoEnabled = settings.videoEnabled;
    this.configure = {}
  }

  destroy() {
    const element = document.getElementById(this.participantId);

    if (element) {
      element.remove();
    }
  }

  enable() {
    this.videoEnabled = true;
  }

  disable() {
    this.videoEnabled = false;
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

    const codec = this.settings.codec;

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

    this.abortController = new AbortController();
    const { signal } = this.abortController;

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
        if (signal.aborted) break;
      }

      try {
        await encoder.flush();
      } catch (e) {
        console.warn('flush warn', e);
      }
    })(this);
  }

  // Improve package
  #encodeChunk(chunk) {
    return new Promise((resolve, reject) => {
      // M::8bit S::8bit packageLength::32bit isVideo::8 participantId::32bit seq::32bit type::32bit key::32bit ts::64 byteLength::32bit body::(is variable size. This size we save into byteLength)
      const header = new Uint8Array(34);
      const headerView = new DataView(header.buffer);
      // 4 -  packageLength occupy 4 byte
      // 18 - isVideo + participantId + seq + type + key = 16 byte
      // 8 - BigInt(chunk.ts) = 8 byte
      // 4 - header chunk.body.byteLength value = 4byte
      // 18 + 8 + 4 = 30 (header size)
      const packageLength = 30 + chunk.body.byteLength; // bytes
      headerView.setUint32(0, packageLength, false);    // Package Size bytes
      headerView.setUint8(4, 1, false);    //  isVideo 1 is video; 0 is audio chunk
      headerView.setUint32(6, this.participantId, false);    // ID participantId
      headerView.setUint32(10, chunk.seq, false);    // chunks sequence
      headerView.setUint32(14, chunk.type == 'delta' ? 0 : 1, false);    // type delta => 0 else key => 1 TODO replace by one bit
      headerView.setUint32(18, chunk.key ? 1 : 0, false);    // key => 1 else delta => 0
      // Store 64-bit value at byte 20 (8 byte = 64 bit)
      headerView.setBigUint64(22, BigInt(chunk.ts), false);


      headerView.setUint32(30, chunk.body.byteLength, false); // chunk byte length
      // Merge to package
      // 2 byte are open byte and close byte
      const packed = new Uint8Array(2 + header.length + chunk.body.length);
      // Header MS - message start
      packed[0] = 77 // 'M'
      packed[1] = 83 // 'S'
      // header where is Package Size also
      packed.set(header, 2);
      packed.set(chunk.body, header.length + 2);

      resolve(packed);
    }).catch((err) => {
      // reject(err) 
      console.error(err);
    });
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

        this.http3ServerStreamSendData(finalBuffer)

      }).catch((e) => {
        console.error('Error encodeChunk: ', e);
      });

    } catch (e) {
      console.error('Chunk copy failed:', e);
    }
  }
}

class CurrentParticipantCameraAudio {
  buffer = 'not defined'

  constructor(participantId, mediaStream, http3ServerStreamSendData, settings = {}) {
    this.abortController = null;
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false;
    this.participantId = participantId;
    this.mediaStream = mediaStream;
    this.http3ServerStreamSendData = http3ServerStreamSendData;
    this.settings = settings;
    this.audioTrack = null;
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.audioEnabled = settings.audioEnabled;

    this.configure = {};
    this.codec = settings.codec ?? 'opus';
    this.bitrate = settings.bitrate ?? 64_000;

    // this.testParticipant = new ParticipantPlayer("1111111");
    // this.testParticipant.startAudio()

    this.localAudioDecode = new AudioChunkDecoder();


    this.audioEncoder = null;
    this.audioProcessor = null;
    this.audioReader = null;

  }

  destroy() {
    const element = document.getElementById(this.participantId);

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
    return new Promise((resolve, reject) => {
      // M::8bit S::8bit isVideo::16 packageLength::32bit participantId::32bit seq::32bit type::32bit ts::64 byteLength::32bit body::(is variable size. This size we save into byteLength)
      // { seq: String(this.chunksCount), type: String(chunk.type), ts: String(chunk.timestamp ?? 0), body: u8 }
      // {seq: '1', type: 'key', ts: '44804544653', body: Uint8Array(218)}
      const header = new Uint8Array(30);
      const headerView = new DataView(header.buffer);
      // 4 -  packageLength occupy 4 byte
      // 16 - isVideo + participantId + seq + type = 14 byte
      // 8 - BigInt(chunk.ts) = 8 byte
      // 4 - header chunk.body.byteLength value = 4byte
      // 14 + 8 + 4 = 26 (header size)
      const packageLength = 26 + chunk.body.byteLength; // bytes
      headerView.setUint32(0, packageLength, false);    // Package Size bytes
      headerView.setUint8(4, 0, false);    //  isVideo 1 is video; 0 is audio chunk
      headerView.setUint32(6, this.participantId, false);    // ID participantId
      headerView.setUint32(10, chunk.seq, false);    // chunks sequence
      headerView.setUint32(14, chunk.type == 'key' ? 1 : 0, false);    // type delta => 0 else key => 1 TODO replace by one bit
      // headerView.setUint32(16, chunk.key ? 1 : 0, false);    // key => 1 else delta => 0
      // Store 64-bit value at byte 20 (8 byte = 64 bit)
      headerView.setBigUint64(18, BigInt(chunk.ts), false);

      headerView.setUint32(26, chunk.body.byteLength, false); // chunk byte length
      // Merge to package
      // 2 byte are open byte and close byte
      const packed = new Uint8Array(2 + header.length + chunk.body.length);
      // Header MS - message start
      packed[0] = 77 // 'M'
      packed[1] = 83 // 'S'
      // header where is Package Size also
      packed.set(header, 2);
      packed.set(chunk.body, header.length + 2);

      resolve(packed);
    }).catch((err) => {
      // reject(err) 
      console.error(err);
    });
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

        this.http3ServerStreamSendData(finalBuffer)

      }).catch((e) => {
        console.error('Error encodeChunk: ', e);
      });
    } catch (e) {
      console.error('Audio chunk copy failed:', e);
    }
  }


}

export class CurrentParticipantCamera {
  buffer = 'not defined'

  constructor(participantId, http3ServerStreamSendVideo, http3ServerStreamSendAudio, videoSettings = {}, audioSettings = {}) {
    this.mediaStream = null;
    this.abortController = null;
    this.encoder = null;
    this.processor = null;
    this.reader = null;
    this.chunksCount = 0;
    this.frameCount = 0;
    this.keyInterval = 60;
    this.running = false
    this.participantId = participantId;
    this.http3ServerStreamSendVideo = http3ServerStreamSendVideo;
    this.http3ServerStreamSendAudio = http3ServerStreamSendAudio;
    this.videoSettings = videoSettings;
    this.audioSettings = audioSettings;
    this.videoProcessor = null;
    this.videoEnabled = videoSettings.videoEnabled;
    this.audioEnabled = audioSettings.audioEnabled;

    this.runVideo = false;
    this.runAudio = false;

    this.video = document.querySelector(`video[id="${this.participantId}"]`);

    // this.video = document.createElement('video');
    // this.video.setAttribute("id", participantId);
    // this.video.setAttribute("class", "w-full rounded-box bg-black aspect-video object-contain");
    // this.video.setAttribute("participantId", participantId);
    this.video.setAttribute("autoplay", true);
    // this.video.setAttribute("muted", true);
    this.video.setAttribute("playsinline", '');

    // document.getElementById('videoGrid').appendChild(this.video);

    this.#initMediaStream()


  }

  enableVideo() {
    if (this.videoProcessor) {
      this.videoProcessor.videoEnabled = true;
    }
  }

  disableVideo() {
    if (this.videoProcessor) {
      this.videoProcessor.videoEnabled = false;
    }
  }

  enableAudio() {
    if (this.audioProcessor) {
      this.audioProcessor.audioEnabled = true;
    }
  }

  disableAudio() {
    if (this.audioProcessor) {
      this.audioProcessor.audioEnabled = false;
    }
  }

  async #initMediaStream() {
    if (this.videoProcessor) return;

    console.log('requesting camera');
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: this.videoSettings.width },
          height: { ideal: this.videoSettings.height },
          frameRate: { ideal: this.frameRate }
        }
        // video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
      });
      console.info("mediaStream initialized")

      if (this.runVideo) {
        this.startVideo();
      };

      if (this.runAudio) {
        this.startAudio();
      }
    } catch (err) {

      console.error('getUserMedia failed', err);

      this.running = false;
      return;
    }

    this.video.srcObject = this.mediaStream;
    await this.video.play().catch((e) => {
      console.error("video cannot be played", e)
    });

  }

  async startVideo() {
    this.runVideo = true;
    if (this.mediaStream) {
      this.videoProcessor = new CurrentParticipantCameraVideo(
        this.participantId,
        this.mediaStream,
        this.http3ServerStreamSendVideo,
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

    if (this.mediaStream) {
      this.audioProcessor = new CurrentParticipantCameraAudio(
        this.participantId,
        this.mediaStream,
        this.http3ServerStreamSendAudio,
        { audioEnabled: this.audioEnabled })
      this.audioProcessor.start()
      console.log('audio processing starting...');
      true
    } else {
      console.log('Media stream has not been initialized yet ...');
      false
    }

  }
}
