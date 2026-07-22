
import { decodeVideoChunk } from '@/utils/decodeVideoChunk.js'
import { decodeAudioChunk } from '@/utils/decodeAudioChunk.js'
import { decodeEvent } from '@/utils/decodeEvent.js'


function decodeRingtoneChunk(payload) {
  // get the rest of payload (body)
  const audioChunk = payload.slice(26)

  return {
    dataType: "ringtone",
    body: audioChunk
  }
};

function decodeCloseCallMessage(payload) {
  // get the rest of payload (body)
  const body = payload.slice(1)

  return {
    dataType: "close",
    body: new TextDecoder().decode(body)
  }
};

export function decodeChunk(payload) {
  const view = new DataView(payload.buffer, 0, 5);
  const participantId = view.getUint32(0, false);

  const chunkType = view.getUint8(4, false);

  var rest = {};

  // chunkType 0 isAudio
  // chunkType 1 isVideo
  // chunkType 2 binary ringtone
  // chunkType 3 close call with error message
  // chunkType 4 event

  // TODO switch instead of if
  if (chunkType == 0) {
    rest = decodeAudioChunk(payload.slice(4));
  } else if (chunkType == 1) {
    rest = decodeVideoChunk(payload.slice(4));
  } else if (chunkType == 2) {
    rest = decodeRingtoneChunk(payload.slice(4));
  }
  else if (chunkType == 3) {
    rest = decodeCloseCallMessage(payload.slice(4));
  }
  else if (chunkType == 4) {
    rest = decodeEvent(payload.slice(4));
  }

  rest.participantId = participantId;

  return rest
}