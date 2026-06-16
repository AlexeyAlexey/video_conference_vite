import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const listPhonesFromPhoneBookApi = (params = {}) => {

  return baseApi.get(`/phone_book/list`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  listPhonesFromPhoneBookApi
}