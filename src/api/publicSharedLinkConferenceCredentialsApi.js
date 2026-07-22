import baseApi from './baseApi'

export const publicSharedLinkConferenceCredentialsApi = (params) => {
  return baseApi.post(`/conference/public/shared_link/conference_credentials/${params.link_id}`,
    params)
}


export default {
  publicSharedLinkConferenceCredentialsApi
}