const Game = require('./Game');
const { MODE_CONFIG, MODES } = require('../config');
const { getRandomTopic } = require('./topics');
const { generateAIResponse } = require('../ai/llm');

const cfg = MODE_CONFIG[MODES.FIND_AI];

class FindAIGame extends Game {
  constructor(room) {
    super(room);
    this.aiPlayerId = null;
    this.aiPlayerName = '';
    this.votes = new Map();
  }

  start() {
    // Assign AI randomly
    const aiIndex = Math.floor(Math.random() * this.room.players.length);
    const aiPlayer = this.room.players[aiIndex];
    this.aiPlayerId = aiPlayer.id;
    this.aiPlayerName = aiPlayer.name;
    this.aiPlayerIds.add(aiPlayer.id);

    this.topic = getRandomTopic();
    this.round = 1;
    this.status = 'speaking';
    this.speakOrder = [...this.room.players].sort(() => Math.random() - 0.5);
    this.currentTurnIndex = 0;
    this.messages = [];
    this.votes = new Map();

    this.room.players.forEach((p) => {
      p.socket.sendJSON('gameStart', {
        mode: MODES.FIND_AI,
        role: p.id === this.aiPlayerId ? 'ai' : 'human',
        topic: this.topic,
        maxRounds: cfg.TOTAL_ROUNDS,
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

      if (this.round >= cfg.TOTAL_ROUNDS) {
        setTimeout(() => this.startVoting(), 1500);
      } else {
        this.round++;
        this.currentTurnIndex = 0;
        setTimeout(() => this.nextTurn(), 1500);
      }
      return;
    }

    const player = this.speakOrder[this.currentTurnIndex];
    const deadline = Date.now() + cfg.SPEAK_TIMEOUT_MS;

    this.broadcast('turnStart', {
      playerId: player.id,
      round: this.round,
      deadline,
    });

    if (player.id === this.aiPlayerId) {
      this.timer = setTimeout(async () => {
        const history = this.messages.map((m) => ({
          role: m.senderId === this.aiPlayerId ? 'assistant' : 'user',
          content: `${m.senderName}: ${m.content}`,
        }));
        const content = await generateAIResponse(this.topic, history, this.aiPlayerName, {
          mode: MODES.FIND_AI,
        });
        this.handleSpeak(this.aiPlayerId, content);
      }, 2000 + Math.random() * 2000);
    } else {
      this.timer = setTimeout(() => {
        this.handleSpeak(player.id, '（玩家超时未发言）');
      }, cfg.SPEAK_TIMEOUT_MS);
    }
  }

  startVoting() {
    this.status = 'voting';
    this.broadcast('votingStart', {
      mode: MODES.FIND_AI,
      players: this.room.players.map((rp) => ({
        id: rp.id,
        name: rp.name,
        avatar: rp.avatar,
      })),
    });

    this.timer = setTimeout(() => this.computeResult(), 30000);
  }

  handleVote(voterId, targetId) {
    if (this.status !== 'voting') return false;
    this.votes.set(voterId, targetId);

    if (this.votes.size >= this.room.players.length) {
      this.clearTimer();
      this.computeResult();
    }
    return true;
  }

  computeResult() {
    if (this.status === 'ended') return;
    this.status = 'ended';

    const voteCounts = new Map();
    this.votes.forEach((targetId) => {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });

    const correctVotes = voteCounts.get(this.aiPlayerId) || 0;
    const totalHumanPlayers = this.room.players.filter((p) => p.id !== this.aiPlayerId).length;
    const humansWin = correctVotes >= Math.ceil(totalHumanPlayers / 2);

    const result = {
      mode: MODES.FIND_AI,
      aiPlayerId: this.aiPlayerId,
      aiPlayerName: this.aiPlayerName,
      votes: Array.from(this.votes.entries()).map(([voterId, targetId]) => {
        const voter = this.room.players.find((p) => p.id === voterId);
        const target = this.room.players.find((p) => p.id === targetId);
        return {
          voterId,
          voterName: voter ? voter.name : '未知',
          targetId,
          targetName: target ? target.name : '未知',
        };
      }),
      voteCounts: Array.from(voteCounts.entries()).map(([targetId, count]) => {
        const target = this.room.players.find((p) => p.id === targetId);
        return {
          targetId,
          targetName: target ? target.name : '未知',
          count,
        };
      }),
      humansWin,
      messages: this.messages,
    };

    this.broadcast('gameResult', result);
    this.room.status = 'ended';
  }
}

module.exports = FindAIGame;
