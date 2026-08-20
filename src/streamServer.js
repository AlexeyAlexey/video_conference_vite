import { Socket } from "phoenix"
import { StreamMessageParser } from "@/streamMessageParser.js"

export class StreamServer {
  constructor(uri, streamServerCertHash, streamParser = null, opts = {}) {
    this.streamServer = null;
    this.streamServerCertHash = streamServerCertHash;
    this.uri = uri;
    this.streamParser = streamParser || new StreamMessageParser(1024 * 1024);
    this.opts = opts;

    this.connected = false;
    this.reconnecting = false;
    this.disconnected = false;
    this.recentReconnectionTimeAttempt = null;

    this.streamWriter = Promise.withResolvers();
    this.streamReader = Promise.withResolvers();
    this.unidirectionalStreamWriter = Promise.withResolvers();
    this.unidirectionalStreamReader = Promise.withResolvers();
  }

  _cleanup() {
    if (this.streamServer) {
      this.streamServer.close();
      this.streamServer = null;
    }
    if (this.streamParser) {
      this.streamParser.reset();
    }
  }

  async connect() {
    if (this.connected) return;

    this.streamWriter = Promise.withResolvers();
    this.streamReader = Promise.withResolvers();
    this.unidirectionalStreamWriter = Promise.withResolvers();
    this.unidirectionalStreamReader = Promise.withResolvers();

    try {
      if (this.streamServerCertHash) {
        // console.info("serverCertificateHashes is set for WebTransportStreamConnection")
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
        new TransformStream({
          transform: (chunk, controller) => {
            this.streamParser.transform(chunk, controller);
          }
        })
      );

      const reader = streamReaderStream.getReader()
      this.streamReader.resolve(reader)

      if (this.opts.initUnidirectionalStreamWriter === true) {
        await this.#initUnidirectionalStreamWriter();

      };

      if (this.opts.initUnidirectionalStreamReader === true) {
        await this.#initUnidirectionalStreamReader();

      };

      console.info(`connected to ${this.uri}`);

      this.connected = true;
      this.reconnecting = false;


    } catch (error) {
      this.connected = false;
      this.reconnecting = false;

      this.streamWriter.reject(error);
      this.streamReader.reject(error);
      this.unidirectionalStreamWriter.reject(error);
      this.unidirectionalStreamReader.reject(error);
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

  async #initUnidirectionalStreamWriter() {
    const stream = await this.streamServer.createUnidirectionalStream();

    const writer = stream.getWriter();

    this.unidirectionalStreamWriter.resolve(writer);

    return true;

  }

  async #initUnidirectionalStreamReader() {
    const stream = await this.streamServer.incomingUnidirectionalStreams;

    // const streamReader = stream.pipeThrough(
    //   new TransformStream(this.streamParser)
    // );

    const streamReader = stream;

    const reader = streamReader.getReader();

    console.log(reader)

    this.unidirectionalStreamReader.resolve(reader);

    return true;

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

        if (this.reconnecting === false && this.disconnected === false) {
          await this.#reconnect(`Cannot write. Reconnecting... Error: ${error}`);
        }
      }
    }
  }

  async unidirectionalWrite(data) {
    if (this.disconnected) return;

    try {
      const writer = await this.unidirectionalStreamWriter.promise;

      await writer.write(data);
    } catch (error) {

      if (error instanceof WebTransportError && error.message === 'Received STOP_SENDING.') {
        this.disconnected = true
        console.info(error);
      } else {

        if (this.reconnecting === false && this.disconnected === false) {
          await this.#reconnect(`Cannot write to unidirectionalWrite. Reconnecting... Error: ${error}`);
        }
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
          await this.#reconnect(`Cannot read. Reconnecting... Error: ${error}`);
        }
        // After a reconnect attempt, the loop should break. The application logic is responsible for restarting it.
        // break;
      }
    }

  }

  async unidirectionalReader(callback) {
    while (true) {
      try {
        if (this.disconnected) break;


        const reader = await this.unidirectionalStreamReader.promise;

        const { value: stream, done } = await reader.read();

        if (done) break;

        this.#handleIncomingUnidirectionalStream(stream, callback)
      } catch (error) {
        if (this.reconnecting === false && this.disconnected === false) {
          await this.#reconnect(`Cannot read from unidirectionalReader. Reconnecting... Error: ${error}`);
        }
        // After a reconnect attempt, the loop should break. The application logic is responsible for restarting it.
        // break;
      }
    }

  }

  async #handleIncomingUnidirectionalStream(stream, callback) {
    const streamReader = stream.pipeThrough(
      new TransformStream({
        transform: (chunk, controller) => {
          this.streamParser.transform(chunk, controller);
        }
      })
    );

    const reader = streamReader.getReader(); // This is your unidirectionalStreamReader

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.info("Incoming Unidirectional Stream is finished by server.");
          break;
        }

        callback(value)
        // 'value' is a Uint8Array
      }
    } catch (err) {
      if (this.reconnecting === false && this.disconnected === false) {
        await this.#reconnect(`Cannot read from unidirectionalReader. Reconnecting... Error: ${err}`);
      }

      console.error("Stream read error:", err);
    } finally {
      reader.releaseLock();
    }
  }

  async #reconnect(reason) {
    if (this.reconnecting) { return; }
    this.reconnecting = true;
    this.connected = false;

    console.error(`Reconnecting reason: ${reason}`);
    this.recentReconnectionTimeAttempt = Date.now();

    this._cleanup();

    // Optional: Add a delay before reconnecting
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      await this.connect();
    } catch (error) {
      // The error is already handled by the promise rejection in connect()
    } finally {
      this.reconnecting = false;
    }
  }

  async disconnect(reason = "disconnected", code = 0) {
    this.disconnected = true;

    await this.streamServer.close({
      closeCode: code,
      reason: reason
    });


  }


}