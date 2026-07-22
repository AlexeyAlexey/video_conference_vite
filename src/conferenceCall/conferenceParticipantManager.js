import { RemoteUserPlayer } from '@/remoteUserPlayer.js';


export class ConferenceParticipantManager {
  participants = new Map();

  constructor(viewParticipantManager) {
    this.viewParticipantManager = viewParticipantManager;
  }

  add(participantId, name) {
    if (this.currentParticipantId != participantId && !this.participants.has(participantId)) {

      this.viewParticipantManager.add(participantId, name);

      const remoteUserVideoElement = this.viewParticipantManager.getVideoElement(participantId);

      const participant = new RemoteUserPlayer(remoteUserVideoElement);
      participant.start();

      this.participants.set(participantId, participant);
      console.info(`added participant  ${participantId}`)

    }

    return this
  }

  remove(participantId) {
    if (this.participants.has(participantId)) {
      // this.participants.get(participantId).destroy();
      this.viewParticipantManager.remove(participantId);
      this.participants.delete(participantId);

      console.info(`Participant (${participantId}) was removed`)

    }
    else {
      console.info(`Participant (${participantId}) cannot be found to remove`)
    }

    return this;
  }

  replace(participantId) {
    this.remove(participantId).add(participantId)

    return this;
  }

  playVideo(participantId, videoChunk) {
    if (this.participants.has(participantId)) {
      this.participants.get(participantId).playVideo(videoChunk);

    }
    else {
      this.add(participantId, '').participants.get(participantId).play(videoChunk);
    }

    return this;
  }

  playAudio(participantId, audioChunk) {
    if (this.participants.has(participantId)) {
      this.participants.get(participantId).playAudio(audioChunk);

    }
    else {
      this.add(participantId, '').participants.get(participantId).playAudio(audioChunk);
    }

    return this;
  }

  renameParticipant(participantId, name) {
    this.viewParticipantManager.renameParticipant(participantId, name);

    return this;
  }
}