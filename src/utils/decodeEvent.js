export function decodeEvent(payload) {
  const view = new DataView(payload.buffer);

  // const chunkType = view.getUint8(0, false);
  const byteLength = view.getUint32(2, false);

  // get the rest of payload (body)
  const uint8arrayStr = payload.slice(5)

  const decoder = new TextDecoder('utf-8');
  const eventStr = decoder.decode(uint8arrayStr);

  return {
    dataType: "event",
    body: JSON.parse(eventStr)
  }
};