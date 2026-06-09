import './style.css'

import { render, goTo, initRouter, render_slot } from './router'
import { eventDispatcher } from '@/eventDispatcher.js'
import { phoneChannel } from '@/channels/phoneChannel.js'



initRouter()


eventDispatcher.subscribe("income-call", "income-call", (payload) => {
  render('/calling-pop-up', { from_host: payload.from_host, from: payload.from })

});


eventDispatcher.subscribe("phone-call-ended", "call-ended", (payload) => {

  render('/phones')


});
