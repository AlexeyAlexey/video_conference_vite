export class CircularQueue {
  constructor(size) {
    this.size = size;
    this.items = new Array(size).fill(null);
    this.front = -1;
    this.rear = -1;
  }

  isEmpty() {
    return this.front === -1;
  }

  isFull() {
    return (this.rear + 1) % this.size === this.front;
  }

  enqueue(element) {
    if (this.isFull()) {
      // return;
      // drop the rest if it is overloaded
      this.front = 0;
    }

    if (this.isEmpty()) {
      this.front = this.rear = 0;
    } else {
      this.rear = (this.rear + 1) % this.size;
    }

    this.items[this.rear] = element;
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    let dequeuedValue = this.items[this.front];

    this.items[this.front] = null;

    if (this.front === this.rear) {
      this.front = this.rear = -1;
    } else {
      this.front = (this.front + 1) % this.size;
    }

    return dequeuedValue;
  }

  peek() {
    if (this.isEmpty()) {

      return null;
    }
    return this.items[this.front];
  }
}