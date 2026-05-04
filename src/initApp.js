import { managerWS } from '@/managerWS.js'
import { phoneChannel } from '@/channels/phoneChannel.js'
import { storage } from '@/storage.js'

export function initApp(authToken, phone) {
  managerWS.connect(authToken);
  phoneChannel.join(phone)

  return true;
}