import { BinaryQueue } from '@/utils/binaryQueue.js';


export class SoundPlayer {
  constructor(maxQueue = 5) {
    this.audioContext = new AudioContext();
    this.nextStartTime = this.audioContext.currentTime;
    this.queue = new BinaryQueue()
    this.maxQueue = maxQueue;
  }

  play(audioArray) {
    if (this.queue.length() >= this.maxQueue) {
      this.queue.clean();
    }
    this.queue.enqueue(audioArray.buffer);
    this._pump();
  }

  async _pump() {
    try {
      while (!this.queue.isEmpty()) {
        const audioArrayBuffer = this.queue.dequeue();

        if (audioArrayBuffer) {
          // 2. Decode the ArrayBuffer into a playable AudioBuffer
          const audioBuffer = await this.audioContext.decodeAudioData(audioArrayBuffer);

          // 3. Create a source node and schedule playback
          const source = this.audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioContext.destination);

          // .start(when) stacks up chunks without any pauses
          source.start(this.nextStartTime);

          // Calculate when this chunk finishes
          this.nextStartTime += audioBuffer.duration;
        }

      }
    } finally {
      if (!this.queue.isEmpty()) this._pump();
    }
  }


  // async play(audioArrayBuffer) {
  //   // 2. Decode the ArrayBuffer into a playable AudioBuffer
  //   const audioBuffer = await this.audioContext.decodeAudioData(audioArrayBuffer);

  //   // 3. Create a source node and schedule playback
  //   const source = this.audioContext.createBufferSource();
  //   source.buffer = audioBuffer;
  //   source.connect(this.audioContext.destination);

  //   // .start(when) stacks up chunks without any pauses
  //   source.start(this.nextStartTime);

  //   // Calculate when this chunk finishes
  //   this.nextStartTime += audioBuffer.duration;
  // }
}