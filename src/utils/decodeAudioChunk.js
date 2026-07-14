export function decodeAudioChunk(payload) {
  const view = new DataView(payload.buffer);

  // const chunkType = view.getUint8(0, false);
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
};
