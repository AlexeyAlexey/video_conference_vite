import baseApi from './baseApi'

// Getting shared link conference credentials
// endpoint: /conference/public/shared_link/conference_credentials/:link_id
// method: post
// params: password - optional, link_id - required
// response {
//   "switchboard_video_uri": string,
//   "switchboard_video_server_cert_hash": string,
//   "switchboard_audio_uri": string,
//   "switchboard_audio_server_cert_hash": string
// }

export const publicSharedLinkConferenceCredentialsApi = (params) => {
  return baseApi.post(`/conference/public/shared_link/conference_credentials/${params.link_id}`,
    params)
}


export default {
  publicSharedLinkConferenceCredentialsApi
}