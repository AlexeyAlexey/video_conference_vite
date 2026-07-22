import { StreamServer } from "@/streamServer.js"
import { decodeVideoChunk } from '@/utils/decodeVideoChunk.js';
import { decodeAudioChunk } from '@/utils/decodeAudioChunk.js';
import { decodeChunk } from '@/utils/conference/decodeConferenceChunk.js';
import { encodeEvent } from '@/utils/encodeEvent.js';
import { UserStreamCamera } from '@/userStreamCamera.js';
import { SoundPlayer } from '@/soundPlayer.js';
import { eventDispatcher } from '@/eventDispatcher.js'
import { ConferenceStreamParser } from "@/conferenceCall/conferenceStreamParser.js"
import { ConferenceParticipantManager } from "@/conferenceCall/conferenceParticipantManager.js"

export class ConferenceCall {
	constructor(switchboardVideoUri,
		switchboardVideoServerCertHash = null,
		switchboardAudioUri,
		switchboardAudioServerCertHash = null,
		currentParticipantName = null,
		viewParticipantManager,
		currentParticipantVideoElement,
		opts = {}) {

		this.switchboardVideoUri = switchboardVideoUri;
		this.switchboardAudioUri = switchboardAudioUri;

		this.videoStream = new StreamServer(switchboardVideoUri,
			switchboardVideoServerCertHash,
			new ConferenceStreamParser(1024 * 1024));

		this.audioStream = new StreamServer(switchboardAudioUri,
			switchboardAudioServerCertHash,
			new ConferenceStreamParser(1024 * 1024));

		this.userStreamCamera = new UserStreamCamera(
			currentParticipantVideoElement,
			this.videoStream.write.bind(this.videoStream),
			this.audioStream.write.bind(this.audioStream),
			{
				codec: 'vp8',
				width: 640,
				height: 360,
				frameRate: 30,
				videoEnabled: opts.cameraEnabled ?? false
			},
			{ audioEnabled: opts.audioEnabled ?? true }
		);

		this.soundPlayer = new SoundPlayer()

		this.currentParticipantName = currentParticipantName || "";
		this.viewParticipantManager = viewParticipantManager;
		this.participantManager = new ConferenceParticipantManager(viewParticipantManager)

	}

	start() {
		this.videoStream.connect()
			.catch((e) => { console.info(`cannot connect to a server for video streaming error: ${e}`) })
			.then(() => {

				console.info('connected to a server to stream video');

				this.userStreamCamera.startVideo();
				this.startVideoReading();


			});

		this.audioStream.connect()
			.catch((e) => { console.info(`cannot connect to a server for audio streaming error: ${e}`) })
			.then(() => {

				this.userStreamCamera.startAudio();
				this.startAudioReading();


			});

		this.#sendEvent(`name:${this.currentParticipantName}`);
	}

	end() {
		this.userStreamCamera.stop('user_ended_call')

		this.videoStream.disconnect('user_ended_call');
		this.audioStream.disconnect('user_ended_call');
		eventDispatcher.emit("conference-call-ended", { reason: 'reason' })

	}

	enableVideo() {
		this.userStreamCamera.enableVideo();
	}

	disableVideo() {
		this.userStreamCamera.disableVideo();
	}

	enableAudio() {
		this.userStreamCamera.enableAudio();
	}

	disableAudio() {
		this.userStreamCamera.disableAudio();
	}

	setParticipantName(name) {
		this.#sendEvent(name);
	}

	async startVideoReading() {
		this.videoStream.reader((value) => {
			if (value) {
				try {
					const decoded = decodeChunk(value);

					if (decoded.dataType == "video") {
						this.participantManager.playVideo(decoded.participantId, decoded);
					} else if (decoded.dataType == "close") {
						// this.soundPlayer.play(decoded.body)
						console.log(`video closed ${decoded.body}`)
					}

				} catch (error) {
					console.info("Stream Video reader error:", error);
				}

			}
		});
	}

	async startAudioReading() {
		this.audioStream.reader((value) => {
			if (value) {
				try {
					const decoded = decodeChunk(value);

					if (decoded.dataType == "audio") {
						this.participantManager.playAudio(decoded.participantId, decoded);
					} else if (decoded.dataType == "ringtone") {
						// this.soundPlayer.play(decoded.body)
					} else if (decoded.dataType == "close") {
						// this.soundPlayer.play(decoded.body)
						console.log(`audio closed ${decoded.body}`)

						eventDispatcher.emit("conference-call-ended", { reason: decoded.body, from: this.phone, to: this.toPhone })
					} else if (decoded.dataType == "event") {
						this.#processEvent(decoded.participantId, decoded.body);
					}

				} catch (error) {
					console.info("Stream Audio reader error:", error);

					console.log(value)
				}

			}


		})
	}

	async #processEvent(participantId, event) {
		switch (event.eventName) {
			case "NameIsSet":
				this.participantManager.renameParticipant(participantId, event.name);
				break;

			default:
				console.info(`An event processing is not implemented ${event.eventName}`);
		}
	}

	#sendEvent(info) {

		encodeEvent({ eventName: "NameIsSet", name: "Alex" }).then(finalBuffer => {

			this.audioStream.write(finalBuffer);


		}).catch((e) => {
			console.error('Error ConferenceCall encodeEvent: ', e);
		});
	}


}
