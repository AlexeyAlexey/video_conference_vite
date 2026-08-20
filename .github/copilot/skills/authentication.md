# Authentication Skill

## Token Management

```javascript
import { storage } from '@/storage'
import { authToken } from '@/authToken'

// Save token after login
storage.saveAuthToken(jwtToken)

// Get current token
const token = storage.getAuthToken()

// Check if token is expired
if (authToken.isExpired()) {
  // Token expired, redirect to login
}
```

## Authentication Check

```javascript
import { authenticated } from '@/authenticated'

// Check if user is authenticated
if (!authenticated()) {
  // Not authenticated, redirect to login
  goTo('/log-in')
  return
}

// User is authenticated, proceed
```

## Phoenix Channel Auth

```javascript
import { managerWS } from '@/managerWS'
import { storage } from '@/storage'

const authToken = storage.getAuthToken()
if (authToken) {
  managerWS.connect(authToken)
}
```

## API Authentication

All API calls automatically include the auth token in headers:

```javascript
import { fetchGet, fetchPost } from '@/api/baseApi'

// Headers include: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' }
const response = await fetchGet('/protected-endpoint')
```

## Login Flow

```javascript
import { LogInController } from '@/pages/logIn/logInController'
import { storage } from '@/storage'

// In login controller
async function handleLogin(phone, password) {
  const response = await fetchPost('/api/login', { phone, password })
  
  if (response.token) {
    storage.saveAuthToken(response.token)
    goTo('/phones')
  }
}
```

## Token Expiration Handling

```javascript
import { authToken } from '@/authToken'
import { storage } from '@/storage'

function checkAuth() {
  const token = storage.getAuthToken()
  
  if (!token || authToken.isExpired()) {
    storage.saveAuthToken(null)
    goTo('/log-in')
    return false
  }
  
  return true
}
```
