import { phoneChannel } from '@/channels/phoneChannel.js'
import { render } from '@/router'


export function addCallNotification({ from_host, from }) {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');

  el.setAttribute('role', 'alert');
  el.className = 'alert alert-vertical bg-base-100 shadow w-full max-w-full relative';
  el.innerHTML = `
          <button type="button" class="btn btn-ghost btn-circle btn-xs absolute left-1 top-1" aria-label="Close" data-action="close">✕</button>
          <div class="flex items-center justify-between w-full ps-6 pe-0 gap-4">
            <div class="min-w-0 text-left flex-1">
              <div class="font-medium truncate">Incoming call</div>
              <div class="text-sm opacity-70 truncate">${from}</div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button type="button" class="btn btn-success btn-circle btn-sm" data-action="answer" aria-label="Answer">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <button type="button" class="btn btn-error btn-circle btn-sm" data-action="reject" aria-label="Reject">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
            </div>
          </div>
        `;

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'close') {
      el.remove();
      return;
    }
    if (action === 'answer') {
      phoneChannel.channel.push("income_call", { from_host: from_host, from: from })
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

      el.remove();
      return;
    }
    if (action === 'reject') {
      console.log('Rejecting call from', name);
      el.remove();
      return;
    }
  }, { passive: true });
  container.appendChild(el);
};