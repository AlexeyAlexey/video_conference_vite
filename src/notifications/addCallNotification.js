import { phoneChannel } from '@/channels/phoneChannel.js'
import { render } from '@/router'


export function addCallNotification({ from_host, from }, opts = {}) {
  const container = document.getElementById('notifications');
  const el = document.createElement('div');
  var audio = null;

  el.setAttribute('role', 'alert');
  el.className = 'alert bg-base-100 shadow-xl w-full max-w-full relative rounded-2xl animate-slide-in-top';
  el.innerHTML = `
          <button type="button" class="btn btn-ghost btn-circle btn-xs absolute right-1.5 top-1.5 z-20" aria-label="Dismiss" data-action="close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
          <div class="flex items-center justify-between w-full gap-3 py-1 pr-6">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="relative pulse-ring text-success shrink-0">
                <div class="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
              </div>
              <div class="min-w-0 text-left">
                <div class="font-semibold text-sm leading-tight">Incoming call</div>
                <div class="text-sm opacity-60 truncate">${from}</div>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button type="button" class="btn btn-error btn-circle btn-lg" data-action="reject" aria-label="Decline call">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                  <g transform="rotate(180 12 12)">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z"/>
                  </g>
                </svg>
              </button>
              <button type="button" class="btn btn-success btn-circle btn-lg" data-action="answer" aria-label="Answer call">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.47-1.16a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
            </div>
          </div>
        `;

  if (opts.audio) {
    audio = new Audio(`/audio/${opts.audio}`);
  }

  const stopAudio = () => {
    audio?.pause();
    audio?.remove();
    audio = null;
    el.remove();
  }

  // Destroy it after it ends
  audio?.addEventListener('ended', function () {
    audio.remove(); // Removes it from the DOM (if appended)
    audio = null;   // Frees up memory for garbage collection
  });

  el.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'close') {
      stopAudio();
      return;
    }
    if (action === 'answer') {
      stopAudio();

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
      stopAudio();
      console.log('Rejecting call from', name);

      return;
    }
  }, { passive: true });

  container.appendChild(el);
  audio?.play()
  setTimeout(() => el.remove(), 26000)
};