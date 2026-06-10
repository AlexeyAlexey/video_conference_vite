import './style.css'

import { render, goTo, initRouter, render_slot } from '@/router'
import { eventDispatcher } from '@/eventDispatcher.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import { addCallNotification } from '@/notifications/addCallNotification.js'



initRouter()


eventDispatcher.subscribe("income-call", "income-call", (payload) => {

  addCallNotification({ from_host: payload.from_host, from: payload.from }, { audio: 'classic_phone_call.mp3' });
  // render('/calling-pop-up', { from_host: payload.from_host, from: payload.from })

});

eventDispatcher.subscribe("current-income-calls", "current-income-calls", (payload) => {

  (payload.body || []).forEach(({ from_host, from }) => addCallNotification({ from_host: from_host, from: from }));

  // render('/calling-pop-up', { from_host: payload.from_host, from: payload.from })

});



eventDispatcher.subscribe("phone-call-ended", "call-ended", (payload) => {

  render('/phones')


});
