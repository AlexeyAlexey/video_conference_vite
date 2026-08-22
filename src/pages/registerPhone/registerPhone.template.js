import { registerPhoneApi } from '@/api/registerPhoneApi.js'
import { managerWS } from '@/managerWS.js'
import { render } from '@/router'
// import { phoneChannel } from '../../channels/phoneChannel.js'

export default function template(props = {}) {
  const btn = document.getElementById('accountBtn');
  const menu = document.getElementById('account-dd');

  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (menu.matches(':popover-open')) {
      menu.hidePopover();
    } else {
      menu.showPopover();
    }
  });
  document.addEventListener('click', (e) => {
    if (!menu.matches(':popover-open')) return;
    if (e.target === btn || btn.contains(e.target) || menu.contains(e.target)) return;
    menu.hidePopover();
  });




  const form = document.getElementById('registerPhone');
  if (!form) return;

  const errorBox = document.getElementById('registerError');
  const spinner = document.getElementById('registerSpinner');
  const btnLabel = document.getElementById('registerBtnLabel');
  const submitBtn = document.getElementById('registerSubmitBtn');

  const showError = (msg) => {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  };

  const setLoading = (loading) => {
    if (submitBtn) submitBtn.disabled = loading;
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (btnLabel) btnLabel.textContent = loading ? 'Creating account…' : 'Create account';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.classList.add('hidden');

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (data.password !== data.password_confirmation) {
      showError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await registerPhoneApi(data);

      localStorage.setItem('autToken', response.auth_token);

      managerWS.connect(response.auth_token);

      render('/phones');
    } catch (e) {
      console.error(e)
      setLoading(false);
      showError('Sorry, your request failed. Please try again.');
    }

    // try {
    //   await fetch(apiServer, {
    //     method: 'POST', // Specify the method
    //     headers: {
    //       'Content-Type': 'application/json' // Inform the server about the data format
    //     },
    //     body: JSON.stringify(data) // Convert data to a JSON string for the body
    //   })
    // } catch (e) {
    //   console.error(e)
    // }

  });

}