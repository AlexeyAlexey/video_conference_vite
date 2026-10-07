
export function decodeConferenceVideoChunk(payload) {
  const view = new DataView(payload.buffer);
  const participantId = view.getUint32(0, false);

  // const chunkType = view.getUint8(4, false);

  const seq = view.getUint32(6, false);
  const type = view.getUint32(10, false);
  const key = view.getUint32(14, false);
  const ts = view.getBigUint64(18, false);
  const byteLength = view.getUint32(26, false);

  // get the rest of payload (body)
  const videoChunk = payload.slice(30)

  return {
    participantId: participantId,
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