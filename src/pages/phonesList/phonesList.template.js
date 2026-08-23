import { managerWS } from "@/managerWS"
// import { showAddContactModal } from '@/pages/navigationBar/showAddContactModal.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import partialPhone from '@/pages/phonesList/_phone.template.html?tpl'
import { render, goTo, initRouter } from '@/router'
import { addNavigationBar } from '@/pages/navigationBar/addNavigationBar.js'
import { listPhonesFromPhoneBookApi } from '@/api/listPhonesFromPhoneBookApi.js'
import { removePhoneFromPhoneBookApi } from '@/api/removePhoneFromPhoneBookApi.js'


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

function notify(msg, color = 'info') {
  const host = document.getElementById('notifications');
  if (!host) return;
  const n = document.createElement('div');
  n.className = `alert alert-${color}`;
  n.setAttribute('role', 'alert');
  n.textContent = msg;
  host.appendChild(n);
  setTimeout(() => n.remove(), 2500);
}

function removeContact(li) {
  const id = li.dataset.id;
  li.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  li.style.transform = 'translateX(-100%)';
  li.style.opacity = '0';
  setTimeout(() => {
    removePhoneFromPhoneBookApi({ id: id }).then(() => {
      li.remove();
      notify('Contact removed', 'success');
      // Refresh the count + empty state after removal
      const list = document.getElementById('phones-list');
      if (list) {
        const countEl = document.getElementById('phonesCount');
        const n = list.children.length;
        if (countEl) countEl.textContent = n === 1 ? '1 contact' : `${n} contacts`;
        const emptyEl = document.getElementById('phonesEmpty');
        if (emptyEl && n === 0) {
          const t = document.getElementById('phonesEmptyTitle');
          const x = document.getElementById('phonesEmptyText');
          if (t) t.textContent = 'No contacts yet';
          if (x) x.textContent = 'Add a contact from the menu to start calling.';
          emptyEl.classList.remove('hidden');
          emptyEl.classList.add('flex');
        }
      }
    }).catch(e => {
      console.error(e);
      // Restore the row if the request failed
      li.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      li.style.transform = '';
      li.style.opacity = '';
      notify('Sorry, your request failed. Please try again.', 'error');
    });
  }, 280);
}

function doRemoveable(li) {
  const contentWrapper = li.querySelector('.swipe-content-wrapper');
  const swipeRemoveBtn = li.querySelector('.swipe-remove-btn');
  const swipeBgEl = li.querySelector('.swipe-bg');

  if (!contentWrapper || !swipeRemoveBtn || !swipeBgEl) return;

  let startX = 0, currentX = 0, isSwiping = false, isDragging = false;
  const threshold = 60, maxSwipe = 80;

  const setTranslate = (value) => { contentWrapper.style.transform = `translateX(${value}px)`; };
  const showSwipeBg = () => { swipeBgEl.classList.remove('opacity-0', 'pointer-events-none'); swipeBgEl.classList.add('opacity-100'); };
  const hideSwipeBg = () => { swipeBgEl.classList.add('opacity-0', 'pointer-events-none'); swipeBgEl.classList.remove('opacity-100'); };
  const resetSwipe = () => { setTranslate(0); hideSwipeBg(); isDragging = false; };

  contentWrapper.style.transition = 'transform 0.3s ease';
  contentWrapper.style.touchAction = 'pan-y';
  li.style.touchAction = 'pan-y';

  li.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, input')) return;
    startX = e.clientX; currentX = e.clientX; isSwiping = true;
    contentWrapper.style.transition = 'none';
    li.setPointerCapture(e.pointerId);
  });

  li.addEventListener('pointermove', (e) => {
    if (!isSwiping) return;
    currentX = e.clientX;
    const diff = startX - currentX;
    if (diff > 10) {
      if (!isDragging) { isDragging = true; showSwipeBg(); }
      const swipeAmount = Math.min(diff, maxSwipe);
      setTranslate(-swipeAmount);
    }
  });

  const endSwipe = () => {
    if (!isSwiping) return;
    isSwiping = false;
    contentWrapper.style.transition = 'transform 0.3s ease';
    const diff = startX - currentX;
    if (diff > threshold) { setTranslate(-maxSwipe); } else { resetSwipe(); }
  };
  li.addEventListener('pointerup', endSwipe);
  li.addEventListener('pointerleave', endSwipe);
  li.addEventListener('pointercancel', endSwipe);

  swipeRemoveBtn.addEventListener('click', (e) => { e.stopPropagation(); removeContact(li); });
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
          id: phone.id,
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

    // Enable swipe-to-remove on each contact row
    phonesList.querySelectorAll('li').forEach(doRemoveable);

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