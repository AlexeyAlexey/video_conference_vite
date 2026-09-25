export class ConferenceViewParticipantManager {
  constructor(participantsContainerId) {
    this.participantsContainerId = participantsContainerId;
    this.participantsContainer = document.getElementById(participantsContainerId);
  }

  add(participantId, name) {
    if (this.#exists(participantId)) return;

    const p = this.#createParticipant(participantId, name);

    this.participantsContainer.appendChild(p);
    this.#updateLayout();

    return this
  }

  remove(participantId) {
    const participantContainer = document.getElementById(`participantContainer:${participantId}`);

    if (participantContainer) { participantContainer.remove(); }

    this.#updateLayout();

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

  // With a single remote participant the call looks like a one to one call
  // (remote video fills the screen). With more participants it switches
  // back to the conference grid.
  #updateLayout() {
    const container = this.participantsContainer;
    if (!container) return;

    const cards = container.querySelectorAll('[id^="participantContainer:"]');
    const isSingleRemote = cards.length === 1;

    container.classList.toggle('grid', !isSingleRemote);
    container.classList.toggle('grid-cols-2', !isSingleRemote);
    container.classList.toggle('gap-4', !isSingleRemote);
    container.classList.toggle('fixed', isSingleRemote);
    container.classList.toggle('inset-0', isSingleRemote);
    container.classList.toggle('z-0', isSingleRemote);
    container.classList.toggle('bg-black', isSingleRemote);

    cards.forEach((card) => {
      const figure = card.querySelector('figure');
      card.classList.toggle('h-full', isSingleRemote);
      if (figure) {
        figure.classList.toggle('aspect-video', !isSingleRemote);
        figure.classList.toggle('h-full', isSingleRemote);
      }
    });
  }

  #createParticipant(participantId, name) {
    const displayName = name && name.trim() ? name : `Participant ${participantId}`;

    const card = document.createElement('div');
    card.className = 'card bg-base-100 shadow overflow-hidden';
    card.id = `participantContainer:${participantId}`
    card.innerHTML = `
      <figure class="aspect-video bg-base-300 relative">
        <video id="video:${participantId}" class="w-full h-full object-cover" autoplay muted playsinline></video>
        <div id="name:${participantId}" data-role="name"
          class="absolute top-2 left-2 max-w-[70%] truncate rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">${displayName}</div>
      </figure>
    `;
    return card;
  }

}
