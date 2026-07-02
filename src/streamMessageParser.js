export class StreamMessageParser {
  constructor(initialCapacity = 65536) { // 64KB
    this.buffer = new Uint8Array(initialCapacity);
    this.offset = 0;
    this.MAGIC_0 = 77; // 'M'
    this.MAGIC_1 = 83; // 'S'
    this.HEADER_SIZE = 6; // 2 byte marker + 4 byte payload length
  }

  transform(chunk, controller) {
    // Increasing buffer size if it is required
    if (this.offset + chunk.length > this.buffer.length) {
      let newBuffer = new Uint8Array(Math.max(this.buffer.length * 2, this.offset + chunk.length));
      newBuffer.set(this.buffer.subarray(0, this.offset));
      this.buffer = newBuffer;
    }
    this.buffer.set(chunk, this.offset);
    this.offset += chunk.length;


    let pos = 0;
    while (pos <= this.offset - this.HEADER_SIZE) {
      // Looking for beginning of a package (MS are 77 and 83 byte)
      if (this.buffer[pos] !== this.MAGIC_0 || this.buffer[pos + 1] !== this.MAGIC_1) {
        pos++;
        continue;
      }

      // Reading payload length
      const view = new DataView(this.buffer.buffer, this.buffer.byteOffset + pos);
      const payloadLength = view.getUint32(2, false); // start with the second byte
      // console.log(`payloadLength ${payloadLength}`)


      // Checking if buffer has the whole package
      if (this.offset - pos >= this.HEADER_SIZE + payloadLength) {
        const start = pos + this.HEADER_SIZE;
        const end = start + payloadLength;

        // Send only payload from package MS,payloadLength,payload
        controller.enqueue(this.buffer.slice(start, end));

        pos = end; // got to the next possible package
      } else {
        // package is not full. went out from loop to get next chunk
        break;
      }
    }

    // Cleaning processed buffer
    if (pos > 0) {
      this.buffer.copyWithin(0, pos, this.offset);
      this.offset -= pos;
    }
  }
}