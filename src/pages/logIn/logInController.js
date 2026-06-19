import { Controller } from '@/controller.js'
import html from '@/pages/logIn/logIn.template.html?tpl'
import js from '@/pages/logIn/logIn.template.js'
import { AuthToken } from '@/authToken.js'
import { render } from '@/router.js'
import { authenticated } from '@/authenticated.js'

export class LogInController extends Controller {
  constructor(opts = {}) {
    super(opts)
  }

  call() {
    if (authenticated()) {
      render('/phones');
    } else {
      this.draw();
    }
  }

  draw() {
    document.querySelector('#app').innerHTML = html(this.opts);

    js(this.opts);
  }

}