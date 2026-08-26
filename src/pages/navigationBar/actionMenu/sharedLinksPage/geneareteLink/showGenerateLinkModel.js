import partialGenerateLinkModel from '@/pages/navigationBar/actionMenu/sharedLinksPage/geneareteLink/_generateLinkModel.template.html?tpl'
import { render } from '@/router'
import { generateSharedLinkApi } from '@/api/generateSharedLinkApi.js'



export function showGenerateLinkModel(opts = {}) {
  const container = document.getElementById('modal');
  const el = partialGenerateLinkModel({
    dialogId: 'generateLinkModel',
    formId: 'generateLinkModelForm',
    className: 'modal'
  });


  container.insertAdjacentHTML('afterbegin', el);
  const generateLinkModel = document.getElementById('generateLinkModel')

  generateLinkModel.showModal();


  const form = document.getElementById('generateLinkModelForm');
  const passwordToggle = document.getElementById('shared_password_toggle');
  const passwordField = document.getElementById('shared_password_field');
  const passwordInput = document.getElementById('shared_password');
  const passwordError = document.getElementById('shared_password_error');

  function syncPasswordField() {
    const required = passwordToggle && passwordToggle.checked;
    if (passwordField) passwordField.classList.toggle('hidden', !required);
    if (passwordInput) {
      passwordInput.required = required;
      if (!required) passwordInput.value = '';
    }
    if (passwordError) {
      passwordError.classList.add('hidden');
      passwordError.textContent = '';
    }
  }

  if (passwordToggle) {
    passwordToggle.addEventListener('change', syncPasswordField);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const requirePassword = passwordToggle ? passwordToggle.checked : false;
    const name = (form.elements['name'] ? form.elements['name'].value : '').trim();
    const password = passwordInput ? passwordInput.value : '';

    if (requirePassword && !password) {
      if (passwordError) {
        passwordError.textContent = 'Please enter a password.';
        passwordError.classList.remove('hidden');
      }
      if (passwordInput) passwordInput.focus();
      return;
    }

    const data = { name };
    if (requirePassword) data.password = password;

    generateSharedLinkApi(data).then((response) => {
      console.info(response)
      generateLinkModel.close();
      generateLinkModel.remove();
      render('/shared-links')
    }).catch(e => {
      console.error(e)
      if (passwordError) {
        passwordError.textContent = (e && e.message) ? e.message : 'Sorry, your request failed. Please try again.';
        passwordError.classList.remove('hidden');
      }
    })

  });

};