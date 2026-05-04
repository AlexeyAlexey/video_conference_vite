export function encodeVideoChunk(chunk, phone) {
  return new Promise((resolve, reject) => {
    // M::8bit S::8bit packageLength::32bit isVideo::8 participantId::32bit seq::32bit type::32bit key::32bit ts::64 byteLength::32bit body::(is variable size. This size we save into byteLength)
    const header = new Uint8Array(34);
    const headerView = new DataView(header.buffer);
    // 4 -  packageLength occupy 4 byte
    // 18 - isVideo + participantId + seq + type + key = 16 byte
    // 8 - BigInt(chunk.ts) = 8 byte
    // 4 - header chunk.body.byteLength value = 4byte
    // 18 + 8 + 4 = 30 (header size)
    const packageLength = 30 + chunk.body.byteLength; // bytes
    headerView.setUint32(0, packageLength, false);    // Package Size bytes
    headerView.setUint8(4, 1, false);    //  isVideo 1 is video; 0 is audio chunk
    headerView.setUint32(6, phone, false);    // ID participantId
    headerView.setUint32(10, chunk.seq, false);    // chunks sequence
    headerView.setUint32(14, chunk.type == 'delta' ? 0 : 1, false);    // type delta => 0 else key => 1 TODO replace by one bit
    headerView.setUint32(18, chunk.key ? 1 : 0, false);    // key => 1 else delta => 0
    // Store 64-bit value at byte 20 (8 byte = 64 bit)
    headerView.setBigUint64(22, BigInt(chunk.ts), false);


    headerView.setUint32(30, chunk.body.byteLength, false); // chunk byte length
    // Merge to package
    // 2 byte are open byte and close byte
    const packed = new Uint8Array(2 + header.length + chunk.body.length);
    // Header MS - message start
    packed[0] = 77 // 'M'
    packed[1] = 83 // 'S'
    // header where is Package Size also
    packed.set(header, 2);
    packed.set(chunk.body, header.length + 2);

    resolve(packed);
  }).catch((err) => {
    // reject(err) 
    console.error(err);
  });
}