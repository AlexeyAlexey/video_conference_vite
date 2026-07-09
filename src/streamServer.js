import { Socket } from "phoenix"
import { StreamMessageParser } from "@/streamMessageParser.js"

export class StreamServer {
  constructor(uri, streamServerCertHash) {
    this.streamServer = null;
    this.streamServerCertHash = streamServerCertHash;

    this.uri = uri;

    this.streamWriter = Promise.withResolvers();
    this.streamReader = Promise.withResolvers();
    this.connected = false;
    this.reconnecting = false;
    this.disconnected = false;
    this.recentReconnectionTimeAttempt = null;

  }

  async connect() {
    if (this.connected) return;

    // this.disconnected = false;

    try {
      this.streamWriter = Promise.withResolvers();
      this.streamReader = Promise.withResolvers();


      if (this.streamServerCertHash) {
        console.info("serverCertificateHashes is set for WebTransportStreamConnection")
        // When self signed certificate is used
        this.streamServer = new WebTransport(this.uri, {
          serverCertificateHashes: [
            {
              algorithm: "sha-256",
              value: this.#hexToBytes(this.streamServerCertHash)
            }
          ]
        });
      } else {
        this.streamServer = new WebTransport(this.uri);
      }

      await this.streamServer.ready;

      const streamServerStream = await this.streamServer.createBidirectionalStream();


      const writer = streamServerStream.writable.getWriter();
      this.streamWriter.resolve(writer);

      const streamReaderStream = streamServerStream.readable.pipeThrough(
        new TransformStream(new StreamMessageParser(1024 * 1024)) // 1MB buffer
      );

      const reader = streamReaderStream.getReader()
      this.streamReader.resolve(reader)

      console.info(`connected to ${this.uri}`)

      this.connected = true
      this.reconnecting = false;


    } catch (error) {
      this.streamWriter.reject(error);
      this.streamReader.reject(error);

      this.#reconnect(`Connect failed. Error ${error}`);
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
    if (this.disconnected) return;

    try {
      const writer = await this.streamWriter.promise;

      await writer.write(data);
    } catch (error) {

      if (error instanceof WebTransportError && error.message === 'Received STOP_SENDING.') {
        this.disconnected = true
        console.info(error);
      } else {

        if (this.reconnecting === false && this.disconnected === false) { this.#reconnect(`Cannot write. Reconnecting... Error: ${error}`); }
      }
    }
  }


  async reader(callback) {
    while (true) {
      try {
        if (this.disconnected) break;

        const reader = await this.streamReader.promise;

        const { value, done } = await reader.read();

        if (done) break;

        callback(value);
      } catch (error) {

        if (this.reconnecting === false && this.disconnected === false) {
          this.#reconnect(`Cannot read. Reconnecting... Error: ${error}`);
        }
      }
    }

  }

  async #reconnect(reason) {
    // TODO Fix reconnection. it does not work when stream server is stopped and broke front end (memory leak) ???
    if (this.disconnected === true) return;

    // TODO fix retry add interval between attempts 
    if (this.recentReconnectionTimeAttempt !== null && Math.abs(Date.now() - this.recentReconnectionTimeAttempt) < 5000) {
      return;
    };

    this.recentReconnectionTimeAttempt = Date.now();

    console.error(`Reconnecting reason: ${reason}`);


    this.reconnecting = true;
    this.connected = false;

    await this.connect()
  }

  async disconnect(reason = "disconnected", code = 0) {
    this.disconnected = true;

    await this.streamServer.close({
      closeCode: code,
      reason: reason
    });


  }


}