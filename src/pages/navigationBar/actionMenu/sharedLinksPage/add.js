import html from '@/pages/navigationBar/actionMenu/sharedLinksPage/menu.template.html?tpl'
import { showGenerateLinkModel } from '@/pages/navigationBar/actionMenu/sharedLinksPage/geneareteLink/showGenerateLinkModel.js'


export default function addGenerateLinkActionMenu(opts = {}) {
  const container = document.getElementById('navBarActionMenuItems');

  container.insertAdjacentHTML('afterbegin', html());

  const showGenerateLinkModelButton = document.querySelector('button#showGenerateLinkModel');

  showGenerateLinkModelButton.addEventListener('click', (event) => {
    showGenerateLinkModel();
    document.getElementById('navBarActionMenu').removeAttribute('open');
  });

};