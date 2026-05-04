import { Controller } from '@/controller.js'
import html from '@/pages/logIn/logIn.template.html'
import js from '@/pages/logIn/logIn.template.js'
import { AuthToken } from '@/authToken.js'

export class LogInController extends Controller {
  constructor(opts = {}) {
    super(opts)
  }

  call() {
    this.draw()
  }

  draw() {
    document.querySelector('#app').innerHTML = html(this.opts);

    js(this.opts);
  }

}