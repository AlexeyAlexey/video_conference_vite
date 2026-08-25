import baseApi from './baseApi'
import { storage } from '@/storage.js'

// Enable shared link password
// api call file name: enableSharedLinkPasswordApi.js
// endpoint: /shared_link/enable_password
// method: post
// params: id - required, password - required
// headers: authorization - string(required). Format: 'Bearer __authToken__'
//
// response: {"id": id, "password_required": true}

export const enableSharedLinkPasswordApi = (params) => {

  return baseApi.post(`/shared_link/enable_password`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  enableSharedLinkPasswordApi
}
