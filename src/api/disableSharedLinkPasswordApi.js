import baseApi from './baseApi'
import { storage } from '@/storage.js'

// Disable shared link password
// endpoint: /shared_link/disable_password
// method: post
// params: id - required
// headers: authorization - string (required). Format: 'Bearer __authToken__'

export const disableSharedLinkPasswordApi = (params) => {

  return baseApi.post(`/shared_link/disable_password`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  disableSharedLinkPasswordApi
}
