import { render, goTo, initRouter } from '@/router'
import { PhoneCall } from '@/phoneCall.js'
import { storage } from '@/storage.js'


export default function template(props = {}) {
  const stage = document.getElementById('callStage');
  const vid = document.getElementById('localVideo');
  const endCallBtn = document.getElementById('end-call');

  if (!stage || !vid) return;

  const PADDING = 16; // px
  let dragging = false;
  let offsetX = 0, offsetY = 0;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function layoutBottomRight() {
    // Ensure sizes are known
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const vw = vid.offsetWidth || vid.clientWidth;
    const vh = vid.offsetHeight || vid.clientHeight;
    const left = sw - vw - PADDING;
    const bar = document.getElementById('controlBar');
    const barH = bar ? bar.getBoundingClientRect().height : 0;
    const top = sh - vh - barH - PADDING;
    vid.style.left = left + 'px';
    vid.style.top = top + 'px';
  }

  function startDrag(e) {
    e.preventDefault();
    vid.setPointerCapture?.(e.pointerId);
    dragging = true;
    const rect = vid.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }

  function onMove(e) {
    if (!dragging) return;
    const stageRect = stage.getBoundingClientRect();
    const vw = vid.offsetWidth;
    const vh = vid.offsetHeight;
    let x = e.clientX - stageRect.left - offsetX;
    let y = e.clientY - stageRect.top - offsetY;
    x = clamp(x, PADDING, stageRect.width - vw - PADDING);
    y = clamp(y, PADDING, stageRect.height - vh - PADDING);
    vid.style.left = x + 'px';
    vid.style.top = y + 'px';
  }

  function endDrag(e) {
    dragging = false;
    try { vid.releasePointerCapture?.(e.pointerId); } catch (_) { }
  }

  layoutBottomRight();

  // Initialize after layout
  window.addEventListener('load', layoutBottomRight, { once: true });
  window.addEventListener('resize', layoutBottomRight);

  vid.addEventListener('pointerdown', startDrag);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });
  window.addEventListener('blur', endDrag, { passive: true });



  const remoteUserVideoElement = document.getElementById('remoteVideo');
  const callerUserVideoElement = document.getElementById('localVideo');
  const videoToggleBtn = document.getElementById('videoToggleBtn');
  var videoEnabled = false;
  var audioEnabled = true;


  const previewVideoIconOn = document.getElementById('previewVideoIconOn');
  const previewVideoIconOff = document.getElementById('previewVideoIconOff');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const previewAudioIconOn = document.getElementById('previewAudioIconOn');
  const previewAudioIconOff = document.getElementById('previewAudioIconOff');

  // const phone = globalThis.phone;
  const phone = storage.get('phone');
  const toPhone = props.to;

  const phoneCall = new PhoneCall(
    phone,
    toPhone,
    props.switchboard_video_uri,
    props.switchboard_video_server_cert_hash,
    props.switchboard_audio_uri,
    props.switchboard_audio_server_cert_hash,
    remoteUserVideoElement,
    callerUserVideoElement,
    {
      cameraEnabled: false,
      audioEnabled: true
    });

  phoneCall.call()



  endCallBtn.addEventListener('click', () => {
    phoneCall.endCall()
    // render('/phones')
  });

  function updateVideoToggleUI() {
    try {
      if (previewVideoIconOn && previewVideoIconOff) {
        if (videoEnabled) {
          previewVideoIconOn.classList.remove('hidden');
          previewVideoIconOff.classList.add('hidden');
        } else {
          previewVideoIconOn.classList.add('hidden');
          previewVideoIconOff.classList.remove('hidden');
        }
      }
    } catch { }
  }

  function updateAudioToggleUI() {
    try {
      if (previewAudioIconOn && previewAudioIconOff) {
        if (audioEnabled) {
          previewAudioIconOn.classList.remove('hidden');
          previewAudioIconOff.classList.add('hidden');
        } else {
          previewAudioIconOn.classList.add('hidden');
          previewAudioIconOff.classList.remove('hidden');
        }
      }
    } catch { }
  }


  videoToggleBtn?.addEventListener('click', () => {
    videoEnabled = !videoEnabled;
    try {
      if (videoEnabled) {
        phoneCall.enableVideo();
      } else {
        phoneCall.disableVideo();
      }
    } catch { }
    updateVideoToggleUI();
  });


  audioToggleBtn?.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    try {
      if (audioEnabled) {
        phoneCall.enableAudio();
      } else {
        phoneCall.disableAudio();
      }
    } catch { }
    updateAudioToggleUI();
  });


}