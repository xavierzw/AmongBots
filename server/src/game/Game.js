class Game {
  constructor(room) {
    this.room = room;
    this.status = 'idle'; // idle -> speaking -> voting -> ended
    this.round = 0;
    this.topic = '';
    this.messages = []; // { senderId, senderName, content, isAI, round }
    this.speakOrder = [];
    this.currentTurnIndex = 0;
    this.aiPlayerIds = new Set();
    this.timer = null;
  }

  broadcast(type, payload) {
    this.room.players.forEach((p) => {
      if (p.socket && p.socket.readyState === 1) {
        p.socket.sendJSON(type, payload);
      }
    });
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  handleSpeak(playerId, content) {
    if (this.status !== 'speaking') return false;
    const player = this.speakOrder[this.currentTurnIndex];
    if (!player || player.id !== playerId) return false;

    this.clearTimer();

    const msg = {
      senderId: player.id,
      senderName: player.name,
      content: String(content).trim() || '（无言）',
      isAI: this.aiPlayerIds.has(player.id),
      round: this.round,
    };
    this.messages.push(msg);
    this.broadcast('newMessage', msg);

    this.currentTurnIndex++;
    setTimeout(() => this.nextTurn(), 1000);
    return true;
  }

  // Abstract methods - subclasses must implement
  start() {
    throw new Error('start() must be implemented by subclass');
  }

  nextTurn() {
    throw new Error('nextTurn() must be implemented by subclass');
  }

  startVoting() {
    throw new Error('startVoting() must be implemented by subclass');
  }

  handleVote(voterId, targetId) {
    throw new Error('handleVote() must be implemented by subclass');
  }

  computeResult() {
    throw new Error('computeResult() must be implemented by subclass');
  }
}

module.exports = Game;
