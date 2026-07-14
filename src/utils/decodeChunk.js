// TODO Refactor returned object
import { decodeVideoChunk } from '@/utils/decodeVideoChunk.js'
import { decodeAudioChunk } from '@/utils/decodeAudioChunk.js'


function decodeRingtoneChunk(payload) {
  // get the rest of payload (body)
  const audioChunk = payload.slice(26)

  return {
    dataType: "ringtone",
    body: audioChunk
  }
}

function decodeCloseCallMessage(payload) {
  // get the rest of payload (body)
  const body = payload.slice(1)

  return {
    dataType: "close",
    body: new TextDecoder().decode(body)
  }
}

export function decodeChunk(payload) {
  const view = new DataView(payload.buffer, 0, 2);
  const chunkType = view.getUint8(0, false);

  // chunkType 0 isAudio
  // chunkType 1 isVideo
  // chunkType 2 binary ringtone
  // chunkType 3 close call with error message

  if (chunkType == 0) {
    return decodeAudioChunk(payload);
  } else if (chunkType == 1) {
    return decodeVideoChunk(payload);
  } else if (chunkType == 2) {
    return decodeRingtoneChunk(payload);
  }
  else if (chunkType == 3) {
    return decodeCloseCallMessage(payload);

  }

}
