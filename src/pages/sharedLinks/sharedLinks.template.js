import { addNavigationBar } from '@/pages/navigationBar/addNavigationBar.js'
import { render } from '@/router'
import partialSharedLink from '@/pages/sharedLinks/_sharedLink.template.html?tpl'
import { sharedLinkListApi } from '@/api/sharedLinkListApi.js'
import { removeSharedLinkApi } from '@/api/removeSharedLinkApi.js'
import { renameSharedLinkApi } from '@/api/renameSharedLinkApi.js'
import { enableSharedLinkPasswordApi } from '@/api/enableSharedLinkPasswordApi.js'
import { disableSharedLinkPasswordApi } from '@/api/disableSharedLinkPasswordApi.js'

const schema = import.meta.env.VITE_SCHEMA
const host = import.meta.env.VITE_HOST
const port = import.meta.env.VITE_PORT

function rowInteractiveEffects(li) {
  if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex', '0');
  if (!li.hasAttribute('role')) li.setAttribute('role', 'button');

  const add = () => li.classList.add('bg-base-200');
  const rm = () => li.classList.remove('bg-base-200');

  li.addEventListener('pointerdown', add, { passive: true });
  li.addEventListener('pointerup', rm, { passive: true });
  li.addEventListener('pointercancel', rm, { passive: true });
  li.addEventListener('pointerleave', rm, { passive: true });
  li.addEventListener('blur', rm, { passive: true });
  li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') add(); }, { passive: true });
  li.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') rm(); }, { passive: true });
};

function removeItem(liEl) {
  liEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  liEl.style.transform = 'translateX(-100%)';
  liEl.style.opacity = '0';
  setTimeout(() => {
    removeSharedLinkApi({ id: liEl.dataset.id }).then((response) => {
      notify('Removed', 'success');
    }).catch(e => console.error(e));

  }, 280);
};

function addCopyLinkAbility(li) {
  const copyBtn = li.querySelector('.js-copy');

  if (copyBtn) {
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(copyBtn.dataset.link);
        notify('Link copied', 'success');
      } catch {
        notify('Failed to copy', 'error');
      }
    }, { passive: true });
  };
};

function doFieldsEditable(li) {
  const nameSpan = li.querySelector('.js-name');
  const passSpan = li.querySelector('.js-pass');

  if (nameSpan) {
    // Single click and double click both start edit
    nameSpan.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(li, 'name', false); });
    nameSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(li, 'name', false); });
  }
  if (passSpan) {
    passSpan.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(li, 'password', true); });
    passSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(li, 'password', true); });
  }
};


function startInlineEdit(li, field, asPassword = false) {
  const id = li.dataset.id;
  const name = li.dataset.name;
  const link = li.dataset.link;
  const passwordRequired = li.dataset.passwordRequired === 'true';

  if (!li) return;

  const selector = field === 'name' ? '.js-name' : '.js-pass';
  const span = li.querySelector(selector);

  if (!span) return;

  const input = document.createElement('input');

  input.type = asPassword ? 'password' : 'text';
  input.className = 'input input-bordered input-sm w-48';
  input.value = field === 'name' ? (name || '') : '';
  span.replaceWith(input);
  input.focus();
  input.select();

  let committed = false;

  const restoreRow = (newName, newPasswordRequired) => {
    li.insertAdjacentHTML('afterend', partialSharedLink({
      id: id,
      name: newName,
      link: link,
      password_required: newPasswordRequired
    }));
    li.remove();
  };

  const commit = () => {
    if (committed) return;
    committed = true;
    const val = input.value.trim();

    if (field === 'name') {
      if (!val) {
        notify('Name cannot be empty', 'error');
        restoreRow(name, passwordRequired);
        return;
      }
      renameSharedLinkApi({ id: id, name: val })
        .then(() => {
          restoreRow(val, passwordRequired);
          notify('Renamed', 'success');
        })
        .catch(e => {
          console.error(e);
          restoreRow(name, passwordRequired);
          notify(e.message || 'Rename failed', 'error');
        });
    } else if (field === 'password') {
      if (val) {
        enableSharedLinkPasswordApi({ id: id, password: val })
          .then(() => {
            restoreRow(name, true);
            notify('Password set', 'success');
          })
          .catch(e => {
            console.error(e);
            restoreRow(name, passwordRequired);
            notify(e.message || 'Failed to set password', 'error');
          });
      } else if (passwordRequired) {
        disableSharedLinkPasswordApi({ id: id })
          .then(() => {
            restoreRow(name, false);
            notify('Password removed', 'success');
          })
          .catch(e => {
            console.error(e);
            restoreRow(name, passwordRequired);
            notify(e.message || 'Failed to remove password', 'error');
          });
      } else {
        restoreRow(name, passwordRequired);
      }
    }
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    restoreRow(name, passwordRequired);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', cancel, { once: true });
};

function doRemoveable(li) {
  const delBtn = li.querySelector('.js-del-inline');
  const contentWrapper = li.querySelector('.swipe-content-wrapper');
  const swipeRemoveBtn = li.querySelector('.swipe-remove-btn');
  const swipeBgEl = li.querySelector('.swipe-bg');

  if (delBtn) {
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeItem(li); });
  }

  // Swipe-to-remove interactions
  if (contentWrapper && swipeRemoveBtn && swipeBgEl) {
    let startX = 0, currentX = 0, isSwiping = false, isDragging = false;
    const threshold = 60, maxSwipe = 80;

    const setTranslate = (value) => { contentWrapper.style.transform = `translateX(${value}px)`; };
    const showSwipeBg = () => { swipeBgEl.classList.remove('opacity-0', 'pointer-events-none'); swipeBgEl.classList.add('opacity-100'); };
    const hideSwipeBg = () => { swipeBgEl.classList.add('opacity-0', 'pointer-events-none'); swipeBgEl.classList.remove('opacity-100'); };
    const resetSwipe = () => { setTranslate(0); hideSwipeBg(); isDragging = false; };

    contentWrapper.style.transition = 'transform 0.3s ease';
    // Improve cross-device swipe
    contentWrapper.style.touchAction = 'pan-y';
    li.style.touchAction = 'pan-y';

    li.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, .js-name, .js-pass, input')) return;
      startX = e.clientX; currentX = e.clientX; isSwiping = true; contentWrapper.style.transition = 'none'; li.setPointerCapture(e.pointerId);
    });
    li.addEventListener('pointermove', (e) => {
      if (!isSwiping) return; currentX = e.clientX; const diff = startX - currentX;
      if (diff > 10) { if (!isDragging) { isDragging = true; showSwipeBg(); } const swipeAmount = Math.min(diff, maxSwipe); setTranslate(-swipeAmount); }
    });

    const endSwipe = () => {
      if (!isSwiping) return; isSwiping = false; contentWrapper.style.transition = 'transform 0.3s ease';
      const diff = startX - currentX; if (diff > threshold) { setTranslate(-maxSwipe); } else { resetSwipe(); }
    };
    li.addEventListener('pointerup', endSwipe);
    li.addEventListener('pointerleave', endSwipe);
    li.addEventListener('pointercancel', endSwipe);

    swipeRemoveBtn.addEventListener('click', (e) => { e.stopPropagation(); removeItem(li); });
  }
}

function addFunctionality(li) {
  rowInteractiveEffects(li);
  addCopyLinkAbility(li);
  doFieldsEditable(li);
  doRemoveable(li);
};


function notify(msg, color = 'info') {
  const host = document.getElementById('notifications');
  if (!host) return;
  const n = document.createElement('div');
  n.className = `alert alert-${color}`;
  n.setAttribute('role', 'alert');
  n.textContent = msg;
  host.appendChild(n);
  setTimeout(() => n.remove(), 2000);
};

function sharesLinksListObserver(sharesLinksList) {
  // Options for the observer (which mutations to observe)
  const config = { childList: true };

  // Callback function to execute when mutations are observed
  const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((li) => {
          addFunctionality(li)
        })
      }
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(sharesLinksList, config);

};

export default function template(props = {}) {
  const sharesLinksList = document.getElementById('sharesLinksList');
  if (!sharesLinksList) return;

  const loadingEl = document.getElementById('sharedLinksLoading');
  const emptyEl = document.getElementById('sharedLinksEmpty');
  const countEl = document.getElementById('sharedLinksCount');

  const setCount = (n) => {
    if (countEl) countEl.textContent = n === 1 ? '1 link' : `${n} links`;
  };

  const refreshEmptyState = () => {
    if (!emptyEl) return;
    if (sharesLinksList.children.length === 0) {
      emptyEl.classList.remove('hidden');
      emptyEl.classList.add('flex');
    } else {
      emptyEl.classList.add('hidden');
      emptyEl.classList.remove('flex');
    }
  };

  sharesLinksListObserver(sharesLinksList);

  addNavigationBar({ pageName: 'sharedLinks' });

  sharedLinkListApi().then((response) => {
    loadingEl?.classList.add('hidden');

    response.forEach((sharedLink) => {
      sharesLinksList.insertAdjacentHTML('beforeend',
        partialSharedLink({
          id: sharedLink.id,
          name: sharedLink.name,
          link: `${schema}://${host}:${port}/shared-link-call?link_id=${sharedLink.link_id}`,
          password_required: sharedLink.password_required
        }));
    });

    setCount(response.length);
    refreshEmptyState();

  }).catch(e => {
    console.error(e)
    loadingEl?.classList.add('hidden');
    if (emptyEl) {
      const title = emptyEl.querySelector('p');
      if (title) title.textContent = 'Could not load shared links';
      const text = emptyEl.querySelectorAll('p')[1];
      if (text) text.textContent = 'Sorry, your request failed. Please try again.';
      emptyEl.classList.remove('hidden');
      emptyEl.classList.add('flex');
    }
  })

}