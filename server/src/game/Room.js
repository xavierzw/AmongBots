const { MODE_CONFIG, MODES, BATTLE_ROYALE_DIFFICULTY } = require('../config');
const { createGame } = require('./index');

const rooms = new Map();

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = []; // { id, name, avatar, socket, isHost, isAI }
    this.status = 'waiting'; // waiting | playing | ended
    this.game = null;
    this.mode = MODES.FIND_AI;
    this.difficulty = null; // for battle-royale
    this.isPrivate = false;
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

  setMode(mode, difficulty = null) {
    if (this.status !== 'waiting') return false;
    this.mode = mode;
    if (mode === MODES.BATTLE_ROYALE && difficulty) {
      this.difficulty = difficulty;
    }
    return true;
  }

  getMaxPlayers() {
    if (this.mode === MODES.BATTLE_ROYALE && this.difficulty) {
      return 1 + (BATTLE_ROYALE_DIFFICULTY[this.difficulty]?.aiCount || 3);
    }
    return MODE_CONFIG[this.mode]?.MAX_PLAYERS || MODE_CONFIG[MODES.FIND_AI].MAX_PLAYERS;
  }

  getMinPlayers() {
    if (this.mode === MODES.BATTLE_ROYALE) return 1;
    return MODE_CONFIG[this.mode]?.MIN_PLAYERS || MODE_CONFIG[MODES.FIND_AI].MIN_PLAYERS;
  }

  addPlayer(player) {
    const max = this.getMaxPlayers();
    if (this.players.length >= max) return false;
    if (this.status !== 'waiting') return false;
    const existing = this.players.find((p) => p.id === player.id);
    if (existing) {
      existing.socket = player.socket;
      return true;
    }
    player.isHost = this.players.length === 0;
    if (!player.isAI) player.isAI = false;
    this.players.push(player);
    return true;
  }

  fillAIPlayers() {
    if (this.mode !== MODES.BATTLE_ROYALE || !this.difficulty) return;
    const cfg = BATTLE_ROYALE_DIFFICULTY[this.difficulty];
    const needed = cfg.aiCount;
    const currentAiCount = this.players.filter((p) => p.isAI).length;
    for (let i = currentAiCount; i < needed; i++) {
      this.players.push({
        id: `ai_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
        name: `AI玩家${i + 1}`,
        avatar: '',
        socket: null,
        isHost: false,
        isAI: true,
      });
    }
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
        isAI: p.isAI,
      })),
      status: this.status,
      mode: this.mode,
      difficulty: this.difficulty,
    };
  }

  startGame() {
    if (this.mode === MODES.BATTLE_ROYALE) {
      this.fillAIPlayers();
    }
    if (this.players.length < this.getMinPlayers()) return false;
    this.status = 'playing';
    this.game = createGame(this, this.mode, { difficulty: this.difficulty });
    this.game.start();
    return true;
  }
}

module.exports = Room;
