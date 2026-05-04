import { storage } from '@/storage.js'
import { initApp } from '@/initApp.js'

export function initAppIfRequired() {
  const authToken = storage.getAuthToken();

  if (authToken) {
    const phone = storage.get('phone');

    initApp(authToken, phone)
  }
}