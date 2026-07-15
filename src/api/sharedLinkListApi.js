import baseApi from './baseApi'
import { storage } from '@/storage.js'


export const sharedLinkListApi = (params = {}) => {

  return baseApi.get(`/shared_link/list`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  sharedLinkListApi
}