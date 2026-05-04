// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// Bring in Phoenix channels client library:
import { Socket } from "phoenix"
import { Http3StreamMessageParser } from './http3_stream_message_parser.js';
import { CurrentParticipantCamera } from './current_participant_camera.js';
import { ParticipantPlayerManager } from './participant_player_manager.js';

// And connect to the path in "lib/video_conference_web/endpoint.ex". We pass the
// token for authentication.
//
// Read the [`Using Token Authentication`](https://hexdocs.pm/phoenix/channels.html#using-token-authentication)
// section to see how the token should be used.
console.log(getManagerServerUri())
let socket = new Socket(getManagerServerUri(), { authToken: window.userToken })
socket.connect()


// Now that you are connected, you can join channels with a topic.
// Let's assume you have a channel with a topic named `room` and the
// subtopic is its id - in this case 42:

// let types = [
//   'video/webm;codecs=vp9,opus',
//   'video/webm;codecs=vp8,opus',
//   'video/webm',
//   'video/mp4' // Supported in Chrome 126+
// ];


//////////////////// WebTransport start
let http3ServerStreamVideoWriter = Promise.withResolvers()
let http3ServerStreamVideoReader = Promise.withResolvers()
let webSocketRoomChannel = Promise.withResolvers()

function hexToBytes(hexString) {
  const cleanHex = hexString.replace(/[:\s]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function initVideoTransport(authToken) {
  try {
    var http3Server
    const http3ServerUri = geVideoStreamUri(authToken);
    const streamServerCertHash = getStreamServerCertHash();

    console.log(streamServerCertHash)


    if (streamServerCertHash) {
      console.info("self sighed")
      // When self signed certificate is used
      http3Server = new WebTransport(http3ServerUri, {
        serverCertificateHashes: [
          {
            algorithm: "sha-256",
            value: hexToBytes(streamServerCertHash)
          }
        ]
      });
    } else {
      http3Server = new WebTransport(http3ServerUri);
    }

    await http3Server.ready;

    const http3ServerStream = await http3Server.createBidirectionalStream();


    const writer = http3ServerStream.writable.getWriter();
    http3ServerStreamVideoWriter.resolve(writer);

    const http3ServerStreamVideoReaderStream = http3ServerStream.readable.pipeThrough(
      new TransformStream(new Http3StreamMessageParser(1024 * 1024)) // 1MB buffer
    );

    const reader = http3ServerStreamVideoReaderStream.getReader()
    http3ServerStreamVideoReader.resolve(reader)

  } catch (err) {
    console.error("Error:", err);
  }
}

// initVideoTransport(authToken);



let http3ServerStreamAudioWriter = Promise.withResolvers();
let http3ServerStreamAudioReader = Promise.withResolvers();

async function initAudioTransport(authToken) {
  try {
    var http3Server;
    const http3ServerUri = geAudioStreamUri(authToken)
    const streamServerCertHash = getStreamServerCertHash();

    if (streamServerCertHash) {
      http3Server = new WebTransport(http3ServerUri, {
        serverCertificateHashes: [
          {
            algorithm: "sha-256",
            value: hexToBytes(streamServerCertHash)
          }
        ]
      });
    } else {
      http3Server = new WebTransport(http3ServerUri);

    }

    await http3Server.ready;

    const http3ServerStream = await http3Server.createBidirectionalStream();


    const writer = http3ServerStream.writable.getWriter();
    http3ServerStreamAudioWriter.resolve(writer);

    const http3ServerStreamVideoReaderStream = http3ServerStream.readable.pipeThrough(
      new TransformStream(new Http3StreamMessageParser(1024 * 1024)) // 1MB buffer
    );

    const reader = http3ServerStreamVideoReaderStream.getReader()
    http3ServerStreamAudioReader.resolve(reader)

  } catch (err) {
    console.error("Error:", err);
  }
}

// initAudioTransport(authToken);


function http3ServerStreamSendVideo(data) {
  return new Promise((resolve, reject) => {
    http3ServerStreamVideoWriter.promise.then((writer) => {
      // decodeStreamByte(data)
      writer.write(data)
        .then(() => {
          // console.info("encode");
        })
        .catch((error) => {
          // TODO implement reconnection
          console.error("Data cannot be sent: ", error);
          // reject(error);
        });
    });

    resolve();
  }).catch(err => reject(err));
}

function http3ServerStreamSendAudio(data) {
  return new Promise((resolve, reject) => {
    http3ServerStreamAudioWriter.promise.then((writer) => {
      // decodeStreamByte(data)
      writer.write(data)
        .then(() => {
          // console.info("encode");
        })
        .catch((error) => {
          console.error("Data cannot be sent: ", error);
          // reject(error);
        });
    });

    resolve();
  }).catch(err => reject(err));
}

/////////////////// WebTransport end


function decodeChunk(payload) {
  const view = new DataView(payload.buffer);
  const isVideo = view.getUint8(0, false);
  const participantId = view.getUint32(2, false);
  const seq = view.getUint32(6, false);
  const type = view.getUint32(10, false);
  const key = view.getUint32(14, false);
  const ts = view.getBigUint64(18, false);
  const byteLength = view.getUint32(28, false);

  // get the rest of payload (body)
  const videoChunk = payload.slice(30)

  return {
    isVideo: (isVideo == 1 ? true : false),
    isAudio: (isVideo == 0 ? true : false),
    participantId: participantId,
    seq: seq,
    type: (type == 0 ? 'delta' : 'key'),
    ts: Number(ts),
    isDelta: (key == 0 ? true : false),
    isKey: (key == 1 ? true : false),
    byteLength: byteLength,
    body: videoChunk
  }
}

function decodeAudioChunk(payload) {
  const view = new DataView(payload.buffer);
  const isVideo = view.getUint8(0, false);
  const participantId = view.getUint32(2, false);
  const seq = view.getUint32(6, false);
  const type = view.getUint32(10, false);
  const ts = view.getBigUint64(14, false);
  const byteLength = view.getUint32(22, false);

  // get the rest of payload (body)
  const audioChunk = payload.slice(26)



  return {
    isVideo: (isVideo == 1 ? true : false),
    isAudio: (isVideo == 0 ? true : false),
    participantId: participantId,
    seq: seq,
    type: (type == 1 ? 'key' : 'delta'),
    ts: Number(ts),
    byteLength: byteLength,
    body: audioChunk
  }
}

console.info(`participant ID: ${getParticipantId()}`);

let participantPlayerManager = new ParticipantPlayerManager(getParticipantId())


let videoToggleBtn = document.getElementById('videoToggleBtn');
let currentParticipantCameraVideoEnabled = false;
let currentParticipantCameraAudioEnabled = true;
let previewIconOn = document.getElementById('previewIconOn');
let previewIconOff = document.getElementById('previewIconOff');
let audioToggleBtn = document.getElementById('audioToggleBtn');
let previewAudioIconOn = document.getElementById('previewAudioIconOn');
let previewAudioIconOff = document.getElementById('previewAudioIconOff');
let copySharedRoomLink = document.getElementById('copySharedRoomLink');

updateVideoToggleUI();
updateAudioToggleUI();

var currentParticipantCamera = new CurrentParticipantCamera(getParticipantId(),
  http3ServerStreamSendVideo,
  http3ServerStreamSendAudio,
  {
    codec: 'vp8',
    width: 640,
    height: 360,
    frameRate: 30,
    videoEnabled: currentParticipantCameraVideoEnabled
  },
  { audioEnabled: currentParticipantCameraAudioEnabled });


videoToggleBtn?.addEventListener('click', () => {
  currentParticipantCameraVideoEnabled = !currentParticipantCameraVideoEnabled;
  try {
    if (currentParticipantCameraVideoEnabled) {
      currentParticipantCamera.enableVideo();
    } else {
      currentParticipantCamera.disableVideo();
    }
  } catch { }
  updateVideoToggleUI();
});

audioToggleBtn?.addEventListener('click', () => {
  currentParticipantCameraAudioEnabled = !currentParticipantCameraAudioEnabled;
  try {
    if (currentParticipantCameraAudioEnabled) {
      currentParticipantCamera.enableAudio();
    } else {
      currentParticipantCamera.disableAudio();
    }
  } catch { }
  updateAudioToggleUI();
});


function updateVideoToggleUI() {
  try {
    if (previewIconOn && previewIconOff) {
      if (currentParticipantCameraVideoEnabled) {
        previewIconOn.classList.remove('hidden');
        previewIconOff.classList.add('hidden');
      } else {
        previewIconOn.classList.add('hidden');
        previewIconOff.classList.remove('hidden');
      }
    }
  } catch { }
}

function updateAudioToggleUI() {
  try {
    if (previewAudioIconOn && previewAudioIconOff) {
      if (currentParticipantCameraAudioEnabled) {
        previewAudioIconOn.classList.remove('hidden');
        previewAudioIconOff.classList.add('hidden');
      } else {
        previewAudioIconOn.classList.add('hidden');
        previewAudioIconOff.classList.remove('hidden');
      }
    }
  } catch { }
}




function startVideoReadingLoop() {
  http3ServerStreamVideoReader.promise.then((reader) => {
    // readingLoop(reader);
    const loop = () => {
      return reader.read().then(({ value, done }) => {
        if (done) {
          console.info("Stream stopped by server");
          return;
        }

        if (value) {
          try {
            const decoded = decodeChunk(value);

            participantPlayerManager.play(decoded.participantId, decoded)

          } catch (error) {
            console.info("Stream reader error:", error);
          }

        }

        return loop();
      }).catch(err => {
        console.error("Reading exception rerun after 1 second...", err);
        setTimeout(loop, 1000);
      });
    };

    loop();
  });
}


function startAudioReadingLoop() {
  http3ServerStreamAudioReader.promise.then((reader) => {
    const loop = () => {
      return reader.read().then(({ value, done }) => {
        if (done) {
          console.info("Stream stopped by server");
          return;
        }

        if (value) {
          try {
            const decoded = decodeAudioChunk(value);

            participantPlayerManager.playAudio(decoded.participantId, decoded)

          } catch (error) {
            console.info("Stream reader error:", error);
          }

        }

        return loop();
      }).catch(err => {
        console.error("Reading exception rerun after 1 second...", err);
        setTimeout(loop, 1000);
      });
    };

    loop();
  });
}


const startBtn = document.getElementById('startBtn');

let http3ReadingStarted = false;

// Uncaught (in promise) NotAllowedError: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD
// https://developer.chrome.com/blog/autoplay/
startBtn?.addEventListener('click', function (event) {
  console.info("startBtn clicked")

  const authToken = event.target.dataset.authToken;
  const roomId = getRoomId();
  const participantId = getParticipantId();

  if (authToken) {
    console.info("startBtn authToken")

    webSocketRoomChannel.resolve({ roomId: roomId, participantId: participantId, authToken: authToken })
  }

  if (authToken && http3ReadingStarted == false) {
    console.info("startBtn authToken http3ReadingStarted")

    initVideoTransport(authToken)
      .catch((e) => { console.info(`cannot connect to a server for video streaming error: ${e}`) })
      .then(() => {

        console.info('connected to a server to stream video');

        startVideoReadingLoop();
        currentParticipantCamera.startVideo();


      });

    initAudioTransport(authToken)
      .catch((e) => { console.info(`cannot connect to a server for audio streaming error: ${e}`) })
      .then(() => {

        console.info('connected to a server to stream audio');

        startAudioReadingLoop();
        currentParticipantCamera.startAudio();

      });


    http3ReadingStarted = true;
  }

});

copySharedRoomLink?.addEventListener('click', function (event) {

  const sharedLink = getSharedLink();

  if (sharedLink) {
    copyToClipboard(sharedLink);

  } else {
    copyToClipboard("Shared link not found");
    console.info('Shared link not found');
  }

});

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.info('Token copied to clipboard');
  } catch (err) {
    console.error('Failed to copy to clipboard: ', err);
  }
}

function getSharedLink() {
  const protocol = window.location.protocol;
  const settingsForm = document.querySelector("#settingsForm");
  const roomId = settingsForm.querySelector('input[id="room_id"]').value;


  return `${protocol}//#{window.location.hostname}/?room_id=${roomId}`
};

function geVideoStreamUri(authToken) {
  const settingsForm = document.querySelector("#settingsForm");
  const streamHost = settingsForm.querySelector('input[id="streamHost"]').value;
  const streamPort = settingsForm.querySelector('input[id="streamPort"]').value;
  const participantId = document.querySelector('input[id="participantId"]').value;
  const roomId = document.querySelector('input[id="roomId"]').value;


  return `https://${streamHost}:${streamPort}/video/?auth_token=${authToken}&room_id=${roomId}&participant_id=${participantId}`;
};

function geAudioStreamUri(authToken) {
  const settingsForm = document.querySelector("#settingsForm");
  const streamHost = settingsForm.querySelector('input[id="streamHost"]').value;
  const streamPort = settingsForm.querySelector('input[id="streamPort"]').value;
  const participantId = document.querySelector('input[id="participantId"]').value;
  const roomId = document.querySelector('input[id="roomId"]').value;

  return `https://${streamHost}:${streamPort}/audio/?auth_token=${authToken}&room_id=${roomId}&participant_id=${participantId}`;
};

function getStreamServerCertHash() {
  const settingsForm = document.querySelector("#settingsForm");

  return settingsForm.querySelector('input[id="streamCertHash"]').value;
}

function getRoomId() {
  return document.querySelector('input[id="roomId"]').value;
};

function getParticipantId() {
  return document.querySelector('input[id="participantId"]').value;
};


function getManagerServerUri() {
  const settingsForm = document.querySelector("#settingsForm");
  const managerProtocol = settingsForm.querySelector('select[id="managerProtocol"]').value;
  const managerHost = settingsForm.querySelector('input[id="managerHost"]').value;
  const managerPort = settingsForm.querySelector('input[id="managerPort"]').value;

  return `${managerProtocol}://${managerHost}:${managerPort}/socket`
};


// channel.on("participant_joint", payload => {
// })

// WebSocket


webSocketRoomChannel.promise.then(({ roomId, participantId, authToken }) => {
  const channel = socket.channel(`room:${roomId}`, { participant_id: participantId, auth_token: authToken })

  channel.join()
    .receive("ok", resp => { console.info("Joined successfully", resp) })
    .receive("error", resp => { console.info("Unable to join", resp) })

  channel.on("participant_left", payload => {
    console.info(`participant_left participant_id ${payload.participant_id}`)

    participantPlayerManager.remove(Number(payload.participant_id))
  })
}).catch(err => {
  console.error("cannot be connected to channel", err);
});






export default socket
