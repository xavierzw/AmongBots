const { createButton, drawText, drawBubble } = require('../utils/canvas');
const net = require('../network');

class GameScene {
  constructor(width, height, switchScene, data) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.data = data || {};
    this.topic = data.topic || '';
    this.role = data.role || 'human';
    this.players = data.players || [];
    this.messages = [];
    this.currentPlayerId = null;
    this.round = 1;
    this.deadline = 0;
    this.inputText = '';
    this.init();
  }

  init() {
    this.networkHandlers = [
      { event: 'newMessage', handler: (msg) => this.messages.push(msg) },
      { event: 'turnStart', handler: (data) => {
        this.currentPlayerId = data.playerId;
        this.round = data.round;
        this.deadline = data.deadline;
      }},
      { event: 'roundEnd', handler: () => {
        this.currentPlayerId = null;
      }},
      { event: 'votingStart', handler: () => this.switchScene('vote', { players: this.players, messages: this.messages }) },
      { event: 'gameResult', handler: (data) => this.switchScene('result', data) },
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

    const isMyTurn = this.currentPlayerId === net.playerId;
    const btnY = this.height - 110;
    const inputY = this.height - 100;
    const cx = this.width / 2;

    if (isMyTurn && x >= 10 && x <= this.width - 10 && y >= inputY && y <= inputY + 40) {
      wx.showKeyboard({ defaultValue: this.inputText, maxLength: 100, confirmHold: true });
    }

    if (isMyTurn && x >= cx - 80 && x <= cx + 80 && y >= btnY && y <= btnY + 40) {
      this.sendMessage();
    }
  }

  sendMessage() {
    if (!this.inputText.trim()) return;
    net.send('speak', { content: this.inputText.trim() });
    this.inputText = '';
    wx.hideKeyboard();
  }

  onKeyboardConfirm(value) {
    this.inputText = value;
    this.sendMessage();
  }

  onKeyboardInput(text) {
    this.inputText = text;
  }

  draw(ctx) {
    ctx.fillStyle = '#ededed';
    ctx.fillRect(0, 0, this.width, this.height);

    // Header
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.width, 60);
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(this.width, 60);
    ctx.stroke();

    drawText(ctx, `第 ${this.round}/5 轮`, this.width / 2, 20, {
      font: 'bold 16px sans-serif',
      color: '#333',
      align: 'center',
    });

    drawText(ctx, `话题: ${this.topic}`, this.width / 2, 40, {
      font: '12px sans-serif',
      color: '#666',
      align: 'center',
    });

    // Messages
    const msgAreaY = 70;
    const msgAreaH = this.height - 180;
    let y = msgAreaY + 10;

    this.messages.forEach((msg) => {
      const isSelf = msg.senderId === net.playerId;
      const name = msg.senderName;
      const maxW = this.width * 0.7;
      const bubbleW = maxW;
      const bubbleX = isSelf ? this.width - bubbleW - 20 : 20;

      drawText(ctx, name, isSelf ? this.width - 20 : 20, y, {
        font: '12px sans-serif',
        color: '#999',
        align: isSelf ? 'right' : 'left',
      });
      y += 18;
      const h = drawBubble(ctx, msg.content, bubbleX, y, bubbleW, isSelf);
      y += h + 15;
    });

    // Input area
    const isMyTurn = this.currentPlayerId === net.playerId;
    const inputY = this.height - 110;
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, inputY, this.width - 20, 40);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(10, inputY, this.width - 20, 40);

    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const displayText = this.inputText || (isMyTurn ? '点击输入文字...' : '等待他人发言...');
    ctx.fillText(displayText, 20, inputY + 20);

    // Send button
    const btnY = inputY + 50;
    const cx = this.width / 2;
    ctx.fillStyle = isMyTurn ? '#07c160' : '#ccc';
    ctx.beginPath();
    ctx.roundRect(cx - 80, btnY, 160, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isMyTurn ? '发送' : '等待中', cx, btnY + 20);

    // Countdown
    if (this.deadline > 0 && isMyTurn) {
      const remaining = Math.max(0, Math.ceil((this.deadline - Date.now()) / 1000));
      drawText(ctx, `${remaining}s`, this.width - 20, inputY + 20, {
        font: '14px sans-serif',
        color: '#e64340',
        align: 'right',
      });
    }
  }
}

module.exports = GameScene;
