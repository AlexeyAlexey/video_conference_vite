import { managerWS } from "@/managerWS"
import { phoneChannel } from '@/channels/phoneChannel.js'
import partialPhone from '@/pages/phonesList/_phone.template.html'
import { render, goTo, initRouter } from '@/router'

// import { eventDispatcher } from '../../eventDispatcher.js'


function call(host, phone) {
  phoneChannel.channel.push("call", { to_host: host, to: Number(phone) })
    .receive("ok", (payload) => {
      render('/call', payload)
    })
    .receive("error", err => console.error("phoenix errored", err))
    .receive("timeout", () => console.error("timed out pushing"))
}

export default function template(props = {}) {
  const phonesList = document.getElementById('phones-list');



  phoneChannel.channel.push("list_of_phones")
    .receive("ok", (payload) => {
      payload.forEach((phone) => {
        phonesList.insertAdjacentHTML('beforeend', partialPhone(phone));
      });

      const callButtons = document.querySelectorAll('.call-button');

      callButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          call(event.currentTarget.dataset.host, event.currentTarget.dataset.phone)
          // console.log(event.currentTarget.dataset)
          // console.log(event.currentTarget.dataset.phone)
        });
      });
    })
    .receive("error", err => console.error("phoenix errored", err))
    .receive("timeout", () => console.error("timed out pushing"))


}