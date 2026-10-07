
export function decodeConferenceAudioChunk(payload) {
  const view = new DataView(payload.buffer);
  const participantId = view.getUint32(0, false);

  // const chunkType = view.getUint8(4, false);

  const seq = view.getUint32(6, false);
  const type = view.getUint32(10, false);
  const ts = view.getBigUint64(14, false);
  const byteLength = view.getUint32(22, false);

  // get the rest of payload (body)
  const audioChunk = payload.slice(26);

  return {
    participantId: participantId,
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