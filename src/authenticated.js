import { storage } from '@/storage.js'
import { AuthToken } from '@/authToken.js'

export function authenticated() {
  var authToken = storage.getAuthToken();


  if (authToken) {
    authToken = new AuthToken(storage.getAuthToken());

    return !authToken.isExpired();

  } else {
    return false;
  }
}