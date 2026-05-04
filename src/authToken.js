export class AuthToken {
  constructor(authToken) {
    this.authToken = authToken;

    var [header, body, signature] = authToken.split(".")

    this.header = JSON.parse(atob(header));
    this.body = JSON.parse(atob(body));
    this.signature = signature;

    this.expired = new Date(this.body.exp * 1000);
  }

  isExpired() {
    return this.expired <= Date.now();
  }

  // refresh() { }

};