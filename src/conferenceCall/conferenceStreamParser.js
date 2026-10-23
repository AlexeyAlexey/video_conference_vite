const MAGIC_0 = 77; // 'M'
const MAGIC_1 = 83; // 'S'
const MAGIC_2 = 69; // 'E'
const HEADER_SIZE = 7; // 3 byte marker (MAGIC_0 + MAGIC_1 + MAGIC_2) + 4 byte payload length

// <<'M', 'S', 'E', payload_length::32, payload>>
export class ConferenceStreamParser {
  constructor(maxBufferSize = 1024 * 1024, maxPayloadSize = maxBufferSize, initialCapacity = 64 * 1024) { // 1MB max, 64KB initial
    this.maxBufferSize = maxBufferSize;
    this.maxPayloadSize = maxPayloadSize;
    this.buffer = new Uint8Array(Math.min(initialCapacity, maxBufferSize));
    this.offset = 0;
  }

  reset() {
    this.offset = 0;
  }

  transform(chunk, controller) {
    this.#append(chunk);

    let pos = 0;
    while (pos <= this.offset - HEADER_SIZE) {
      // Looking for beginning of a package (MSE are 77 and 83 and 69 byte)
      if (!this.#isHeaderAt(pos)) {
        pos++;
        continue;
      }

      // Reading payload length
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + pos);
      const payloadLength = view.getUint32(3, false); // start with the third byte
      const frameSize = HEADER_SIZE + payloadLength;

      // A frame with a payload bigger than maxPayloadSize or bigger than
      // maxBufferSize can never be completed, so the length field is corrupt:
      // skip this marker and look for the next frame
      if (payloadLength > this.maxPayloadSize || frameSize > this.maxBufferSize) {
        pos++;
        continue;
      }

      // Checking if buffer has the whole package
      if (pos + frameSize > this.offset) {
        // package is not full. went out from loop to get next chunk
        break;
      }

      // Send only payload from package MSE,payloadLength,payload
      controller.enqueue(this.buffer.slice(pos + HEADER_SIZE, pos + frameSize));
      pos += frameSize; // go to the next possible package
    }

    // Cleaning processed buffer
    if (pos > 0) {
      this.buffer.copyWithin(0, pos, this.offset);
      this.offset -= pos;
    }
  }

  #append(chunk) {
    if (this.offset + chunk.length > this.maxBufferSize) {
      // Buffer reached the limit: discard data up to the next frame
      this.#dropBeforeNextFrame();
      if (this.offset + chunk.length > this.maxBufferSize) {
        // The chunk alone does not fit - keep only its newest bytes
        chunk = chunk.subarray(chunk.length - (this.maxBufferSize - this.offset));
      }
    }

    // Increasing buffer size if it is required
    if (this.offset + chunk.length > this.buffer.length) {
      const capacity = Math.min(Math.max(this.buffer.length * 2, this.offset + chunk.length), this.maxBufferSize);
      const newBuffer = new Uint8Array(capacity);
      newBuffer.set(this.buffer.subarray(0, this.offset));
      this.buffer = newBuffer;
    }

    this.buffer.set(chunk, this.offset);
    this.offset += chunk.length;
  }

  // Discards buffered bytes up to the next frame marker. The last two bytes
  // are kept because they can be the 'M','S' of a marker split across chunks
  #dropBeforeNextFrame() {
    for (let i = 1; i + 2 < this.offset; i++) {
      if (this.#isHeaderAt(i)) {
        this.buffer.copyWithin(0, i, this.offset);
        this.offset -= i;
        return;
      }
    }
    const keep = Math.min(2, this.offset);
    this.buffer.copyWithin(0, this.offset - keep, this.offset);
    this.offset = keep;
  }

  #isHeaderAt(pos) {
    return this.buffer[pos] === MAGIC_0 &&
      this.buffer[pos + 1] === MAGIC_1 &&
      this.buffer[pos + 2] === MAGIC_2;
  }
}
