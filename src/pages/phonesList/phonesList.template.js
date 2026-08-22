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
  if (!phonesList) return;

  const loadingEl = document.getElementById('phonesLoading');
  const emptyEl = document.getElementById('phonesEmpty');
  const emptyTitle = document.getElementById('phonesEmptyTitle');
  const emptyText = document.getElementById('phonesEmptyText');
  const countEl = document.getElementById('phonesCount');
  const searchInput = document.getElementById('phonesSearch');

  const setCount = (n) => {
    if (countEl) countEl.textContent = n === 1 ? '1 contact' : `${n} contacts`;
  };

  const refreshEmptyState = (total, filtered) => {
    if (!emptyEl) return;
    if (total === 0) {
      emptyTitle.textContent = 'No contacts yet';
      emptyText.textContent = 'Add a contact from the menu to start calling.';
      emptyEl.classList.remove('hidden');
      emptyEl.classList.add('flex');
    } else if (filtered === 0) {
      emptyTitle.textContent = 'No matches';
      emptyText.textContent = 'No contacts match your search.';
      emptyEl.classList.remove('hidden');
      emptyEl.classList.add('flex');
    } else {
      emptyEl.classList.add('hidden');
      emptyEl.classList.remove('flex');
    }
  };

  const applyFilter = () => {
    const q = (searchInput?.value || '').trim().toLowerCase();
    let visible = 0;
    phonesList.querySelectorAll('li').forEach((li) => {
      const text = li.textContent.toLowerCase();
      const match = !q || text.includes(q);
      li.classList.toggle('hidden', !match);
      if (match) visible++;
    });
    refreshEmptyState(phonesList.children.length, visible);
  };

  searchInput?.addEventListener('input', applyFilter);

  listPhonesFromPhoneBookApi().then((response) => {
    loadingEl?.classList.add('hidden');

    response.forEach((phone) => {
      phonesList.insertAdjacentHTML('beforeend',
        partialPhone({
          name: phone.name,
          phone: phone.phone,
          hostId: phone.host_id
        }));
    });

    setCount(response.length);
    applyFilter();

    const callButtons = document.querySelectorAll('.call-button');

    callButtons.forEach(btn => {
      btn.addEventListener('click', () => {

        call(btn.dataset.hostId, btn.dataset.phone)
      });
    });

  }).catch(e => {
    console.error(e)
    loadingEl?.classList.add('hidden');
    if (emptyTitle) emptyTitle.textContent = 'Could not load contacts';
    if (emptyText) emptyText.textContent = 'Sorry, your request failed. Please try again.';
    emptyEl?.classList.remove('hidden');
    emptyEl?.classList.add('flex');
  })


  addNavigationBar({ pageName: 'phonesList' });

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