<p align="center">
  <img src="logo.png" alt="AmongBots Logo" width="160">
</p>

# AmongBots

一款多人在线对话推理微信小游戏。每局 4 人（3 真人 + 1 AI），围绕随机话题进行 5 轮发言，最终投票找出隐藏的 AI。

## 快速开始

### 1. 启动服务端

```bash
cd server
npm install
npm run dev
```

服务端默认运行在 `http://localhost:3000`。

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入你的 LLM API Key：

```bash
cp .env.example .env
```

### 3. 运行客户端

使用「微信开发者工具」打开 `client/` 目录：
- 在「详情」→「本地设置」中勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」。
- 修改 `client/js/network.js` 中的 `SERVER_URL` 为你本地服务端的 IP + 端口（如 `ws://192.168.1.5:3000`）。

## 游戏规则

1. 快速匹配进入 4 人房间。
2. 系统随机指定 1 人为「AI 伪装者」，其发言实际由 LLM 生成。
3. 每轮大家依次就话题发言，共 5 轮。
4. 5 轮结束后投票，≥2 人正确投中 AI 则人类胜利，否则 AI 胜利。
