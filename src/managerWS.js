import { Socket } from "phoenix"

const managerServerProtocol = import.meta.env.VITE_MANAGER_WEBSOCKET_SERVER_PROTOCOL
const managerServerHost = import.meta.env.VITE_MANAGER_SERVER_HOST
const managerServerPort = import.meta.env.VITE_MANAGER_SERVER_PORT

class ManagerWS {
  constructor(managerServerProtocol, managerServerHost, managerServerPort) {
    this.managerServerProtocol = managerServerProtocol;
    this.managerServerHost = managerServerHost;
    this.managerServerPort = managerServerPort;
    this.managerServerUri = `${this.managerServerProtocol}://${this.managerServerHost}:${this.managerServerPort}/socket/phone`;
    this.socket = null;

  }

  connect(authToken) {
    if (this.socket) return this.socket;

    this.socket = new Socket(this.managerServerUri, { authToken: authToken });
    this.socket.connect();

  }

  channel(topic, params = {}) {
    return this.socket.channel(topic, params)
  }
}

export const managerWS = new ManagerWS(managerServerProtocol,
  managerServerHost, managerServerPort);
