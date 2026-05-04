import { render, goTo, initRouter } from '@/router'

export default function template(props = {}) {

  const startCall = document.querySelector('button#startCall');
  const dropCall = document.querySelector('button#dropCall');

  console.log(props)

  dropCall.addEventListener('click', (event) => {
    render('/phones')
  });

  startCall.addEventListener('click', (event) => {
    render('/call', { switchboard_auth_token: props.switchboard_auth_token })
  });


}