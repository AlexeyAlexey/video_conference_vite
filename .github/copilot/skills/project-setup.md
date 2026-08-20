# Project Setup Skill

## Build & Run Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Mobile Deployment (Capacitor)

```bash
# Add Android platform
npx cap add android

# Sync project files to native platforms
npx cap sync

# Open in Android Studio
npx cap open android
```

## Environment Variables

Required `.env` variables:

```bash
VITE_MANAGER_HTTP_SERVER_PROTOCOL=http|https
VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL=ws|wss
VITE_MANAGER_SERVER_HOST=localhost|ip-address
VITE_MANAGER_HTTP_SERVER_PORT=port-number
VITE_MANAGER_WEBSOCKET_SERVER_PORT=port-number
```

## File Structure

```
src/
├── api/              # API endpoint wrappers
├── channels/         # Phoenix channel handlers
├── conferenceCall/   # Multi-participant conference logic
├── pages/            # Page controllers + templates
│   ├── call/
│   ├── logIn/
│   ├── phonesList/
│   └── ...
├── utils/            # Utility functions
├── main.js           # Entry point
├── router.js         # Routing configuration
└── controller.js     # Base controller class
```

## Key Dependencies

- `phoenix` - WebSocket client for Phoenix Channels
- `@capacitor/*` - Mobile platform APIs
- `vite` - Build tool and dev server
- `tailwindcss` + `daisyui` - UI framework
