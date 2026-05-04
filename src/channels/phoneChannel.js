import { managerWS } from "../managerWS"
import { eventDispatcher } from '../eventDispatcher.js'

class PhoneChannel {
  constructor() {
    this.phone = null;
    this.channel = null;
    this.joined = false
  }

  join(phone) {
    if (this.joined) return;

    this.phone = phone;
    this.channel = managerWS.channel(`phone:${this.phone}`, {})

    this.channel.join()
      .receive("ok", resp => {
        console.info("Joined successfully", resp);
      })
      .receive("error", resp => { console.info("Unable to join", resp) })

    this.#subscribe();

    this.joined = true;

  }

  async #subscribe() {
    this.channel.on("income_call", payload => {
      eventDispatcher.emit("income-call", payload)
    });
  }
}

export const phoneChannel = new PhoneChannel();
