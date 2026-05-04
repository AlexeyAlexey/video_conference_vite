import baseApi from './baseApi'

export const registerPhoneApi = (params) => {
  return baseApi.post(`/phones/register`, params)
}


export default {
  registerPhoneApi
}