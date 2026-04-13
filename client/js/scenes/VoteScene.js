const { drawText } = require('../utils/canvas');
const net = require('../network');

class VoteScene {
  constructor(width, height, switchScene, data) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.players = data.players || [];
    this.messages = data.messages || [];
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
        if (p.id === net.playerId) return; // can't vote self
        this.voted = true;
        net.send('vote', { targetId: p.id });
      }
    });
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    drawText(ctx, '投票找出 AI', this.width / 2, 80, {
      font: 'bold 24px sans-serif',
      color: '#333',
      align: 'center',
    });

    drawText(ctx, '点击你认为的 AI 玩家', this.width / 2, 120, {
      font: '14px sans-serif',
      color: '#666',
      align: 'center',
    });

    const startY = 180;
    this.players.forEach((p, i) => {
      const py = startY + i * 70;
      const isSelf = p.id === net.playerId;
      ctx.fillStyle = isSelf ? '#ddd' : '#fff';
      ctx.fillRect(40, py, this.width - 80, 50);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(40, py, this.width - 80, 50);
      drawText(ctx, p.name + (isSelf ? ' (自己)' : ''), this.width / 2, py + 18, {
        font: '16px sans-serif',
        color: isSelf ? '#999' : '#333',
        align: 'center',
      });
    });

    if (this.voted) {
      drawText(ctx, '已投票，等待其他玩家...', this.width / 2, this.height - 60, {
        font: '14px sans-serif',
        color: '#07c160',
        align: 'center',
      });
    }
  }
}

module.exports = VoteScene;
