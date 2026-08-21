import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const logOutApi = (params) => {
  return baseApi.delete(`/phones/log-out`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  logOutApi
}
