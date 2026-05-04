function decodeChunk(view, payload) {
  const phone = view.getUint32(2, false);
  const seq = view.getUint32(6, false);
  const type = view.getUint32(10, false);
  const ts = view.getBigUint64(14, false);
  const byteLength = view.getUint32(22, false);

  // get the rest of payload (body)
  const audioChunk = payload.slice(26)

  return {
    dataType: "audio",
    isVideo: false,
    isAudio: true,
    phone: phone,
    seq: seq,
    type: (type == 1 ? 'key' : 'delta'),
    ts: Number(ts),
    byteLength: byteLength,
    body: audioChunk
  }
}

function decodeRingtoneChunk(view, payload) {
  const phone = view.getUint32(2, false);

  // get the rest of payload (body)
  const audioChunk = payload.slice(26)

  return {
    dataType: "ringtone",
    body: audioChunk
  }
}



export function decodeAudioChunk(payload) {
  const view = new DataView(payload.buffer);
  const isVideo = view.getUint8(0, false);

  if (isVideo == 2) {
    return decodeRingtoneChunk(view, payload);
  } else {
    return decodeChunk(view, payload);
  }
  // const phone = view.getUint32(2, false);
  // const seq = view.getUint32(6, false);
  // const type = view.getUint32(10, false);
  // const ts = view.getBigUint64(14, false);
  // const byteLength = view.getUint32(22, false);

  // // get the rest of payload (body)
  // const audioChunk = payload.slice(26)

  // return {
  //   isVideo: (isVideo == 1 ? true : false),
  //   isAudio: (isVideo == 0 ? true : false),
  //   phone: phone,
  //   seq: seq,
  //   type: (type == 1 ? 'key' : 'delta'),
  //   ts: Number(ts),
  //   byteLength: byteLength,
  //   body: audioChunk
  // }
}

// export function decodeAudioChunk(payload) {
//   const view = new DataView(payload.buffer);
//   const isVideo = view.getUint8(0, false);
//   const phone = view.getUint32(2, false);
//   const seq = view.getUint32(6, false);
//   const type = view.getUint32(10, false);
//   const ts = view.getBigUint64(14, false);
//   const byteLength = view.getUint32(22, false);

//   // get the rest of payload (body)
//   const audioChunk = payload.slice(26)

//   return {
//     isVideo: (isVideo == 1 ? true : false),
//     isAudio: (isVideo == 0 ? true : false),
//     phone: phone,
//     seq: seq,
//     type: (type == 1 ? 'key' : 'delta'),
//     ts: Number(ts),
//     byteLength: byteLength,
//     body: audioChunk
//   }
// }