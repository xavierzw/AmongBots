const { createButton, drawText } = require('../utils/canvas');
const net = require('../network');

class RoomScene {
  constructor(width, height, switchScene, data) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.data = data || {};
    this.buttons = [];
    this.init();
  }

  init() {
    this.networkHandlers = [
      { event: 'roomUpdate', handler: (data) => { this.data = data; } },
      { event: 'gameStart', handler: (data) => this.switchScene('game', data) },
      { event: 'errorMsg', handler: (data) => wx.showToast({ title: data.msg, icon: 'none' }) },
    ];
    this.networkHandlers.forEach((h) => net.on(h.event, h.handler));
  }

  destroy() {
    this.networkHandlers.forEach((h) => net.off(h.event, h.handler));
  }

  onTouch(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    const cx = this.width / 2;
    const cy = this.height / 2 + 120;
    const isHost = this.data.players && this.data.players.some(
      (p) => p.isHost && net.playerId === p.id
    );

    if (isHost && x >= cx - 100 && x <= cx + 100 && y >= cy && y <= cy + 50) {
      net.send('startGame', {});
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    drawText(ctx, `房间号: ${this.data.roomId || ''}`, this.width / 2, 80, {
      font: 'bold 24px sans-serif',
      color: '#333',
      align: 'center',
    });

    const players = this.data.players || [];
    const startY = 150;
    players.forEach((p, i) => {
      const y = startY + i * 60;
      ctx.fillStyle = '#fff';
      ctx.fillRect(40, y, this.width - 80, 50);
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(40, y, this.width - 80, 50);
      drawText(ctx, `${p.name} ${p.isHost ? '(房主)' : ''}`, this.width / 2, y + 15, {
        font: '16px sans-serif',
        color: '#333',
        align: 'center',
      });
    });

    // Show start button if host
    const me = players.find((p) => net.playerId === p.id);
    if (me && me.isHost) {
      const cx = this.width / 2;
      const cy = this.height / 2 + 120;
      ctx.fillStyle = '#07c160';
      ctx.beginPath();
      ctx.roundRect(cx - 100, cy, 200, 50, 10);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('开始游戏', cx, cy + 25);
    } else {
      drawText(ctx, '等待房主开始游戏...', this.width / 2, this.height / 2 + 140, {
        font: '14px sans-serif',
        color: '#999',
        align: 'center',
      });
    }
  }
}

module.exports = RoomScene;
