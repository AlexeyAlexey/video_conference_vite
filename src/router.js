// // https://some.site/?id=123
// const parsedUrl = new URL(window.location.href);
// console.log(parsedUrl.searchParams.get("id")); // "123"

// // const url = new URL("https://192.0.0.0:443/sing-up?invetation_token=kdkdkdkdkdk");
// let baseUrl = "https://127.0.0.1"
// const url = new URL("/sing-up?invetation_token=kdkdkdkdkdk", baseUrl);

// console.log(url.pathname); // '/sing-up'
// console.log(url.searchParams); // "a=b+%7E"
// console.log(url.searchParams.get('invetation_token')); // "a=b+%7E"

// for (const key of url.searchParams.keys()) {
//   console.log(key);
// }

// const baseUrl = "http://localhost:5173"


import { RegisterPhoneController } from '@/pages/registerPhone/registerPhoneController.js'
import { LogInController } from '@/pages/logIn/logInController.js'
import { PhonesListController } from '@/pages/phonesList/phonesListController.js'
import { CallController } from '@/pages/call/callController.js'
import { CallingPopUpController } from '@/pages/callingPopUp/callingPopUpController.js'


const routes = {
  '/register-phone': RegisterPhoneController,
  '/log-in': LogInController,
  '/phones': PhonesListController,
  '/call': CallController,
  '/calling-pop-up': CallingPopUpController,
  currentController: null
};


export const render = async (path, opts = {}) => {
  const controllerClass = routes[path];

  if (routes.currentController && routes.currentController.controller) {
    routes.currentController.controller.destroy(opts)
  }

  if (!controllerClass) {
    document.querySelector('#app').innerHTML = '<h1>404</h1>';
    return;
  }

  const controller = controllerClass.call(opts);

  routes.currentController = { controller: controller, opts: opts }

}


export const goTo = (path) => {
  const url = new URL(path);
  const searchParams = url.searchParams;
  const opts = {};

  for (const key of searchParams.keys()) {
    opts[key] = searchParams.get(key)
  }

  // window.history.pushState({ path }, path, path)

  render(url.pathname, opts)
}


export const initRouter = () => {
  window.addEventListener('popstate', e => {
    goTo(window.location)
  })
  document.querySelectorAll('[href^="/"]').forEach(el => {
    el.addEventListener('click', (env) => {
      env.preventDefault()
      const { pathname: path } = new URL(env.target.href)
      goTo(path)
    })
  })
  goTo(window.location)
}


export const render_slot = async (slot, path, opts = {}) => {
  const loadPage = routes[path];

  if (!loadPage) {
    console.error(`render slot: path: ${path} cannot be found`)
    return;
  }

  const { default: page } = await loadPage();

  document.querySelector(`#${slot}`).innerHTML = page.html(opts);

  if (page.script) page.script(opts);
}