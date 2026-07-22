export class ConferenceViewParticipantManager {
  constructor(participantsContainerId) {
    this.participantsContainerId = participantsContainerId;
    this.participantsContainer = document.getElementById(participantsContainerId);
  }

  add(participantId, name) {
    if (this.#exists(participantId)) return;

    const p = this.#createParticipant(participantId, name);

    this.participantsContainer.appendChild(p);

    return this
  }

  remove(participantId) {


    return this;
  }

  getVideoElement(participantId) {
    return document.getElementById(`video:${participantId}`);
  }

  renameParticipant(participantId, name) {
    if (this.#exists(participantId)) {
      const nameContainer = this.participantsContainer.querySelector(`div[id="name:${participantId}"]`);

      if (nameContainer) { nameContainer.textContent = name; };
    }

    return this
  }

  #exists(participantId) {
    if (document.getElementById(`participantContainer:${participantId}`)) {
      return true
    } else {
      return false
    };
  }

  #createParticipant(participantId, name) {
    const card = document.createElement('div');
    card.className = 'card bg-base-100 shadow';
    card.id = `participantContainer:${participantId}`
    card.innerHTML = `
      <figure class="aspect-video bg-base-300">
        <video id="video:${participantId}" class="w-full h-full object-cover" autoplay muted playsinline></video>
      </figure>
      <div class="card-body p-3">
        <div class="flex items-center justify-between">
          <div id="name:${participantId}" class="font-medium text-sm" data-role="name">${name}</div>
          <span class="badge badge-sm">Mic on</span>
        </div>
      </div>
    `;
    return card;
  }

}