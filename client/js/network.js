// 调试时请修改为服务端的局域网 IP，例如 ws://192.168.1.5:3000
const SERVER_URL = 'ws://localhost:3000';

class Network {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.playerId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = wx.connectSocket({
        url: SERVER_URL,
      });

      this.socket.onOpen(() => {
        console.log('WebSocket connected');
        this.connected = true;
        resolve();
      });

      this.socket.onClose(() => {
        console.log('WebSocket closed');
        this.connected = false;
      });

      this.socket.onError((err) => {
        console.error('WebSocket error', err);
        reject(err);
      });

      this.socket.onMessage((res) => {
        try {
          const { type, payload } = JSON.parse(res.data);
          this.emit(type, payload);
        } catch (e) {
          console.error('Invalid message', res.data);
        }
      });
    });
  }

  send(type, payload) {
    if (this.connected && this.socket) {
      this.socket.send({
        data: JSON.stringify({ type, payload }),
      });
    }
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const arr = this.listeners.get(event);
    const idx = arr.indexOf(handler);
    if (idx >= 0) arr.splice(idx, 1);
  }

  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((h) => h(payload));
  }
}

const net = new Network();
module.exports = net;
