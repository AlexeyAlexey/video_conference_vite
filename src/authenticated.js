import { storage } from '@/storage.js'
import { AuthToken } from '@/authToken.js'

export function authenticated() {
  var authToken = storage.getAuthToken();

  if (authToken) {
    try {
      authToken = new AuthToken(storage.getAuthToken());

      if (authToken.isExpired()) {
        // Remove expired token and request new one
        storage.removeAuthToken();
        return false;
      }

      return true;
    } catch (e) {
      // Malformed / non-JWT token — treat as unauthenticated and clean up
      console.warn('Invalid auth token, clearing it.', e);
      storage.removeAuthToken();
      return false;
    }
  } else {
    return false;
  }
}