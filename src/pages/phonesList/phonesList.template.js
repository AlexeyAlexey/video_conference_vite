import { managerWS } from "@/managerWS"
// import { showAddContactModal } from '@/pages/navigationBar/showAddContactModal.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import partialPhone from '@/pages/phonesList/_phone.template.html?tpl'
import { render, goTo, initRouter } from '@/router'
import { addNavigationBar } from '@/pages/navigationBar/addNavigationBar.js'
import { listPhonesFromPhoneBookApi } from '@/api/listPhonesFromPhoneBookApi.js'


// import { eventDispatcher } from '../../eventDispatcher.js'


function call(hostId, phone) {
  var params = {
    to: Number(phone)
  };

  if (hostId && hostId !== "null") { params.to_host_id = hostId };

  phoneChannel.channel.push("call", params)
    .receive("ok", (payload) => {

      render('/call', payload)
    })
    .receive("error", err => console.error("phoenix errored", err))
    .receive("timeout", () => console.error("timed out pushing"))
}

export default function template(props = {}) {
  const phonesList = document.getElementById('phones-list');


  listPhonesFromPhoneBookApi().then((response) => {
    response.forEach((phone) => {
      phonesList.insertAdjacentHTML('beforeend',
        partialPhone({
          name: phone.name,
          phone: phone.phone,
          hostId: phone.host_id
        }));
    });

    const callButtons = document.querySelectorAll('.call-button');

    callButtons.forEach(btn => {
      btn.addEventListener('click', () => {

        call(event.currentTarget.dataset.hostId, event.currentTarget.dataset.phone)
        // console.log(event.currentTarget.dataset)
        // console.log(event.currentTarget.dataset.phone)
      });
    });

    // render('/phones')
  }).catch(e => console.error(e))


  addNavigationBar();

  // // sync dropdown overlay with details open state
  // const details = document.getElementById('navBarActionMenu');
  // if (details) {
  //   const overlay = details.querySelector('.menu-overlay');
  //   const sync = () => {
  //     if (!overlay) return;
  //     if (details.hasAttribute('open')) overlay.classList.remove('hidden');
  //     else overlay.classList.add('hidden');
  //   };
  //   details.addEventListener('toggle', sync, { passive: true });
  //   // in case it starts open for any reason
  //   sync();
  // };


  // const showAddContactModel = document.querySelector('button#showAddContactModel');

  // showAddContactModel.addEventListener('click', (event) => {
  //   showAddContactModal();
  //   document.getElementById('navBarActionMenu').removeAttribute('open');
  // });

}