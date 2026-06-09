import { StreamServer } from "@/streamServer.js"
import { decodeVideoChunk } from '@/utils/decodeVideoChunk.js';
import { decodeAudioChunk } from '@/utils/decodeAudioChunk.js';
import { decodeChunk } from '@/utils/decodeChunk.js';
import { RemoteUserPlayer } from '@/remoteUserPlayer.js';
import { UserStreamCamera } from '@/userStreamCamera.js';
import { SoundPlayer } from '@/soundPlayer.js';
import { eventDispatcher } from '@/eventDispatcher.js'


// caller
// receiver
export class PhoneCall {
  constructor(phone, toPhone, switchboardVideoUri, switchboardVideoServerCertHash = null, switchboardAudioUri, switchboardAudioServerCertHash = null, remoteUserVideoElement, callerUserVideoElement, opts = {}) {
    this.phone = phone;
    this.toPhone = toPhone;

    this.switchboardVideoUri = switchboardVideoUri;
    this.switchboardAudioUri = switchboardAudioUri;

    this.videoStream = new StreamServer(switchboardVideoUri, switchboardVideoServerCertHash);
    this.audioStream = new StreamServer(switchboardAudioUri, switchboardAudioServerCertHash);

    this.remoteUserPlayer = new RemoteUserPlayer(remoteUserVideoElement);

    this.userStreamCamera = new UserStreamCamera(
      this.phone,
      callerUserVideoElement,
      this.videoStream.write.bind(this.videoStream),
      this.audioStream.write.bind(this.audioStream),
      {
        codec: 'vp8',
        width: 640,
        height: 360,
        frameRate: 30,
        videoEnabled: opts.cameraEnabled ?? false
      },
      { audioEnabled: opts.audioEnabled ?? true }
    );

    this.soundPlayer = new SoundPlayer()

  }

  call() {
    this.videoStream.connect()
      .catch((e) => { console.info(`cannot connect to a server for video streaming error: ${e}`) })
      .then(() => {

        console.info('connected to a server to stream video');

        this.userStreamCamera.startVideo();
        this.remoteUserPlayer.startVideo();
        this.startVideoReading();


      });

    this.audioStream.connect()
      .catch((e) => { console.info(`cannot connect to a server for audio streaming error: ${e}`) })
      .then(() => {

        this.userStreamCamera.startAudio();
        this.remoteUserPlayer.startAudio();
        this.startAudioReading();


      });
  }

  endCall() {

    this.userStreamCamera.stop('user_ended_call')

    this.videoStream.disconnect('user_ended_call');
    this.audioStream.disconnect('user_ended_call');
    eventDispatcher.emit("phone-call-ended", { reason: 'userEndCall', from: this.phone, to: this.toPhone })

  }

  enableVideo() {
    this.userStreamCamera.enableVideo();
  }

  disableVideo() {
    this.userStreamCamera.disableVideo();
  }

  enableAudio() {
    this.userStreamCamera.enableAudio();
  }

  disableAudio() {
    this.userStreamCamera.disableAudio();
  }

  async startVideoReading() {
    this.videoStream.reader((value) => {
      if (value) {
        try {
          // const decoded = decodeVideoChunk(value);

          const decoded = decodeChunk(value);

          if (decoded.dataType == "video") {
            this.remoteUserPlayer.playVideo(decoded)
          } else if (decoded.dataType == "close") {
            // this.soundPlayer.play(decoded.body)
            console.log(`video closed ${decoded.body}`)
          }



          // this.remoteUserPlayer.playVideo(decoded)

        } catch (error) {
          console.info("Stream Video reader error:", error);
        }

      }
    });
  }

  async startAudioReading() {
    this.audioStream.reader((value) => {
      if (value) {
        try {



          const decoded = decodeChunk(value);


          if (decoded.dataType == "audio") {
            this.remoteUserPlayer.playAudio(decoded)
          } else if (decoded.dataType == "ringtone") {
            this.soundPlayer.play(decoded.body)
          } else if (decoded.dataType == "close") {
            // this.soundPlayer.play(decoded.body)
            console.log(`audio closed ${decoded.body}`)

            eventDispatcher.emit("phone-call-ended", { reason: decoded.body, from: this.phone, to: this.toPhone })
          }

        } catch (error) {
          console.info("Stream Audio reader error:", error);
        }

      }


    })
  }


}
