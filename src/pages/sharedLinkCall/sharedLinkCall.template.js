import { render, goTo, initRouter } from '@/router'
// import { ConferenceCall } from '@/conferenceCall/conferenceCall.js'
import { publicSharedLinkConferenceCredentialsApi } from '@/api/publicSharedLinkConferenceCredentialsApi.js'
import { getSharedLinkPublicInfo } from '@/api/getSharedLinkPublicInfo.js'
import { ConferenceViewParticipantManager } from '@/conferenceCall/conferenceViewParticipantManager.js'
import { ConferenceCall } from '@/conferenceCall/conferenceCall.js'


export default function template(props = {}) {

  // const grid = document.getElementById('remotesGrid');
  const conferenceViewParticipantManager = new ConferenceViewParticipantManager('remotesGrid');
  const addBtn = document.getElementById('btnAddParticipant');
  const toggleCamBtn = document.getElementById('btnToggleCamera');
  const toggleMicBtn = document.getElementById('btnToggleMic');
  const hangupBtn = document.getElementById('btnHangup');
  const localMicBadge = document.getElementById('localMicBadge');
  const ariaStatus = document.getElementById('ariaStatus');
  const localVideo = document.getElementById('localVideo');
  const dockEl = document.getElementById('controlDock');
  const iconCamOn = document.getElementById('iconCamOn');
  const iconCamOff = document.getElementById('iconCamOff');
  const iconMicOn = document.getElementById('iconMicOn');
  const iconMicOff = document.getElementById('iconMicOff');

  let isCameraOn = false;
  let isMicOn = true;
  let participantCount = 1;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  if (localVideo) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    // place at bottom-left above dock initially
    function positionBottomLeft() {
      const rect = localVideo.getBoundingClientRect();
      const vh = window.innerHeight;
      const bottomPad = (dockEl ? dockEl.offsetHeight : 0) + 8;
      const top = vh - rect.height - bottomPad;
      localVideo.style.left = '16px';
      localVideo.style.top = clamp(top, 8, vh - rect.height - bottomPad) + 'px';
    }

    requestAnimationFrame(positionBottomLeft);

    function ensureNumericPosition() {
      const cs = window.getComputedStyle(localVideo);
      if (!cs.left || cs.left === 'auto') localVideo.style.left = localVideo.getBoundingClientRect().left + 'px';
      if (!cs.top || cs.top === 'auto') localVideo.style.top = localVideo.getBoundingClientRect().top + 'px';
    }

    function onPointerDown(e) {
      ensureNumericPosition();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseFloat(localVideo.style.left || '0');
      startTop = parseFloat(localVideo.style.top || '0');
      localVideo.setPointerCapture(e.pointerId);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp, { once: true });
    }

    function onPointerMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = localVideo.getBoundingClientRect();
      const elW = rect.width;
      const elH = rect.height;
      const bottomPad = (dockEl ? dockEl.offsetHeight : 0) + 8;
      const maxLeft = vw - elW - 8;
      const maxTop = vh - elH - bottomPad;
      const newLeft = clamp(startLeft + dx, 8, maxLeft);
      const newTop = clamp(startTop + dy, 8, maxTop);
      localVideo.style.left = newLeft + 'px';
      localVideo.style.top = newTop + 'px';
    }

    function onPointerUp(e) {
      window.removeEventListener('pointermove', onPointerMove);
    }

    localVideo.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('resize', () => {
      const rect = localVideo.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bottomPad = (dockEl ? dockEl.offsetHeight : 0) + 8;
      const maxLeft = vw - rect.width - 8;
      const maxTop = vh - rect.height - bottomPad;
      localVideo.style.left = clamp(rect.left, 8, maxLeft) + 'px';
      localVideo.style.top = clamp(rect.top, 8, maxTop) + 'px';
    });
  }

  function announce(msg) {
    if (ariaStatus) ariaStatus.textContent = msg;
  }

  function createParticipant(name) {
    const card = document.createElement('div');
    card.className = 'card bg-base-100 shadow';
    card.innerHTML = `
      <figure class="aspect-video bg-base-300">
        <video class="w-full h-full object-cover" autoplay muted playsinline></video>
      </figure>
      <div class="card-body p-3">
        <div class="flex items-center justify-between">
          <div class="font-medium text-sm" data-role="name">${name}</div>
          <span class="badge badge-sm">Mic on</span>
        </div>
      </div>
    `;
    return card;
  }





  var conferenceCall = null;

  // --- Shared link gate: check password requirement, then join ---
  const gate = document.getElementById('sharedLinkGate');
  const gateLoading = document.getElementById('gateLoading');
  const gatePassword = document.getElementById('gatePassword');
  const gateError = document.getElementById('gateError');
  const gateErrorMessage = document.getElementById('gateErrorMessage');
  const gateRetryBtn = document.getElementById('gateRetryBtn');
  const passwordForm = document.getElementById('sharedLinkPasswordForm');
  const passwordInput = document.getElementById('sharedLinkPasswordInput');
  const passwordError = document.getElementById('sharedLinkPasswordError');
  const passwordSubmitBtn = document.getElementById('sharedLinkPasswordSubmitBtn');
  const passwordSpinner = document.getElementById('sharedLinkPasswordSpinner');
  const passwordBtnLabel = document.getElementById('sharedLinkPasswordBtnLabel');

  function setGateState(state) {
    if (!gate) return;
    if (gateLoading) gateLoading.classList.toggle('hidden', state !== 'loading');
    if (gatePassword) gatePassword.classList.toggle('hidden', state !== 'password');
    if (gateError) gateError.classList.toggle('hidden', state !== 'error');
  }

  function hideGate() {
    if (!gate) return;
    gate.classList.add('hidden');
    gate.remove();
  }

  function showGateError(message) {
    if (gateErrorMessage) gateErrorMessage.textContent = message;
    setGateState('error');
  }

  function setPasswordLoading(loading) {
    if (passwordSubmitBtn) passwordSubmitBtn.disabled = loading;
    if (passwordSpinner) passwordSpinner.classList.toggle('hidden', !loading);
    if (passwordBtnLabel) passwordBtnLabel.textContent = loading ? 'Joining…' : 'Join';
  }

  function showPasswordError(message) {
    if (!passwordError) return;
    passwordError.textContent = message;
    passwordError.classList.remove('hidden');
  }

  function joinConference(credentials) {
    conferenceCall = new ConferenceCall(
      credentials.switchboard_video_uri,
      credentials.switchboard_video_server_cert_hash,
      credentials.switchboard_audio_uri,
      credentials.switchboard_audio_server_cert_hash,
      "currentParticipantName",
      conferenceViewParticipantManager,
      localVideo
    );

    conferenceCall.start();

    // conferenceCall.enableVideo();
    conferenceCall.enableAudio();

    hideGate();
  }

  function fetchCredentials(password) {
    const params = { link_id: props.link_id };
    if (password) params.password = password;
    return publicSharedLinkConferenceCredentialsApi(params).then((credentials) => {
      joinConference(credentials);
    });
  }

  function checkSharedLinkInfo() {
    setGateState('loading');
    getSharedLinkPublicInfo({ link_id: props.link_id }).then((info) => {
      if (info && info.password_required) {
        setGateState('password');
        if (passwordInput) {
          passwordInput.value = '';
          passwordInput.focus();
        }
      } else {
        return fetchCredentials();
      }
    }).catch((e) => {
      console.error(e);
      showGateError('Unable to load the shared link. Please check your connection and try again.');
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();
      showPasswordError('');
      if (passwordError) passwordError.classList.add('hidden');

      const password = passwordInput ? passwordInput.value : '';
      if (!password) {
        showPasswordError('Please enter the password.');
        return;
      }

      setPasswordLoading(true);
      fetchCredentials(password).catch((e) => {
        console.error(e);
        setPasswordLoading(false);
        const msg = (e && e.message) ? e.message : 'Invalid password. Please try again.';
        showPasswordError(msg.charAt(0).toUpperCase() + msg.slice(1));
      });
    });
  }

  if (gateRetryBtn) {
    gateRetryBtn.addEventListener('click', () => checkSharedLinkInfo());
  }

  checkSharedLinkInfo();


  if (toggleCamBtn) {
    toggleCamBtn.addEventListener('click', () => {
      isCameraOn = !isCameraOn;
      toggleCamBtn.setAttribute('aria-pressed', String(isCameraOn));
      toggleCamBtn.classList.toggle('btn-ghost', !isCameraOn);
      if (iconCamOn && iconCamOff) {
        iconCamOn.classList.toggle('hidden', !isCameraOn);
        iconCamOff.classList.toggle('hidden', isCameraOn);
      }
      if (isCameraOn) {
        if (conferenceCall) { conferenceCall.enableVideo() };
      } else {
        if (conferenceCall) { conferenceCall.disableVideo() };

      }
      // announce(isCameraOn ? 'Camera on' : 'Camera off');
    });
  }

  if (toggleMicBtn) {
    toggleMicBtn.addEventListener('click', () => {
      isMicOn = !isMicOn;
      toggleMicBtn.setAttribute('aria-pressed', String(isMicOn));
      toggleMicBtn.classList.toggle('btn-ghost', !isMicOn);
      if (localMicBadge) localMicBadge.textContent = isMicOn ? 'Mic on' : 'Mic off';
      if (iconMicOn && iconMicOff) {
        iconMicOn.classList.toggle('hidden', !isMicOn);
        iconMicOff.classList.toggle('hidden', isMicOn);
      }
      announce(isMicOn ? 'Microphone on' : 'Microphone off');
    });
  }


  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // participantCount += 1;
      // conferenceViewParticipantManager.add(participantCount, 'Participant ' + participantCount)

      // const p = createParticipant('Participant ' + participantCount);
      // grid.appendChild(p);
      // announce('Participant added');

      if (conferenceCall) { conferenceCall.setParticipantName("ddddddd") };
    });
  }

  if (hangupBtn) {
    hangupBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

}