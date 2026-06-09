import { render, goTo, initRouter } from '@/router'
import { phoneChannel } from '@/channels/phoneChannel.js'


export default function template(props = {}) {

  const startCall = document.querySelector('button#startCall');
  const dropCall = document.querySelector('button#dropCall');

  console.log(props)

  dropCall.addEventListener('click', (event) => {
    render('/phones')
  });

  startCall.addEventListener('click', (event) => {
    phoneChannel.channel.push("income_call", { from_host: props.from_host, from: props.from })
      .receive("ok", (payload) => {
        render('/call', {
          switchboard_video_uri: payload.switchboard_video_uri,
          switchboard_video_server_cert_hash: payload.switchboard_video_server_cert_hash,
          switchboard_audio_uri: payload.switchboard_audio_uri,
          switchboard_audio_server_cert_hash: payload.switchboard_audio_server_cert_hash
        })
      })
      .receive("error", err => console.error("phoenix errored", err))
      .receive("timeout", () => console.error("timed out pushing"))



  });


}