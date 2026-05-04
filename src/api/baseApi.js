const apiServerProtocol = import.meta.env.VITE_MANAGER_HTTP_SERVER_PROTOCOL
const apiServerHost = import.meta.env.VITE_MANAGER_SERVER_HOST
const apiServerPort = import.meta.env.VITE_MANAGER_HTTP_SERVER_PORT
const apiServer = `${apiServerProtocol}://${apiServerHost}:${apiServerPort}`


const baseFetch = (path, config = {}, params) => {
  return new Promise((resolve, reject) => {
    try {
      const _config = {
        ...config
      }
      if (params) {
        _config['body'] = JSON.stringify(params)
      }

      console.log({
        ..._config,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      window.fetch(`${apiServer}${path}`, {
        ..._config,
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response => response.json())
        .then(resolve, reject)
    } catch (e) {
      reject(e)
    }
  })
}

const fetchGet = (url, params = {}, config = {}) => {
  return baseFetch(url, params, config)
}

const fetchPost = (url, params = {}, config = {}) => {
  return baseFetch(url, {
    ...config,
    method: 'POST'
  }, params)
}

const fetchPut = (url, params = {}, config = {}) => {
  return baseFetch(url, {
    ...config,
    method: 'PUT'
  }, params)
}
const fetchPatch = (url, params = {}, config = {}) => {
  return baseFetch(url, {
    ...config,
    method: 'PATCH'
  }, params)
}

const fetchDelete = (url, params = {}, config = {}) => {
  return baseFetch(url, {
    ...config,
    method: 'DELETE'
  }, params)
}

export default {
  get: fetchGet,
  post: fetchPost,
  put: fetchPut,
  patch: fetchPatch,
  delete: fetchDelete,
}