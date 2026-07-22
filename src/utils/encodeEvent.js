export function encodeEvent(event) {
  return new Promise((resolve, reject) => {
    // M::8bit S::8bit packageLength::32bit isEvent::8 byteLength::32bit body::(is variable size. This size we save into byteLength)
    // {eventName: string, eventParams: object}
    const eventJsonString = JSON.stringify(event);
    const uint8ArrayEvent = new TextEncoder().encode(eventJsonString);
    const uint8ArrayEventLength = uint8ArrayEvent.length;


    const header = new Uint8Array(9);
    const headerView = new DataView(header.buffer);
    // 4 -  packageLength occupy 4 byte
    // 1 - isEvent = 1 byte
    // 4 - header uint8ArrayEventLength.length value = 4byte
    // 4 + 1 + 4 = 9 (header size)
    const packageLength = 5 + uint8ArrayEventLength; // bytes
    headerView.setUint32(0, packageLength, false);    // Package Size bytes
    headerView.setUint8(4, 4, false);    //  isEvent 4

    headerView.setUint32(5, uint8ArrayEventLength, false); // eventJsonString byte length
    // Merge to package
    // 2 byte are open byte and close byte
    const packed = new Uint8Array(2 + header.length + uint8ArrayEventLength);
    // Header MS - message start
    packed[0] = 77 // 'M'
    packed[1] = 83 // 'S'
    // header where is Package Size also
    packed.set(header, 2);
    packed.set(uint8ArrayEvent, header.length + 2);

    resolve(packed);
  }).catch((err) => {
    // reject(err) 
    console.error(err);
  });
}