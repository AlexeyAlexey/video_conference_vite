import { Controller } from '@/controller.js'
import { initAppIfRequired } from '@/initAppIfRequired.js'
import { render } from '@/router.js'
import { authenticated } from '@/authenticated.js'

import html from '@/pages/callingPopUp/callingPopUp.template.html'
import js from '@/pages/callingPopUp/callingPopUp.template.js'



export class CallingPopUpController extends Controller {
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