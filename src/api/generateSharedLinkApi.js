import baseApi from './baseApi'
import { storage } from '@/storage.js'

export const generateSharedLinkApi = (params) => {
  return baseApi.post(`/shared_link/generate`, params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  generateSharedLinkApi
}