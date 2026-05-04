import { Controller } from '@/controller.js'
import html from '@/pages/registerPhone/registerPhone.template.html'
import js from '@/pages/registerPhone/registerPhone.template.js'

export class RegisterPhoneController extends Controller {
  constructor(opts = {}) {
    super(opts);
  }

  call() {
    document.querySelector('#app').innerHTML = html(this.opts);

    js(this.opts);
  }
}