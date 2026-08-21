import { storage } from '@/storage.js'
import { AuthToken } from '@/authToken.js'

export function authenticated() {
  var authToken = storage.getAuthToken();

  if (authToken) {
    authToken = new AuthToken(storage.getAuthToken());

    if (authToken.isExpired()) {
      // Remove expired token and request new one
      storage.removeAuthToken();
      return false;
    }

    return true;

  } else {
    return false;
  }
}