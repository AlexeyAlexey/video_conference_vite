import baseApi from './baseApi'
import { storage } from '@/storage.js'

// Generating shared link
// method: get
// params: 
// name - string (required); password - string (optional)
//
// headers:
// authorization - string (required). Format: 'Bearer __authToken__'
//
// response:
// [
//   {
//     "id": 1,
//     "name": "Shared Link",
//     "link_id": "link_id",
//     "password_required": true/false
//   },
//   ...
// ]
export const sharedLinkListApi = (params = {}) => {

  return baseApi.get(`/shared_link/list`,
    params,
    { headers: { 'authorization': `Bearer ${storage.getAuthToken()}` } })
}


export default {
  sharedLinkListApi
}