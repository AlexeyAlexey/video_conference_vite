import { logInByPhoneApi } from '@/api/logInByPhoneApi.js'
import { managerWS } from '@/managerWS.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import { render, goTo, initRouter } from '@/router'
import { initApp } from '@/initApp.js'
import { storage } from '@/storage.js'


export default function template(props = {}) {
  const form = document.getElementById('logInByPhone');
  if (!form) return;

  // Account dropdown (popover) toggle
  const accountBtn = document.getElementById('accountBtn');
  const accountMenu = document.getElementById('account-dd');
  if (accountBtn && accountMenu) {
    accountBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (accountMenu.matches(':popover-open')) {
        accountMenu.hidePopover();
      } else {
        accountMenu.showPopover();
      }
    });
    document.addEventListener('click', (e) => {
      if (!accountMenu.matches(':popover-open')) return;
      if (e.target === accountBtn || accountBtn.contains(e.target) || accountMenu.contains(e.target)) return;
      accountMenu.hidePopover();
    });
  }

  const errorBox = document.getElementById('logInError');
  const spinner = document.getElementById('logInSpinner');
  const btnLabel = document.getElementById('logInBtnLabel');
  const submitBtn = document.getElementById('logInSubmitBtn');

  const showError = (msg) => {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  };

  const setLoading = (loading) => {
    if (submitBtn) submitBtn.disabled = loading;
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (btnLabel) btnLabel.textContent = loading ? 'Logging in…' : 'Log in';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');
    errorBox?.classList.add('hidden');

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    setLoading(true);
    try {
      const response = await logInByPhoneApi(data);

      storage.saveAuthToken(response.auth_token)
      storage.save('phone', data.phone)

      initApp(response.auth_token, data.phone)

      render('/phones')
    } catch (e) {
      console.error(e)
      setLoading(false);
      showError('Sorry, your request failed. Please try again.');
    }
  });
}