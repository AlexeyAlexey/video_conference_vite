# Video Conference Vite - Agent Customization

## Project Overview

This is a **Video Conference PWA** built with Vite + Vanilla JS. It uses Phoenix Channels for WebSocket communication and WebTransport for real-time video/audio streaming.

### Tech Stack
- **Framework:** Vite 8.x
- **UI:** Tailwind CSS 4.x + DaisyUI 5.x
- **Real-time:** Phoenix Channels (WebSocket)
- **Streaming:** WebTransport API + WebCodecs API
- **Mobile:** Capacitor 8.x (Android)

## Architecture

### Entry Point & Routing

```
src/main.js → initRouter() → render(path) → Controller.call()
```

**Key Files:**
- `src/main.js` - Application entry point, event listener setup
- `src/router.js` - Client-side routing with path-to-controller mapping
- `src/controller.js` - Base controller class (constructor, call, destroy)

### Controller Pattern

Each page follows this pattern:

```javascript
// src/pages/*/Controller.js
import { Controller } from '@/controller'

export class PageController extends Controller {
  constructor(opts = {}) {
    super(opts)
    // Initialize with route params in opts
  }

  call() {
    // Main entry point when route is activated
    // Render UI, set up event listeners
  }

  destroy(opts = {}) {
    // Cleanup when navigating away
    // Remove event listeners, close connections
  }
}
```

### Event System

```javascript
// src/eventDispatcher.js - Custom pub/sub system
import { eventDispatcher } from '@/eventDispatcher'

// Subscribe
eventDispatcher.subscribe('eventName', 'subscriberId', callback)

// Emit
eventDispatcher.emit('eventName', payload)
```

**Key Events:**
- `income-call` - Incoming call notification
- `current-income-calls` - Current active calls list
- `phone-call-ended` - Call termination

### Real-Time Communication

#### Phoenix Channels (WebSocket)

```javascript
// src/managerWS.js - Phoenix Socket wrapper
import { managerWS } from '@/managerWS'

// Connect with auth token
managerWS.connect(authToken)

// Create channel
const channel = managerWS.channel(`phone:${phone}`, {})
channel.join()
  .receive('ok', resp => { /* joined */ })
  .receive('error', resp => { /* failed */ })

// Listen for events
channel.on('income_call', payload => {
  eventDispatcher.emit('income-call', payload)
})
```

**Phone Channel (`src/channels/phoneChannel.js`):**
- Topic: `phone:${phone}`
- Events: `income_call`, `current_income_calls`

#### WebTransport Streams

```javascript
// src/streamServer.js - WebTransport connection manager with auto-reconnect
import { StreamServer } from '@/streamServer'

const streamServer = new StreamServer(uri, certHash)
await streamServer.connect()

// Bidirectional stream
const writer = await streamServer.getWriter()
const reader = await streamServer.getReader()

// Unidirectional stream
const uniWriter = await streamServer.getUnidirectionalWriter()
const uniReader = await streamServer.getUnidirectionalReader()
```

**Reconnection Strategy:**
- Exponential backoff with jitter (prevents thundering herd)
- Base delay: 1 second, doubles each attempt
- Max delay: 30 seconds
- Max attempts: 10 before giving up
- Automatically resets on successful connection or explicit disconnect

```javascript
// Reconnection delays: 1s, 2s, 4s, 8s, 16s, 30s, 30s, ...
// With jitter: +0-25% random variation to each delay
```

**Important Notes:**
- WebTransport instance is properly cleaned up before reconnection attempts
- Certificate hash validation helps detect configuration issues early
- If "Opening handshake failed" error persists, verify:
  - Server URI is correct (protocol, host, port)
  - Certificate hash matches the server's actual certificate
  - Server supports WebTransport protocol

### Media Handling (WebCodecs)

#### User Stream (Encoding)

```javascript
// src/userStreamCamera.js - Capture & encode
import { UserStreamCamera } from '@/userStreamCamera'

const userStream = new UserStreamCamera()
await userStream.init()  // Get camera/mic
const videoChunk = userStream.encodeVideoFrame(frame)
const audioChunk = userStream.encodeAudioFrame(buffer)
```

**Encoding:**
- Video: VP8 codec via `VideoEncoder`
- Audio: OPUS codec via `AudioEncoder`

#### Remote Player (Decoding)

```javascript
// src/remoteUserPlayer.js - Decode & render
import { RemoteUserPlayer } from '@/remoteUserPlayer'

const player = new RemoteUserPlayer(videoElement, audioElement)
player.playVideo(chunk)
player.playAudio(chunk)
```

**Decoding:**
- Video: VP8 via `VideoDecoder`
- Audio: OPUS via `AudioDecoder`

### Conference Calling

```javascript
// src/conferenceCall/conferenceCall.js
import { ConferenceCall } from '@/conferenceCall/conferenceCall'

const conference = new ConferenceCall(streamServer, phone)
await conference.start()

// Participant management
conference.addParticipant(participantId, name)
conference.removeParticipant(participantId)
conference.playVideo(participantId, chunk)
conference.playAudio(participantId, chunk)
```

**Participant Manager:**
- `src/conferenceCall/conferenceParticipantManager.js` - Manages participant map
- `src/conferenceCall/conferenceViewParticipantManager.js` - UI view management

### Authentication & Storage

```javascript
// src/authToken.js - JWT parsing
import { authToken } from '@/authToken'

authToken.isExpired()  // Check token expiration

// src/storage.js - localStorage wrapper
import { storage } from '@/storage'

storage.saveAuthToken(token)
storage.getAuthToken()
storage.save(key, value)
storage.get(key)

// src/authenticated.js
import { authenticated } from '@/authenticated'

authenticated()  // Returns true if token exists and not expired
```

### API Calls

```javascript
// src/api/baseApi.js - HTTP client
import { fetchGet, fetchPost } from '@/api/baseApi'
import apiServer from '@/api'  // Configured via env vars

const response = await fetchGet('/endpoint', params)
await fetchPost('/endpoint', body)
```

**Environment Variables:**
- `VITE_MANAGER_HTTP_SERVER_PROTOCOL` - HTTP/HTTPS
- `VITE_MANAGER_SERVER_HOST` - Server hostname
- `VITE_MANAGER_HTTP_SERVER_PORT` - Port
- `VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL` - WS/WSS

## Key Conventions

1. **Module Resolution:** Use `@/` alias to `src/`
2. **Template Loading:** HTML templates imported with `?tpl` (custom Vite plugin)
3. **State Management:** localStorage for tokens and phone numbers
4. **Error Handling:** Try-catch with graceful fallbacks
5. **Async Patterns:** Promise chains with `.then().catch()`
6. **Naming:**
   - Controllers: `*Controller.js` (extends Controller class)
   - Templates: `*.template.html`, `*.template.js`
   - APIs: `*Api.js` (lowercase function names)
   - Channels: `src/channels/*.js`

## Important Notes for AI Agents

- **No framework state management** - Direct DOM manipulation in templates
- **Binary protocol** - Custom stream message parser with magic bytes
- **Event-driven** - Pub/sub system via `eventDispatcher`
- **PWA ready** - Uses webmanifest, service worker patterns
- **Mobile first** - Capacitor plugins for Android (haptics, keyboard, status bar)

## Common Tasks

### Adding a New Page

1. Create controller: `src/pages/newPage/NewPageController.js`
2. Add route in `src/router.js`:
   ```javascript
   const routes = {
     '/new-page': NewPageController,
     // ...
   }
   ```
3. Create template: `src/pages/newPage/newPage.template.html`

### Modifying Stream Protocol

1. Update magic bytes in parser
2. Modify header structure in `streamMessageParser.js`
3. Ensure encoder/decoder match the format

### Adding New WebSocket Event

1. Add event handler in channel (`src/channels/*.js`)
2. Emit to eventDispatcher: `eventDispatcher.emit('eventName', payload)`
3. Subscribe in relevant controllers

## Related Documentation

- [README.md](./README.md) - Project overview with screenshots
- [package.json](./package.json) - Dependencies and scripts
- [vite.config.js](./vite.config.js) - Build configuration
- [capacitor.config.json](./capacitor.config.json) - Mobile configuration
