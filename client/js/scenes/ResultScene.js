const { drawText } = require('../utils/canvas');
const net = require('../network');

class ResultScene {
  constructor(width, height, switchScene, data) {
    this.width = width;
    this.height = height;
    this.switchScene = switchScene;
    this.data = data;
  }

  onTouch(e) {
    this.switchScene('home');
  }

  draw(ctx) {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const humansWin = this.data.humansWin;

    drawText(ctx, humansWin ? '人类胜利！' : 'AI 胜利！', cx, 80, {
      font: 'bold 28px sans-serif',
      color: humansWin ? '#07c160' : '#e64340',
      align: 'center',
    });

    drawText(ctx, `AI 是: ${this.data.aiPlayerName}`, cx, 130, {
      font: '18px sans-serif',
      color: '#333',
      align: 'center',
    });

    drawText(ctx, '投票结果:', cx, 180, {
      font: 'bold 16px sans-serif',
      color: '#333',
      align: 'center',
    });

    const votes = this.data.votes || [];
    votes.forEach((v, i) => {
      drawText(ctx, `${v.voterName} → ${v.targetName}`, cx, 210 + i * 28, {
        font: '14px sans-serif',
        color: '#555',
        align: 'center',
      });
    });

    const yBottom = 210 + votes.length * 28 + 40;
    drawText(ctx, '点击任意位置返回首页', cx, yBottom, {
      font: '14px sans-serif',
      color: '#576b95',
      align: 'center',
    });
  }
}

module.exports = ResultScene;
