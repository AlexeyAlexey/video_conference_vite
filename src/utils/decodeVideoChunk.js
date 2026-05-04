export function decodeVideoChunk(payload) {
  const view = new DataView(payload.buffer);
  const isVideo = view.getUint8(0, false);
  const phone = view.getUint32(2, false);
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
    phone: phone,
    seq: seq,
    type: (type == 0 ? 'delta' : 'key'),
    ts: Number(ts),
    isDelta: (key == 0 ? true : false),
    isKey: (key == 1 ? true : false),
    byteLength: byteLength,
    body: videoChunk
  }
}