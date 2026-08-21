class Storage {
  saveAuthToken(authToken) {
    localStorage.setItem('authToken', authToken);
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  removeAuthToken() {
    localStorage.removeItem('authToken');
  }

  saveRefreshToken(refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  removeRefreshToken() {
    localStorage.removeItem('refreshToken');
  }

  save(item, data) {
    localStorage.setItem(item, data);
  }

  get(item) {
    return localStorage.getItem(item);
  }
}

export const storage = new Storage()