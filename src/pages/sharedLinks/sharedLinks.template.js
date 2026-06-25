import { addNavigationBar } from '@/pages/navigationBar/addNavigationBar.js'
import { render } from '@/router'
import partialSharedLink from '@/pages/sharedLinks/_sharedLink.template.html?tpl'

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
    liEl.dataset
    console.log(liEl.dataset)
    notify('Removed', 'success');
  }, 280);
};

function startInlineEdit(li, field, asPassword = false) {
  // const li = listEl.querySelector(`li[data-id="${id}"]`);
  const id = li.dataset.id;

  // console.log(li);

  if (!li) return;

  const selector = field === 'name' ? '.js-name' : '.js-pass';
  const span = li.querySelector(selector);

  if (!span) return;

  const input = document.createElement('input');

  input.type = asPassword ? 'password' : 'text';
  input.className = 'input input-bordered input-sm w-48';
  input.value = field === 'name' ? (li.dataset.name || '') : (li.dataset.passwordRequired ? '***' : '');
  span.replaceWith(input);
  input.focus();
  input.select();
  const commit = () => {
    const val = input.value.trim();
    if (field === 'name') save({ id: id, name: val }); else save({ id: id, password: val });

    // render(); replace existing li by new one
    notify('Saved', 'success');
  };

  const cancel = () => {
    // render(); replace existing li by new one
    // 
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  });
  input.addEventListener('blur', commit, { once: true });
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

function save(data) {

};


export default function template(props = {}) {
  const sharesLinksList = document.getElementById('sharesLinksList');

  addNavigationBar({ pageName: 'sharedLinks' });

  [{ id: "xxxxxxx", name: "Link name", link: "https//xxxxx", password_required: false }].forEach((sharedLink) => {
    sharesLinksList.insertAdjacentHTML('beforeend',
      partialSharedLink({
        id: sharedLink.id,
        name: sharedLink.name,
        link: sharedLink.link,
        password_required: sharedLink.password_required
      }));
  });


  sharesLinksList.querySelectorAll('li.list-row').forEach((li) => {
    rowInteractiveEffects(li);
    const id = li.getAttribute('data-id');
    const copyBtn = li.querySelector('.js-copy');
    const delBtn = li.querySelector('.js-del-inline');
    const nameSpan = li.querySelector('.js-name');
    const passSpan = li.querySelector('.js-pass');
    const contentWrapper = li.querySelector('.swipe-content-wrapper');
    const swipeRemoveBtn = li.querySelector('.swipe-remove-btn');
    const swipeBgEl = li.querySelector('.swipe-bg');

    if (copyBtn && id) {
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        try {
          await navigator.clipboard.writeText(item.link);
          notify('Link copied', 'success');
        } catch {
          notify('Failed to copy', 'error');
        }
      }, { passive: true });
    }

    if (delBtn && id) {
      delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeItem(li); });
    }
    if (nameSpan && id) {
      // Single click and double click both start edit
      nameSpan.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(li, 'name', false); });
      nameSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(li, 'name', false); });
    }
    if (passSpan && id) {
      passSpan.addEventListener('click', (e) => { e.stopPropagation(); startInlineEdit(li, 'password', true); });
      passSpan.addEventListener('dblclick', (e) => { e.stopPropagation(); startInlineEdit(li, 'password', true); });
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
  });


}