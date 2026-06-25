import partialGenerateLinkModel from '@/pages/navigationBar/actionMenu/sharedLinksPage/geneareteLink/_generateLinkModel.template.html?tpl'
import { render } from '@/router'


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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    console.log(data);

    generateLinkModel.close();
    generateLinkModel.remove();

    // generateSharedLink(data).then((response) => {


    //   generateLinkModel.close();
    //   generateLinkModel.remove();

    //   render('/phones')
    // })
    //   .catch(e => console.error(e))

  });

};