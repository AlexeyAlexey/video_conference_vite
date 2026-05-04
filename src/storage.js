class Storage {
  saveAuthToken(authToken) {
    localStorage.setItem('authToken', authToken);
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  save(item, data) {
    localStorage.setItem(item, data);
  }

  get(item) {
    return localStorage.getItem(item);
  }
}

export const storage = new Storage()