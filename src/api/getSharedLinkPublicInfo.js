import baseApi from './baseApi'

// Getting shared link public info
// endpoint: /conference/public/shared_link/info/:link_id
// method: get
// params: link_id - required (in path)
// response {
//   "password_required": boolean,
//   "link_id": string
// }

export const getSharedLinkPublicInfo = (params) => {
  return baseApi.get(`/conference/public/shared_link/info/${params.link_id}`)
}


export default {
  getSharedLinkPublicInfo
}
