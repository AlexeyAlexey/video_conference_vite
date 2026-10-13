import { Controller } from '@/controller.js'
import html from '@/pages/sharedLinkCall/sharedLinkCall.template.html?tpl'
import js from '@/pages/sharedLinkCall/sharedLinkCall.template.js'
import { render } from '@/router.js'
import { authenticated } from '@/authenticated.js'
import videoStreamIconOn from '@/assets/video-stream-bidirectional.svg'
import videoStreamIconOff from '@/assets/video-stream-bidirectional-off.svg'


export class SharedLinkCallController extends Controller {
  constructor(opts = {}) {
    super(opts);
  }

  call() {
    this.draw();
  }

  draw() {
    document.querySelector('#app').innerHTML = html({ ...this.opts, videoStreamIconOn, videoStreamIconOff });

    js(this.opts);
  }
}