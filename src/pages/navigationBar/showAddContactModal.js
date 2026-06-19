import partialAddContactModal from '@/pages/navigationBar/_addContactModal.template.html?tpl'
import { addPhoneToPhoneBookApi } from '@/api/addPhoneToPhoneBookApi.js'
import { render } from '@/router'


export function showAddContactModal(opts = {}) {
  const container = document.getElementById('modal');
  const el = partialAddContactModal({
    dialogId: 'addContactModal',
    formId: 'addContactModalForm',
    className: 'modal'
  });


  container.insertAdjacentHTML('afterbegin', el);
  const addContactModal = document.getElementById('addContactModal')

  addContactModal.showModal();


  const form = document.getElementById('addContactModalForm');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();




    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    addPhoneToPhoneBookApi(data).then((response) => {


      addContactModal.close();
      addContactModal.remove();

      render('/phones')
    })
      .catch(e => console.error(e))

  });

};