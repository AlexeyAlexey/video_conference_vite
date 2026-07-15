import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const removeSharedLinkApi = (params = {}) => {

  return baseApi.delete(`/shared_link/remove`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  removeSharedLinkApi
}