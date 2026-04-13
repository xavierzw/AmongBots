const { MAX_PLAYERS } = require('../config');
const Game = require('./Game');

const rooms = new Map();

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = []; // { id, name, avatar, socket, isHost }
    this.status = 'waiting'; // waiting | playing | ended
    this.game = null;
  }

  static generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  static getOrCreate(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Room(roomId));
    }
    return rooms.get(roomId);
  }

  static remove(roomId) {
    rooms.delete(roomId);
  }

  static get(roomId) {
    return rooms.get(roomId);
  }

  static getAllRooms() {
    return rooms;
  }

  addPlayer(player) {
    if (this.players.length >= MAX_PLAYERS) return false;
    if (this.status !== 'waiting') return false;
    const existing = this.players.find((p) => p.id === player.id);
    if (existing) {
      existing.socket = player.socket;
      return true;
    }
    player.isHost = this.players.length === 0;
    this.players.push(player);
    return true;
  }

  removePlayer(playerId) {
    const idx = this.players.findIndex((p) => p.id === playerId);
    if (idx >= 0) {
      this.players.splice(idx, 1);
      if (this.players.length > 0 && !this.players.some((p) => p.isHost)) {
        this.players[0].isHost = true;
      }
    }
    if (this.players.length === 0) {
      Room.remove(this.roomId);
    }
  }

  getPlayerBySocket(ws) {
    return this.players.find((p) => p.socket === ws);
  }

  toClientData() {
    return {
      roomId: this.roomId,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
      })),
      status: this.status,
    };
  }

  startGame() {
    if (this.players.length < 2) return false;
    this.status = 'playing';
    this.game = new Game(this);
    this.game.start();
    return true;
  }
}

module.exports = Room;
