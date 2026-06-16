const apiServerProtocol = import.meta.env.VITE_MANAGER_HTTP_SERVER_PROTOCOL
const apiServerHost = import.meta.env.VITE_MANAGER_SERVER_HOST
const apiServerPort = import.meta.env.VITE_MANAGER_HTTP_SERVER_PORT
const apiServer = `${apiServerProtocol}://${apiServerHost}:${apiServerPort}`
const headers = { 'Content-Type': 'application/json' }

const baseFetch = (path, params, config = {}) => {
  return new Promise((resolve, reject) => {
    var url = `${apiServer}${path}`;
    const _headers = { ...config.headers, ...headers };

    try {
      const _config = {
        ...config
      }

      if (params && config.method == 'GET') {
        url = `${url}?${new URLSearchParams(params)}`
      }
      else {
        _config['body'] = JSON.stringify(params)
      }

      window.fetch(url, {
        ..._config,
        headers: _headers
      }).then(response => response.json())
        .then(resolve, reject)
    } catch (e) {
      reject(e)
    }
  })
}

const fetchGet = (url, params = {}, config = {}) => {
  return baseFetch(url,
    params,
    {
      ...config,
      method: 'GET'
    },)
}

const fetchPost = (url, params = {}, config = {}) => {
  return baseFetch(url,
    params,
    {
      ...config,
      method: 'POST'
    })
}

const fetchPut = (url, params = {}, config = {}) => {
  return baseFetch(url,
    params,
    {
      ...config,
      method: 'PUT'
    },)
}
const fetchPatch = (url, params = {}, config = {}) => {
  return baseFetch(url,
    params,
    {
      ...config,
      method: 'PATCH'
    },
  )
}

const fetchDelete = (url, params = {}, config = {}) => {
  return baseFetch(url,
    params,
    {
      ...config,
      method: 'DELETE'
    },
  )
}

export default {
  get: fetchGet,
  post: fetchPost,
  put: fetchPut,
  patch: fetchPatch,
  delete: fetchDelete,
}