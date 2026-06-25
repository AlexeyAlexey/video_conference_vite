import html from '@/pages/navigationBar/actionMenu/phonesListPage/menu.template.html?tpl'
import { showAddPhoneModal } from '@/pages/navigationBar/actionMenu/phonesListPage/addPhone/showAddPhoneModal.js'


export default function addPhoneListActionMenu(opts = {}) {
  const container = document.getElementById('navBarActionMenuItems');

  container.insertAdjacentHTML('afterbegin', html());

  const showAddContactModel = document.querySelector('button#showAddContactModel');

  showAddContactModel.addEventListener('click', (event) => {
    showAddPhoneModal();
    document.getElementById('navBarActionMenu').removeAttribute('open');
  });

};