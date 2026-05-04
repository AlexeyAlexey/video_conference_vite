import { Http3StreamMessageParser } from './http3_stream_message_parser.js';


export class WebTransportStreamConnection {
  constructor(uri = null, streamServerCertHash = null) {
    this.uri = uri;
    this.streamServerCertHash = streamServerCertHash;
    this.http3ServerStreamWriter = Promise.withResolvers();
    this.http3ServerStreamReader = Promise.withResolvers();
    this.connected = false
    this.reconnecting = false

  }

  async connect(uriP = null, streamServerCertHashP = null) {
    if (this.connected) return;

    try {
      var http3Server;

      this.http3ServerStreamWriter = Promise.withResolvers();
      this.http3ServerStreamReader = Promise.withResolvers();

      this.uri = uriP ?? this.uri;
      this.streamServerCertHash = streamServerCertHashP ?? this.streamServerCertHash;

      if (this.streamServerCertHash) {
        console.info("serverCertificateHashes is set for WebTransportStreamConnection")
        // When self signed certificate is used
        http3Server = new WebTransport(this.uri, {
          serverCertificateHashes: [
            {
              algorithm: "sha-256",
              value: this.#hexToBytes(this.streamServerCertHash)
            }
          ]
        });
      } else {
        http3Server = new WebTransport(this.uri);
      }

      await http3Server.ready;

      const http3ServerStream = await http3Server.createBidirectionalStream();


      const writer = http3ServerStream.writable.getWriter();
      this.http3ServerStreamWriter.resolve(writer);

      const http3ServerStreamReaderStream = http3ServerStream.readable.pipeThrough(
        new TransformStream(new Http3StreamMessageParser(1024 * 1024)) // 1MB buffer
      );

      const reader = http3ServerStreamReaderStream.getReader()
      this.http3ServerStreamReader.resolve(reader)

      console.info(`connected to ${this.uri}`)

      this.connected = true
      this.reconnecting = false;


    } catch (error) {
      this.http3ServerStreamWriter.reject(error);
      this.http3ServerStreamReader.reject(error);

      this.#reconnect();
      console.error(`Error: ${error}`);
    }
  }

  #hexToBytes(hexString) {
    const cleanHex = hexString.replace(/[:\s]/g, '');
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  async write(data) {
    try {
      const writer = await this.http3ServerStreamWriter.promise;
      await writer.write(data);
    } catch (error) {

      console.error(`Error: ${error}`);
      if (this.reconnecting === false) { this.#reconnect(); }
    }
  }


  async reader(callback) {
    while (true) {
      try {
        const reader = await this.http3ServerStreamReader.promise;
        const { value, done } = await reader.read();

        if (done) break;

        callback(value);
      } catch (error) {
        console.error(`Cannot read. Reconnecting... Error: ${error}`);


        if (this.reconnecting === false) { await this.#reconnect(); }
      }
    }

  }

  async #reconnect() {
    this.reconnecting = true;
    this.connected = false;

    await this.connect()
  }


}