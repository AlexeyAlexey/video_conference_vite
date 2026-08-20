# Streaming Skill

## WebTransport Connection

```javascript
import { StreamServer } from '@/streamServer'

// Connect with certificate hash (self-signed)
const streamServer = new StreamServer(uri, certHash)
await streamServer.connect()

// Or without certificate verification
const streamServer = new StreamServer(uri)
await streamServer.connect()
```

## Bidirectional Streams

```javascript
// Get writer and reader
const writer = await streamServer.getWriter()
const reader = await streamServer.getReader()

// Write data
const encoder = new TextEncoder()
const chunk = encoder.encode('data')
await writer.write(chunk)

// Read data
while (true) {
  const { value, done } = await reader.read()
  if (done) break
  // Process value (Uint8Array)
}
```

## Unidirectional Streams

```javascript
// Send only
const uniWriter = await streamServer.getUnidirectionalWriter()
await uniWriter.write(chunk)

// Receive only
const uniReader = await streamServer.getUnidirectionalReader()
while (true) {
  const { value, done } = await uniReader.read()
  if (done) break
  // Process value
}
```

## Stream Message Protocol

**Standard Streams:**
- Magic bytes: `MS` (77, 83)
- Used for: Video, audio, general data

**Conference Streams:**
- Magic bytes: `MSE` (77, 83, 69)
- Used for: Multi-participant conference streams

### Header Structure

```
[0-1]:   Magic bytes (2 bytes)
[2-5]:   Package length (4 bytes, big-endian)
[6]:     isVideo (1 byte: 1 = video, 0 = audio)
[7-10]:  Sequence number (4 bytes, big-endian)
[11-14]: Type (4 bytes, big-endian)
[15-18]: Key (4 bytes, big-endian)
[19-26]: Timestamp (8 bytes, BigInt, big-endian)
[27-30]: Byte length (4 bytes, big-endian)
[31+]:   Body (variable length)
```

## Encoding/Decoding

### Video Encoding

```javascript
import { encodeVideoChunk } from '@/utils/encodeVideoChunk'

const chunk = encodeVideoFrame(videoFrame, isKeyFrame)
await writer.write(chunk)
```

### Audio Encoding

```javascript
import { encodeAudioChunk } from '@/utils/encodeAudioChunk'

const chunk = encodeAudioChunk(audioBuffer)
await writer.write(chunk)
```

### Decoding

```javascript
import { decodeVideoChunk } from '@/utils/decodeVideoChunk'
import { decodeAudioChunk } from '@/utils/decodeAudioChunk'

// In reader loop
if (isVideo) {
  const frame = decodeVideoChunk(chunk)
  renderFrame(frame)
} else {
  const buffer = decodeAudioChunk(chunk)
  playAudio(buffer)
}
```

## Error Handling

```javascript
try {
  await streamServer.connect()
} catch (error) {
  console.error('Connection failed:', error)
}

// Check connection status before sending
if (!streamServer.connected) {
  console.warn('Not connected, cannot send')
}
```
