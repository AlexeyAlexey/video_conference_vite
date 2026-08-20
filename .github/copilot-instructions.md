# Video Conference Vite - Copilot Instructions

## Quick Start

This is a **Vanilla JS PWA** for video conferencing with:
- Phoenix Channels (WebSocket) for signaling
- WebTransport for media streaming
- WebCodecs API for encoding/decoding

## Critical Patterns

### 1. Controller Lifecycle

```javascript
// ALWAYS call super() in constructors
class MyController extends Controller {
  constructor(opts = {}) {
    super(opts)
    // Initialize with opts data
  }

  call() {
    // Render UI, set up listeners
  }

  destroy() {
    // CLEANUP - remove listeners, close connections
    // This is called when navigating away!
  }
}
```

**Never forget cleanup in `destroy()`** - memory leaks are common if ignored.

### 2. Event System

```javascript
// Subscribe with unique IDs for cleanup
eventDispatcher.subscribe('event', 'myId', callback)

// Unsubscribe in destroy()
eventDispatcher.unsubscribe('event', 'myId')
```

### 3. Template Loading

Templates are imported as functions:

```javascript
import template from './page.template.html?tpl'

// Template receives props and returns HTML string
const html = template({ prop: 'value' })
document.querySelector('#app').innerHTML = html
```

## Common Pitfalls

1. **WebTransport reconnection** - Check `streamServer.connected` before sending
2. **Auth token expiration** - Always check `authenticated()` before API calls
3. **Phoenix channel join** - Wait for `.receive("ok")` before using channel
4. **Stream parsing** - Use `StreamMessageParser` consistently, don't manually parse binary

## File Locations Reference

| Purpose | Location |
|---------|----------|
| Controllers | `src/pages/*/Controller.js` |
| Templates | `src/pages/*.template.html` |
| WebSocket | `src/managerWS.js`, `src/channels/*` |
| Streaming | `src/streamServer.js`, `src/*Stream*.js` |
| Media | `src/userStreamCamera.js`, `src/remoteUserPlayer.js` |
| API | `src/api/*Api.js` |

## Testing Tips

- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Preview build: `npm run preview`

For mobile testing:
```bash
npx cap add android
npx cap sync
npx cap open android  # Opens Android Studio
```
