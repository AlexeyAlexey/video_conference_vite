import { StreamServer } from "@/streamServer.js"
// import { decodeVideoChunk } from '@/utils/decodeVideoChunk.js';
// import { decodeAudioChunk } from '@/utils/decodeAudioChunk.js';
// import { decodeChunk } from '@/utils/conference/decodeConferenceChunk.js';
import { decodeConferenceVideoChunk } from '@/utils/conference/decodeConferenceVideoChunk.js';
import { decodeConferenceAudioChunk } from '@/utils/conference/decodeConferenceAudioChunk.js';
import { decodeConferenceEventChunk } from '@/utils/conference/decodeConferenceEventChunk.js';

import { encodeEvent } from '@/utils/encodeEvent.js';
import { UserStreamCamera } from '@/userStreamCamera.js';
import { SoundPlayer } from '@/soundPlayer.js';
import { eventDispatcher } from '@/eventDispatcher.js'
import { ConferenceStreamParser } from "@/conferenceCall/conferenceStreamParser.js"
import { ConferenceParticipantManager } from "@/conferenceCall/conferenceParticipantManager.js"

export class ConferenceCall {
	constructor(
		stream_server_credentials = {},
		currentParticipantName = null,
		viewParticipantManager,
		currentParticipantVideoElement,
		opts = {}) {

		this.streamServerVideoUri = stream_server_credentials.stream_server_video_uri || null; // streamServerVideoUri;
		this.streamServerAudioUri = stream_server_credentials.stream_server_audio_uri || null //streamServerAudioUri;
		this.streamServerEventUri = stream_server_credentials.stream_server_event_uri || null //streamServerAudioUri;


		this.streamServerVideoCertHash = stream_server_credentials.stream_server_video_server_cert_hash || null //streamServerAudioUri;
		this.streamServerAudioCertHash = stream_server_credentials.stream_server_audio_server_cert_hash || null //streamServerAudioUri;
		this.streamServerEventCertHash = stream_server_credentials.stream_server_event_server_cert_hash || null //streamServerAudioUri;

		this.videoStream = null;
		this.audioStream = null;
		this.eventStream = null;

		// this.initVideoStream();
		this.initAudioStream();
		this.initEventStream();

		this.userStreamCamera = new UserStreamCamera(
			currentParticipantVideoElement,
			null,
			null,
			// this.videoStream.unidirectionalWrite.bind(this.videoStream),
			// this.videoStream.write.bind(this.videoStream),
			// this.audioStream.write.bind(this.audioStream),
			// this.audioStream.unidirectionalWrite.bind(this.audioStream),
			{
				codec: 'vp8',
				width: 640,
				height: 360,
				frameRate: 30,
				videoEnabled: opts.cameraEnabled ?? false
			},
			{ audioEnabled: opts.audioEnabled ?? true }
		);

		if (this.videoStream) {
			this.userStreamCamera.setVideoStream(this.videoStream.write.bind(this.videoStream));
		}

		if (this.audioStream) {
			this.userStreamCamera.setAudioStream(this.audioStream.write.bind(this.audioStream));
		}

		this.soundPlayer = new SoundPlayer()

		this.currentParticipantName = currentParticipantName || "";
		this.viewParticipantManager = viewParticipantManager;
		this.participantManager = new ConferenceParticipantManager(viewParticipantManager)

	}

	initVideoStream() {
		if (this.videoStream) return

		if (this.streamServerVideoUri) {
			this.videoStream = new StreamServer(this.streamServerVideoUri,
				this.streamServerVideoCertHash,
				new ConferenceStreamParser(1024 * 1024),
				{
					initUnidirectionalStreamWriter: false,
					initUnidirectionalStreamReader: false
				});
		} else {
			console.error("Video Stream cannot be initialized. streamServerVideoUri is not setup")
		}
	}

	initAudioStream() {
		if (this.audioStream) return

		if (this.streamServerAudioUri) {
			this.audioStream = new StreamServer(this.streamServerAudioUri,
				this.streamServerAudioCertHash,
				new ConferenceStreamParser(1024 * 1024),
				{
					initUnidirectionalStreamWriter: false,
					initUnidirectionalStreamReader: false
				});

		};
	}

	initEventStream() {
		if (this.eventStream) return

		if (this.streamServerEventUri) {

			this.eventStream = new StreamServer(this.streamServerEventUri,
				this.streamServerEventCertHash,
				new ConferenceStreamParser(1024 * 1024),
				{
					initUnidirectionalStreamWriter: false,
					initUnidirectionalStreamReader: false
				});
		}
	}

	start() {
		this.startVideoStream();

		if (this.audioStream !== null) {
			this.audioStream.connect()
				.catch((e) => { console.info(`cannot connect to a server for audio streaming error: ${e}`) })
				.then(() => {

					this.userStreamCamera.startAudio();

					this.startAudioReading();


					// this.startUnidirectionalAudioReading();


				});
		}

		if (this.eventStream !== null) {
			this.eventStream.connect()
				.catch((e) => { console.info(`cannot connect to a server for event streaming error: ${e}`) })
				.then(() => {


					console.info('event stream connected')
					this.startEventReading();

				});
		}
		// this.#sendEvent(`name:${this.currentParticipantName}`);
	}

	end() {
		this.userStreamCamera.stop('user_ended_call')

		if (this.videoStream !== null) {
			this.videoStream.disconnect('user_ended_call');
		};


		if (this.audioStream !== null) {
			this.audioStream.disconnect('user_ended_call');
		};

		if (this.eventStream !== null) {
			this.eventStream.disconnect('user_ended_call');
		};

		eventDispatcher.emit("conference-call-ended", { reason: 'reason' })

	}

	startVideoStream() {
		if (this.videoStream == null) return

		this.videoStream.connect()
			.catch((e) => { console.info(`cannot connect to a server for video streaming error: ${e}`) })
			.then(() => {

				console.info('connected to a server to stream video');


				this.userStreamCamera.startVideo();

				this.startVideoReading();


				// this.startUnidirectionalVideoReading();


			});
	}

	enableVideoStream() {
		this.initVideoStream();
		if (this.videoStream) {
			this.userStreamCamera.setVideoStream(this.videoStream.write.bind(this.videoStream));
			this.startVideoStream();
		} else {
			console.error("VideoStream cannot be enabled")

		}

	}

	disableVideoStream() {
		this.userStreamCamera.stopVideo();
		this.videoStream.disconnect();

		this.videoStream = null;
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

	#sendEvent(info) {

		encodeEvent({ eventName: "NameIsSet", name: "Alex" }).then(finalBuffer => {

			this.eventStream.write(finalBuffer);


		}).catch((e) => {
			console.error('Error ConferenceCall encodeEvent: ', e);
		});
	}

	setParticipantName(name) {
		this.#sendEvent(name);
	}


	async #processEvent(event) {

		switch (event.event_name) {
			case "NameIsSet":
				this.participantManager.renameParticipant(event.participantId, event.name);
				break;

			case "participant_left":
				this.participantManager.remove(event.participant_id);

				break;

			default:
				console.info(`An event processing is not implemented ${event.eventName}`);
		}
	}


	// #process_stream_package(value) {
	// 	if (value) {
	// 		try {
	// 			const decoded = decodeChunk(value);

	// 			if (decoded.dataType == "audio") {
	// 				this.participantManager.playAudio(decoded.participantId, decoded);
	// 			} else if (decoded.dataType == "ringtone") {
	// 				// this.soundPlayer.play(decoded.body)
	// 			} else if (decoded.dataType == "close") {
	// 				// this.soundPlayer.play(decoded.body)
	// 				console.log(`audio closed ${decoded.body}`)

	// 				eventDispatcher.emit("conference-call-ended", { reason: decoded.body, from: this.phone, to: this.toPhone })
	// 			} else if (decoded.dataType == "event") {
	// 				this.#processEvent(decoded.participantId, decoded.body);
	// 			}

	// 		} catch (error) {
	// 			console.info("Stream Audio reader error:", error);

	// 			console.log(value)
	// 		}

	// 	}
	// }


	async startVideoReading() {
		this.videoStream.reader((value) => {
			if (value) {
				try {
					const decoded = decodeConferenceVideoChunk(value);
					this.participantManager.playVideo(decoded.participantId, decoded);

				} catch (error) {
					console.info("Stream Video reader error:", error);
				}

			}
		});
	}

	async startUnidirectionalVideoReading() {
		this.videoStream.unidirectionalReader((value) => {
			// if (value) {
			// 	try {
			// 		const decoded = decodeChunk(value);

			// 		console.log(value)

			// 		if (decoded.dataType == "video") {
			// 			this.participantManager.playVideo(decoded.participantId, decoded);
			// 		} else if (decoded.dataType == "close") {
			// 			// this.soundPlayer.play(decoded.body)
			// 			console.log(`video closed ${decoded.body}`)
			// 		}

			// 	} catch (error) {
			// 		console.info("Stream Video reader error:", error);
			// 	}

			// }
		});
	}

	async startUnidirectionalAudioReading() {
		this.audioStream.unidirectionalReader((value) => {
			// this.#process_stream_package(value);

			// if (value) {
			// 	try {
			// 		const decoded = decodeChunk(value);

			// 		console.log('startUnidirectionalAudioReading')
			// 		console.log(decoded)

			// 		// if (decoded.dataType == "video") {
			// 		// 	this.participantManager.playVideo(decoded.participantId, decoded);
			// 		// } else if (decoded.dataType == "close") {
			// 		// 	// this.soundPlayer.play(decoded.body)
			// 		// 	console.log(`video closed ${decoded.body}`)
			// 		// }

			// 	} catch (error) {
			// 		console.info("Stream Video reader error:", error);
			// 	}

			// }
		});
	}



	async startAudioReading() {
		this.audioStream.reader((value) => {
			// this.#process_stream_package(value);

			try {
				const decoded = decodeConferenceAudioChunk(value);

				this.participantManager.playAudio(decoded.participantId, decoded);

			} catch (error) {
				console.info("Stream Audio reader error:", error);
			}

		})
	}

	async startEventReading() {
		this.eventStream.reader((value) => {
			if (value) {
				try {
					const decoded = decodeConferenceEventChunk(value);

					this.#processEvent(decoded.body);

				} catch (error) {
					console.info("Stream Video reader error:", error);
				}

			}
		});
	}






}
