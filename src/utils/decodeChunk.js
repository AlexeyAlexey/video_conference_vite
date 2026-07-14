// TODO Refactor returned object
function decodeVideoChunk(view, payload) {
  const seq = view.getUint32(2, false);
  const type = view.getUint32(6, false);
  const key = view.getUint32(10, false);
  const ts = view.getBigUint64(14, false);
  const byteLength = view.getUint32(22, false);

  // get the rest of payload (body)
  const videoChunk = payload.slice(26)

  return {
    dataType: "video",
    isVideo: true,
    isAudio: false,
    seq: seq,
    type: (type == 0 ? 'delta' : 'key'),
    ts: Number(ts),
    isDelta: (key == 0 ? true : false),
    isKey: (key == 1 ? true : false),
    byteLength: byteLength,
    body: videoChunk
  }
}

function decodeAudioChunk(view, payload) {
  // const phone = view.getUint32(2, false);
  const seq = view.getUint32(2, false);
  const type = view.getUint32(6, false);
  const ts = view.getBigUint64(10, false);
  const byteLength = view.getUint32(18, false);

  // get the rest of payload (body)
  const audioChunk = payload.slice(22);

  return {
    dataType: "audio",
    isVideo: false,
    isAudio: true,
    seq: seq,
    type: (type == 1 ? 'key' : 'delta'),
    ts: Number(ts),
    byteLength: byteLength,
    body: audioChunk
  }
}

function decodeRingtoneChunk(view, payload) {
  // get the rest of payload (body)
  const audioChunk = payload.slice(26)

  return {
    dataType: "ringtone",
    body: audioChunk
  }
}

function decodeCloseCallMessage(view, payload) {
  // get the rest of payload (body)
  const body = payload.slice(1)

  return {
    dataType: "close",
    body: new TextDecoder().decode(body)
  }
}


export function decodeChunk(payload) {
  const view = new DataView(payload.buffer);
  const chunkType = view.getUint8(0, false);

  // chunkType 0 isAudio
  // chunkType 1 isVideo
  // chunkType 2 binary ringtone
  // chunkType 3 close call with error message

  if (chunkType == 0) {
    return decodeAudioChunk(view, payload);
  } else if (chunkType == 1) {
    return decodeVideoChunk(view, payload);
  } else if (chunkType == 2) {
    return decodeRingtoneChunk(view, payload);
  }
  else if (chunkType == 3) {
    return decodeCloseCallMessage(view, payload);

  }

}
