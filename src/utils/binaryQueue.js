export class BinaryQueue {
  constructor() {
    this.items = {};
    this.headIndex = 0;
    this.tailIndex = 0;
  }

  enqueue(item) {
    this.items[this.tailIndex] = item;
    this.tailIndex++;
  }

  dequeue() {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.headIndex];
    delete this.items[this.headIndex]; // Remove the reference
    this.headIndex++;
    return item;
  }

  clean() {
    this.items = {};
    this.headIndex = 0;
    this.tailIndex = 0;
  }

  isEmpty() {
    return this.tailIndex - this.headIndex === 0;
  }

  length() {
    return this.tailIndex - this.headIndex
  }
}