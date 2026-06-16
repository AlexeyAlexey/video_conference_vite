import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const addPhoneToPhoneBookApi = (params) => {

  return baseApi.post(`/phone_book/add_phone`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  addPhoneToPhoneBookApi
}