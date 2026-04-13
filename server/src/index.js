const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { PORT } = require('./config');
const registerSocketHandlers = require('./socket');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/', (req, res) => {
  res.send('Who is AI Server Running');
});

registerSocketHandlers(wss);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
