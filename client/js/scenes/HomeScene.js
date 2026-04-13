const { createButton, drawText } = require('../utils/canvas');
const net = require('../network');

class HomeScene {
  constructor(width, height, switchScene) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.buttons = [];
    this.roomIdInput = '';
    this.stage = 'modeSelect'; // modeSelect | classic | difficultySelect
    this.init();
  }

  init() {
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.networkHandlers = [
      { event: 'roomUpdate', handler: (data) => this.switchScene('room', data) },
      { event: 'gameStart', handler: (data) => this.switchScene('game', data) },
      { event: 'errorMsg', handler: (data) => wx.showToast({ title: data.msg, icon: 'none' }) },
    ];
    this.networkHandlers.forEach((h) => net.on(h.event, h.handler));

    // Mode selection buttons
    this.modeButtons = [
      {
        text: '经典模式', x: cx - 100, y: cy - 40, width: 200, height: 50, color: '#07c160',
        onClick: () => { this.stage = 'classic'; },
      },
      {
        text: '人类大逃杀', x: cx - 100, y: cy + 40, width: 200, height: 50, color: '#e64340',
        onClick: () => { this.stage = 'difficultySelect'; },
      },
    ];

    // Classic mode buttons
    this.classicButtons = [
      {
        text: '快速匹配', x: cx - 100, y: cy - 60, width: 200, height: 50, color: '#07c160',
        onClick: () => {
          const id = `user_${Date.now()}`;
          const name = `玩家${Math.floor(Math.random() * 1000)}`;
          net.playerId = id;
          net.send('match', { id, name });
        },
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
      },
      {
        text: '返回', x: cx - 100, y: cy + 100, width: 200, height: 40, color: '#999',
        onClick: () => { this.stage = 'modeSelect'; },
      },
    ];

    // Difficulty selection buttons
    this.difficultyButtons = [
      {
        text: '简单 (3 AI)', x: cx - 100, y: cy - 60, width: 200, height: 50, color: '#07c160',
        onClick: () => this.startBattleRoyale('easy'),
      },
      {
        text: '普通 (5 AI)', x: cx - 100, y: cy + 10, width: 200, height: 50, color: '#fa9d3b',
        onClick: () => this.startBattleRoyale('normal'),
      },
      {
        text: '困难 (7 AI)', x: cx - 100, y: cy + 80, width: 200, height: 50, color: '#e64340',
        onClick: () => this.startBattleRoyale('hard'),
      },
      {
        text: '返回', x: cx - 100, y: cy + 150, width: 200, height: 40, color: '#999',
        onClick: () => { this.stage = 'modeSelect'; },
      },
    ];
  }

  startBattleRoyale(difficulty) {
    const id = `user_${Date.now()}`;
    const name = `玩家${Math.floor(Math.random() * 1000)}`;
    net.playerId = id;
    net.send('startSoloBattleRoyale', { id, name, difficulty });
  }

  destroy() {
    this.networkHandlers.forEach((h) => net.off(h.event, h.handler));
  }

  onTouch(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    const hit = (btn) =>
      x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height;

    if (this.stage === 'modeSelect') {
      this.modeButtons.forEach((btn) => { if (hit(btn) && btn.onClick) btn.onClick(); });
    } else if (this.stage === 'classic') {
      this.classicButtons.forEach((btn) => { if (hit(btn) && btn.onClick) btn.onClick(); });
      const inputY = this.height / 2 + 90;
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= inputY - 5 && y <= inputY + 25) {
        wx.showKeyboard({ defaultValue: this.roomIdInput, maxLength: 10, confirmHold: true });
      }
    } else if (this.stage === 'difficultySelect') {
      this.difficultyButtons.forEach((btn) => { if (hit(btn) && btn.onClick) btn.onClick(); });
    }
  }

  onKeyboardConfirm(value) {
    if (this.stage === 'classic') {
      this.roomIdInput = value;
      wx.hideKeyboard();
    }
  }

  onKeyboardInput(text) {
    if (this.stage === 'classic') {
      this.roomIdInput = text;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    drawText(ctx, '谁是 AI', this.width / 2, 120, {
      font: 'bold 32px sans-serif',
      color: '#333',
      align: 'center',
    });

    if (this.stage === 'modeSelect') {
      drawText(ctx, '选择游戏模式', this.width / 2, 180, {
        font: '14px sans-serif',
        color: '#666',
        align: 'center',
      });
      this.modeButtons.forEach((btn) =>
        createButton(ctx, btn.text, btn.x, btn.y, btn.width, btn.height, btn.color, '#fff', btn.onClick)
      );
    } else if (this.stage === 'classic') {
      drawText(ctx, '每局 4 人（3 真人 + 1 AI）\n对话 5 轮后投票找出 AI', this.width / 2, 180, {
        font: '14px sans-serif',
        color: '#666',
        align: 'center',
      });
      this.classicButtons.forEach((btn) =>
        createButton(ctx, btn.text, btn.x, btn.y, btn.width, btn.height, btn.color, '#fff', btn.onClick)
      );

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
    } else if (this.stage === 'difficultySelect') {
      drawText(ctx, '每轮投票淘汰最像人类的人\n撑过指定轮数即可获胜', this.width / 2, 180, {
        font: '14px sans-serif',
        color: '#666',
        align: 'center',
      });
      this.difficultyButtons.forEach((btn) =>
        createButton(ctx, btn.text, btn.x, btn.y, btn.width, btn.height, btn.color, '#fff', btn.onClick)
      );
    }
  }
}

module.exports = HomeScene;
