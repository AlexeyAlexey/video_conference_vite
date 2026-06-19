import html from '@/pages/navigationBar/navigationBar.template.html?tpl'
import { showAddContactModal } from '@/pages/navigationBar/showAddContactModal.js'


export function addNavigationBar(opts = {}) {
  const classValue = opts.classValue || "sticky top-0 z-20 flex justify-end mb-3 border-b border-base-300 bg-base-100/80 backdrop-blur";

  const container = document.getElementById('navigationBar');
  const el = document.createElement('div');

  el.className = classValue;

  el.innerHTML = html();


  container.appendChild(el);

  // sync dropdown overlay with details open state
  const details = document.getElementById('navBarActionMenu');
  if (details) {
    const overlay = details.querySelector('.menu-overlay');
    const sync = () => {
      if (!overlay) return;
      if (details.hasAttribute('open')) overlay.classList.remove('hidden');
      else overlay.classList.add('hidden');
    };
    details.addEventListener('toggle', sync, { passive: true });
    // in case it starts open for any reason
    sync();
  };


  const showAddContactModel = document.querySelector('button#showAddContactModel');

  showAddContactModel.addEventListener('click', (event) => {
    showAddContactModal();
    document.getElementById('navBarActionMenu').removeAttribute('open');
  });

};