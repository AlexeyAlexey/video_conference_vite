import { Controller } from '@/controller.js'
import html from '@/pages/phonesList/phonesList.template.html?tpl'
import js from '@/pages/phonesList/phonesList.template.js'
import { initAppIfRequired } from '@/initAppIfRequired.js'
import { render } from '@/router.js'
import { authenticated } from '@/authenticated.js'


export class PhonesListController extends Controller {
  constructor(opts = {}) {
    super(opts);
  }

  call() {
    if (authenticated()) {
      initAppIfRequired();
      this.draw();
    } else {
      render('/log-in')
    }
  }

  draw() {
    document.querySelector('#app').innerHTML = html(this.opts);

    js(this.opts);
  }
}