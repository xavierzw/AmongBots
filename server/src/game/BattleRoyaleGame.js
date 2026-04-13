const Game = require('./Game');
const { BATTLE_ROYALE_DIFFICULTY, MODES } = require('../config');
const { getRandomTopic } = require('./topics');
const { generateAIResponse, generateAIVote } = require('../ai/llm');

class BattleRoyaleGame extends Game {
  constructor(room, difficulty = 'easy') {
    super(room);
    this.difficulty = difficulty;
    this.cfg = BATTLE_ROYALE_DIFFICULTY[difficulty] || BATTLE_ROYALE_DIFFICULTY.easy;
    this.alivePlayers = [];
    this.eliminatedPlayerIds = new Set();
    this.humanPlayerId = null;
    this.votes = new Map();
    this.eliminationHistory = [];
  }

  start() {
    this.topic = getRandomTopic();
    this.round = 1;
    this.status = 'speaking';
    this.messages = [];
    this.votes = new Map();
    this.eliminationHistory = [];

    // First player is the human, rest are AI
    this.humanPlayerId = this.room.players[0].id;
    this.room.players.forEach((p, idx) => {
      if (idx > 0) this.aiPlayerIds.add(p.id);
    });

    this.alivePlayers = [...this.room.players];
    this.eliminatedPlayerIds.clear();
    this.speakOrder = [...this.alivePlayers].sort(() => Math.random() - 0.5);
    this.currentTurnIndex = 0;

    this.room.players.forEach((p) => {
      if (!p.socket) return;
      const isAi = this.aiPlayerIds.has(p.id);
      p.socket.sendJSON('gameStart', {
        mode: MODES.BATTLE_ROYALE,
        role: isAi ? 'ai' : 'human',
        topic: this.topic,
        maxRounds: this.cfg.totalRounds,
        difficulty: this.difficulty,
        players: this.room.players.map((rp) => ({
          id: rp.id,
          name: rp.name,
          avatar: rp.avatar,
        })),
      });
    });

    setTimeout(() => this.nextTurn(), 1500);
  }

  nextTurn() {
    if (this.status !== 'speaking') return;

    if (this.currentTurnIndex >= this.speakOrder.length) {
      this.broadcast('roundEnd', { round: this.round });
      setTimeout(() => this.startVoting(), 1500);
      return;
    }

    const player = this.speakOrder[this.currentTurnIndex];
    const deadline = Date.now() + 30000;

    this.broadcast('turnStart', {
      playerId: player.id,
      round: this.round,
      deadline,
    });

    if (this.aiPlayerIds.has(player.id)) {
      this.timer = setTimeout(async () => {
        const history = this.messages.map((m) => ({
          role: m.senderId === player.id ? 'assistant' : 'user',
          content: `${m.senderName}: ${m.content}`,
        }));
        const content = await generateAIResponse(this.topic, history, player.name, {
          mode: MODES.BATTLE_ROYALE,
        });
        this.handleSpeak(player.id, content);
      }, 2000 + Math.random() * 2000);
    } else {
      this.timer = setTimeout(() => {
        this.handleSpeak(player.id, '（玩家超时未发言）');
      }, 30000);
    }
  }

  startVoting() {
    if (this.status === 'ended') return;
    this.status = 'voting';
    this.votes = new Map();

    this.broadcast('votingStart', {
      mode: MODES.BATTLE_ROYALE,
      round: this.round,
      players: this.alivePlayers.map((rp) => ({
        id: rp.id,
        name: rp.name,
        avatar: rp.avatar,
      })),
    });

    // AI players vote asynchronously
    this.alivePlayers.forEach((p) => {
      if (this.aiPlayerIds.has(p.id)) {
        this.castAIVote(p);
      }
    });

    this.timer = setTimeout(() => this.computeElimination(), 30000);
  }

  async castAIVote(aiPlayer) {
    try {
      const history = this.messages.map((m) => ({
        role: m.senderId === aiPlayer.id ? 'assistant' : 'user',
        content: `${m.senderName}: ${m.content}`,
      }));
      const aliveNames = this.alivePlayers.map((p) => p.name);
      const targetName = await generateAIVote(this.topic, history, aiPlayer.name, aliveNames);
      const target = this.alivePlayers.find((p) => p.name === targetName) || this.alivePlayers[0];
      this.handleVote(aiPlayer.id, target.id);
    } catch (err) {
      console.error('AI vote failed', err);
      // fallback: vote for first alive human or random alive player
      const fallback = this.alivePlayers.find((p) => p.id === this.humanPlayerId) || this.alivePlayers[0];
      if (fallback) this.handleVote(aiPlayer.id, fallback.id);
    }
  }

  handleVote(voterId, targetId) {
    if (this.status !== 'voting') return false;
    const voterAlive = this.alivePlayers.some((p) => p.id === voterId);
    if (!voterAlive) return false;
    this.votes.set(voterId, targetId);

    if (this.votes.size >= this.alivePlayers.length) {
      this.clearTimer();
      this.computeElimination();
    }
    return true;
  }

  computeElimination() {
    if (this.status === 'ended') return;

    // Tally votes among alive players
    const voteCounts = new Map();
    this.votes.forEach((targetId) => {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });

    let maxVotes = -1;
    voteCounts.forEach((count) => {
      if (count > maxVotes) maxVotes = count;
    });

    const eliminated = [];
    if (maxVotes > 0) {
      voteCounts.forEach((count, targetId) => {
        if (count === maxVotes) {
          const player = this.room.players.find((p) => p.id === targetId);
          if (player) eliminated.push(player);
        }
      });
    } else {
      // No votes at all - eliminate nobody (edge case)
    }

    // Apply eliminations
    eliminated.forEach((player) => {
      this.eliminatedPlayerIds.add(player.id);
      const idx = this.alivePlayers.findIndex((p) => p.id === player.id);
      if (idx >= 0) this.alivePlayers.splice(idx, 1);
    });

    const eliminationEvent = {
      round: this.round,
      eliminated: eliminated.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        wasHuman: p.id === this.humanPlayerId,
      })),
      voteCounts: Array.from(voteCounts.entries()).map(([targetId, count]) => {
        const target = this.room.players.find((p) => p.id === targetId);
        return {
          targetId,
          targetName: target ? target.name : '未知',
          count,
        };
      }),
    };
    this.eliminationHistory.push(eliminationEvent);
    this.broadcast('playerEliminated', eliminationEvent);

    // Check win conditions
    const humanAlive = this.alivePlayers.some((p) => p.id === this.humanPlayerId);
    const aiAlive = this.alivePlayers.some((p) => this.aiPlayerIds.has(p.id));

    if (!humanAlive) {
      setTimeout(() => this.endGame('ais'), 2000);
      return;
    }
    if (!aiAlive || this.round >= this.cfg.totalRounds) {
      setTimeout(() => this.endGame('humans'), 2000);
      return;
    }

    // Continue to next round
    this.round++;
    this.currentTurnIndex = 0;
    this.speakOrder = [...this.alivePlayers].sort(() => Math.random() - 0.5);
    this.status = 'speaking';
    setTimeout(() => this.nextTurn(), 2000);
  }

  endGame(winner) {
    if (this.status === 'ended') return;
    this.status = 'ended';

    const result = {
      mode: MODES.BATTLE_ROYALE,
      winner,
      difficulty: this.difficulty,
      eliminationHistory: this.eliminationHistory,
      survivors: this.alivePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        isHuman: p.id === this.humanPlayerId,
      })),
      messages: this.messages,
    };

    this.broadcast('gameResult', result);
    this.room.status = 'ended';
  }

  computeResult() {
    // Alias for compatibility if called externally
    this.computeElimination();
  }
}

module.exports = BattleRoyaleGame;
