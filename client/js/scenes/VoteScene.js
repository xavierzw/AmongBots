const { drawText } = require('../utils/canvas');
const net = require('../network');

class VoteScene {
  constructor(width, height, switchScene, data) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.players = data.players || [];
    this.messages = data.messages || [];
    this.mode = data.mode || 'find-ai';
    this.voted = false;
  }

  init() {
    this.networkHandlers = [
      { event: 'gameResult', handler: (data) => this.switchScene('result', data) },
    ];
    this.networkHandlers.forEach((h) => net.on(h.event, h.handler));
  }

  destroy() {
    this.networkHandlers.forEach((h) => net.off(h.event, h.handler));
  }

  onTouch(e) {
    if (this.voted) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    const startY = 180;
    this.players.forEach((p, i) => {
      const py = startY + i * 70;
      if (x >= 40 && x <= this.width - 40 && y >= py && y <= py + 50) {
        // In battle-royale mode self-vote is allowed
        if (this.mode !== 'battle-royale' && p.id === net.playerId) return;
        this.voted = true;
        net.send('vote', { targetId: p.id });
      }
    });
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    const title = this.mode === 'battle-royale' ? '投票找出人类' : '投票找出 AI';
    drawText(ctx, title, this.width / 2, 80, {
      font: 'bold 24px sans-serif',
      color: '#333',
      align: 'center',
    });

    const subtitle = this.mode === 'battle-royale'
      ? '点击你认为最像人类的玩家'
      : '点击你认为的 AI 玩家';
    drawText(ctx, subtitle, this.width / 2, 120, {
      font: '14px sans-serif',
      color: '#666',
      align: 'center',
    });

    const startY = 180;
    this.players.forEach((p, i) => {
      const py = startY + i * 70;
      const isSelf = p.id === net.playerId;
      const disabled = this.mode !== 'battle-royale' && isSelf;
      ctx.fillStyle = disabled ? '#eee' : '#fff';
      ctx.fillRect(40, py, this.width - 80, 50);
      ctx.strokeStyle = disabled ? '#ddd' : '#ccc';
      ctx.strokeRect(40, py, this.width - 80, 50);
      drawText(ctx, p.name + (isSelf ? ' (自己)' : ''), this.width / 2, py + 18, {
        font: '16px sans-serif',
        color: disabled ? '#bbb' : '#333',
        align: 'center',
      });
    });

    if (this.voted) {
      const waitText = this.mode === 'battle-royale'
        ? '已投票，等待AI思考中...'
        : '已投票，等待其他玩家...';
      drawText(ctx, waitText, this.width / 2, this.height - 60, {
        font: '14px sans-serif',
        color: '#07c160',
        align: 'center',
      });
    }
  }
}

module.exports = VoteScene;
