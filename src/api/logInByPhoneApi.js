import baseApi from './baseApi'

export const logInByPhoneApi = (params) => {
  return baseApi.post(`/phones/log-in`, params)
}


export default {
  logInByPhoneApi
}