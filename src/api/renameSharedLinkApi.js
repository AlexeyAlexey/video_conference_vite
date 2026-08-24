import baseApi from './baseApi'
import { storage } from '@/storage.js'

// Rename shared link
// endpoint: /shared_link/rename
// method: patch
// params: id - (required), name - string (required)
// headers: authorization - string (required). Format: 'Bearer __authToken__'

export const renameSharedLinkApi = (params) => {

  return baseApi.patch(`/shared_link/rename`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  renameSharedLinkApi
}
