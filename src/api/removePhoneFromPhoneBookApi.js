import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const removePhoneFromPhoneBookApi = (params = {}) => {

  return baseApi.delete(`/phone_book/remove_phone`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  removePhoneFromPhoneBookApi
}
