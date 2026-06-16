import { logInByPhoneApi } from '@/api/logInByPhoneApi.js'
import { managerWS } from '@/managerWS.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import { render, goTo, initRouter } from '@/router'
import { initApp } from '@/initApp.js'
import { storage } from '@/storage.js'


export default function template(props = {}) {
  const form = document.getElementById('logInByPhone');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    logInByPhoneApi(data).then((response) => {

      storage.saveAuthToken(response.auth_token)
      storage.save('phone', data.phone)

      initApp(response.auth_token, data.phone)

      render('/phones')
    })
      .catch(e => console.error(e))

  });


}