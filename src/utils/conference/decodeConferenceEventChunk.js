
export function decodeConferenceEventChunk(payload) {
  const view = new DataView(payload.buffer);
  const participantId = view.getUint32(0, false);

  const chunkType = view.getUint8(4, false);

  // const byteLength = view.getUint32(6, false);

  // get the rest of payload (body)
  const uint8arrayStr = payload.slice(9)

  const decoder = new TextDecoder('utf-8');
  const eventStr = decoder.decode(uint8arrayStr);

  return {
    dataType: "event",
    participantId: participantId,
    body: JSON.parse(eventStr)
  }
}