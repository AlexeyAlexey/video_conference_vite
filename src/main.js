import './style.css'

import { render, goTo, initRouter, render_slot } from './router'
import { eventDispatcher } from '@/eventDispatcher.js'
import { phoneChannel } from '@/channels/phoneChannel.js'



initRouter()


eventDispatcher.subscribe("income-call", "income-call", (payload) => {

  phoneChannel.channel.push("income_call", { from: Number(payload.from) })
    .receive("ok", (payload) => {
      render('/calling-pop-up', payload)
    })
    .receive("error", err => console.error("phoenix errored", err))
    .receive("timeout", () => console.error("timed out pushing"))


});


eventDispatcher.subscribe("phone-call-ended", "call-ended", (payload) => {

  render('/phones')


});
