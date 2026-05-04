import { ParticipantPlayer } from './participant_player.js';

export class ParticipantPlayerManager {
  participants = new Map();

  constructor(currentParticipantId) {
    this.currentParticipantId = currentParticipantId
  }

  add(participantId) {
    if (this.currentParticipantId != participantId && !this.participants.has(participantId)) {

      const participant = new ParticipantPlayer(participantId)
      participant.start({
        codec: 'vp8',
        width: 640,
        height: 360,
        frameRate: 30
      }, {})
      this.participants.set(participantId, participant);
      console.log(`added participant  ${participantId}`)

    }

    return this
  }

  remove(participantId) {
    if (this.currentParticipantId != participantId && this.participants.has(participantId)) {
      this.participants.get(participantId).destroy();
      this.participants.delete(participantId);
      console.log(`Participant (${participantId}) was removed`)

    }
    else {
      console.log(`Participant (${participantId}) cannot be found to remove`)
    }

    return this;
  }

  replace(participantId) {
    this.remove(participantId).add(participantId)

    return this;
  }

  play(participantId, videoChunk) {
    if (this.currentParticipantId != participantId && this.participants.has(participantId)) {
      this.participants.get(participantId).play(videoChunk);

    }
    else if (this.currentParticipantId != participantId && this.participants.has(participantId) == false) {
      this.add(participantId).participants.get(participantId).play(videoChunk);
    }

    return this;
  }

  playAudio(participantId, audioChunk) {
    if (this.currentParticipantId != participantId && this.participants.has(participantId)) {
      this.participants.get(participantId).playAudio(audioChunk);

    }
    else if (this.currentParticipantId != participantId && this.participants.has(participantId) == false) {
      this.add(participantId).participants.get(participantId).playAudio(audioChunk);
    }

    return this;
  }
}