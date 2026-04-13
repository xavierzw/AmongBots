const net = require('./network');
const HomeScene = require('./scenes/HomeScene');
const RoomScene = require('./scenes/RoomScene');
const GameScene = require('./scenes/GameScene');
const VoteScene = require('./scenes/VoteScene');
const ResultScene = require('./scenes/ResultScene');

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');
const { windowWidth, windowHeight } = wx.getSystemInfoSync();
canvas.width = windowWidth;
canvas.height = windowHeight;

let currentScene = null;

function switchScene(name, data) {
  if (currentScene && currentScene.destroy) {
    currentScene.destroy();
  }

  switch (name) {
    case 'home':
      currentScene = new HomeScene(windowWidth, windowHeight, switchScene);
      break;
    case 'room':
      currentScene = new RoomScene(windowWidth, windowHeight, switchScene, data);
      break;
    case 'game':
      currentScene = new GameScene(windowWidth, windowHeight, switchScene, data);
      break;
    case 'vote':
      currentScene = new VoteScene(windowWidth, windowHeight, switchScene, data);
      break;
    case 'result':
      currentScene = new ResultScene(windowWidth, windowHeight, switchScene, data);
      break;
    default:
      currentScene = new HomeScene(windowWidth, windowHeight, switchScene);
  }

  if (currentScene.init) currentScene.init();
}

wx.onTouchStart((e) => {
  if (currentScene && currentScene.onTouch) {
    currentScene.onTouch(e);
  }
});

wx.onKeyboardInput((res) => {
  if (currentScene && currentScene.onKeyboardInput) {
    currentScene.onKeyboardInput(res.value);
  }
});

wx.onKeyboardConfirm((res) => {
  if (currentScene && currentScene.onKeyboardConfirm) {
    currentScene.onKeyboardConfirm(res.value);
  }
});

wx.onTouchEnd((e) => {
  // Optional: auto keyboard logic can be handled per scene
});

function loop() {
  if (currentScene && currentScene.draw) {
    currentScene.draw(ctx);
  }
  requestAnimationFrame(loop);
}

async function init() {
  try {
    await net.connect();
  } catch (err) {
    console.error('Connect failed', err);
    wx.showModal({
      title: '连接失败',
      content: '无法连接到游戏服务器，请检查网络',
      showCancel: false,
    });
  }
  switchScene('home');
  loop();
}

init();
