const { createButton, drawText } = require('../utils/canvas');
const net = require('../network');

class HomeScene {
  constructor(width, height, switchScene) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.buttons = [];
    this.roomIdInput = '';
    this.init();
  }

  init() {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.buttons = [
      {
        text: '快速匹配', x: cx - 100, y: cy - 60, width: 200, height: 50, color: '#07c160',
        onClick: () => {
          const id = `user_${Date.now()}`;
          const name = `玩家${Math.floor(Math.random() * 1000)}`;
          net.playerId = id;
          net.send('match', { id, name });
        },
        contains(tx, ty) {
          return tx >= this.x && tx <= this.x + this.width && ty >= this.y && ty <= this.y + this.height;
        }
      },
      {
        text: '加入房间', x: cx - 100, y: cy + 20, width: 200, height: 50, color: '#576b95',
        onClick: () => {
          if (!this.roomIdInput.trim()) {
            wx.showToast({ title: '请输入房间号', icon: 'none' });
            return;
          }
          const id = `user_${Date.now()}`;
          const name = `玩家${Math.floor(Math.random() * 1000)}`;
          net.playerId = id;
          net.send('joinRoom', { roomId: this.roomIdInput.trim().toUpperCase(), id, name });
        },
        contains(tx, ty) {
          return tx >= this.x && tx <= this.x + this.width && ty >= this.y && ty <= this.y + this.height;
        }
      },
    ];

    this.networkHandlers = [
      { event: 'roomUpdate', handler: (data) => this.switchScene('room', data) },
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
    this.buttons.forEach((btn) => {
      if (btn.contains(x, y) && btn.onClick) btn.onClick();
    });
    const inputY = this.height / 2 + 90;
    if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= inputY - 5 && y <= inputY + 25) {
      wx.showKeyboard({ defaultValue: this.roomIdInput, maxLength: 10, confirmHold: true });
    }
  }

  onKeyboardConfirm(value) {
    this.roomIdInput = value;
    wx.hideKeyboard();
  }

  onKeyboardInput(text) {
    this.roomIdInput = text;
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    drawText(ctx, '谁是 AI', this.width / 2, 120, {
      font: 'bold 32px sans-serif',
      color: '#333',
      align: 'center',
    });

    drawText(ctx, '每局 4 人（3 真人 + 1 AI）\n对话 5 轮后投票找出 AI', this.width / 2, 180, {
      font: '14px sans-serif',
      color: '#666',
      align: 'center',
    });

    this.buttons.forEach((btn) => {
      createButton(ctx, btn.text, btn.x, btn.y, btn.width, btn.height, btn.color, '#fff', btn.onClick);
    });

    // Input hint
    const inputY = this.height / 2 + 90;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.width / 2 - 100, inputY - 5, 200, 30);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(this.width / 2 - 100, inputY - 5, 200, 30);
    drawText(ctx, '房间号: ' + (this.roomIdInput || '点击输入'), this.width / 2, inputY + 2, {
      font: '14px sans-serif',
      color: this.roomIdInput ? '#333' : '#999',
      align: 'center',
    });
  }
}

module.exports = HomeScene;
