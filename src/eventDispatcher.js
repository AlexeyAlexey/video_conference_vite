
class EventDispatcher {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(eventName, subscriberId, callback) {
    // {eventName => {subscriberId => callback}}
    const subscribers = this.subscribers.get(eventName) || new Map()

    subscribers.set(subscriberId, callback)

    this.subscribers.set(eventName, subscribers)

  }

  unsubscribe(eventName, subscriberId) {
    if (this.subscribers.has(eventName) === false) return;

    const subscribers = this.subscribers.get(eventName);

    const res = subscribers.delete(subscriberId);

    this.subscribers.set(eventName, subscribers)

    res
  }

  emit(eventName, payload) {
    if (this.subscribers.has(eventName) === false) return;

    (this.subscribers.get(eventName)).forEach((callback, subscriberId) => {
      callback(payload)
    });
  }
}

export const eventDispatcher = new EventDispatcher()