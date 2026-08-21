import html from '@/pages/navigationBar/navigationBar.template.html?tpl'
// import { showAddContactModal } from '@/pages/navigationBar/showAddContactModal.js'
import addPhonesListActionMenu from '@/pages/navigationBar/actionMenu/phonesListPage/add.js'
import addSharedLinksMenu from '@/pages/navigationBar/actionMenu/sharedLinksPage/add.js'
import { render } from '@/router'
import { authenticated } from '@/authenticated'
import { storage } from '@/storage'
import { logOutApi } from '@/api/logOutApi'


function setUpNavBarPageMenuCallback() {
  document.getElementById('navPhonesList').addEventListener('click', () => {
    render('/phones');
  });

  document.getElementById('navSharedLinks').addEventListener('click', () => {
    render('/shared-links');
  });
}

function setUpNavBarLogoutCallback() {
  const logoutBtn = document.getElementById('navBarLogout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      await logOutApi({});
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      storage.removeAuthToken();
      render('/');
    }
  });
}

function setNavBarLogoutVisibility() {
  const logoutBtn = document.getElementById('navBarLogout');
  if (!logoutBtn) return;

  if (authenticated()) {
    logoutBtn.style.display = 'block';
  } else {
    logoutBtn.style.display = 'none';
  }
}

function setActiveNavBarPageMenu(itemId) {
  const nav = document.getElementById('navBarPageMenu');

  if (!nav) return;

  let activeText = 'Menu';

  const a = document.getElementById(itemId);
  const li = a.closest('li');

  li && li.classList.add('active');
  a.setAttribute('aria-current', 'page');
  activeText = a.textContent.trim();

  const summary = nav.querySelector('summary');
  if (summary) summary.textContent = activeText;
};

export function addNavigationBar(opts = {}) {
  const classValue = opts.classValue || "sticky top-0 z-20 grid grid-cols-3 items-center mb-3 border-b border-base-300 bg-base-100/80 backdrop-blur";

  const container = document.getElementById('navigationBar');
  const el = document.createElement('div');

  el.className = classValue;

  el.innerHTML = html();


  container.appendChild(el);

  setNavBarLogoutVisibility();
  setUpNavBarLogoutCallback();

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

  setUpNavBarPageMenuCallback();

  switch (opts.pageName) {
    case 'phonesList':
      setActiveNavBarPageMenu('navPhonesList');
      addPhonesListActionMenu();
      break;

    case 'sharedLinks':
      setActiveNavBarPageMenu('navSharedLinks');
      addSharedLinksMenu();
      break;

    default:
    // Code runs if no cases match
  }





};