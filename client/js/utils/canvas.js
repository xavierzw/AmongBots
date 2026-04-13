function createButton(ctx, text, x, y, width, height, color, textColor, onClick) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);

  return {
    x, y, width, height, onClick, text, color,
    contains(tx, ty) {
      return tx >= x && tx <= x + width && ty >= y && ty <= y + height;
    }
  };
}

function drawText(ctx, text, x, y, options = {}) {
  ctx.fillStyle = options.color || '#333';
  ctx.font = options.font || '14px sans-serif';
  ctx.textAlign = options.align || 'left';
  ctx.textBaseline = options.baseline || 'top';
  ctx.fillText(text, x, y);
}

function drawBubble(ctx, text, x, y, maxWidth, isSelf) {
  ctx.font = '14px sans-serif';
  const padding = 10;
  const lineHeight = 20;
  const lines = wrapText(ctx, text, maxWidth - padding * 2);
  const bubbleWidth = maxWidth;
  const bubbleHeight = lines.length * lineHeight + padding * 2;

  ctx.fillStyle = isSelf ? '#95ec69' : '#fff';
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, bubbleWidth, bubbleHeight, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight);
  });

  return bubbleHeight;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const width = ctx.measureText(currentLine + words[i]).width;
    if (width < maxWidth) {
      currentLine += words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

module.exports = {
  createButton,
  drawText,
  drawBubble,
  wrapText,
};
