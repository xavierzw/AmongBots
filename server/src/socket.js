const Room = require('./game/Room');

function registerSocketHandlers(wss) {
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.playerId = null;
    ws.roomId = null;

    ws.sendJSON = (type, payload) => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({ type, payload }));
      }
    };

    ws.on('message', (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (e) {
        ws.sendJSON('errorMsg', { msg: 'Invalid JSON' });
        return;
      }

      const { type, payload } = data;

      switch (type) {
        case 'match': {
          const player = {
            id: payload.id || generateId(),
            name: payload.name || `玩家${generateId().slice(-4)}`,
            avatar: payload.avatar || '',
            socket: ws,
          };
          ws.playerId = player.id;

          let room = null;
          for (const [, r] of Room.getAllRooms()) {
            if (r.status === 'waiting' && r.players.length < 4) {
              room = r;
              break;
            }
          }

          if (!room) {
            const roomId = Room.generateId();
            room = Room.getOrCreate(roomId);
          }

          const success = room.addPlayer(player);
          if (!success) {
            ws.sendJSON('errorMsg', { msg: '加入房间失败' });
            return;
          }

          ws.roomId = room.roomId;
          broadcastRoomUpdate(room);

          if (room.players.length >= 4) {
            room.startGame();
          }
          break;
        }

        case 'joinRoom': {
          const room = Room.getOrCreate(payload.roomId);
          const player = {
            id: payload.id || generateId(),
            name: payload.name || `玩家${generateId().slice(-4)}`,
            avatar: payload.avatar || '',
            socket: ws,
          };
          ws.playerId = player.id;

          const success = room.addPlayer(player);
          if (!success) {
            ws.sendJSON('errorMsg', { msg: '房间已满或游戏已开始' });
            return;
          }

          ws.roomId = room.roomId;
          broadcastRoomUpdate(room);
          break;
        }

        case 'startGame': {
          const room = Room.get(ws.roomId);
          if (!room) return;
          const player = room.players.find((p) => p.id === ws.playerId);
          if (!player || !player.isHost) {
            ws.sendJSON('errorMsg', { msg: '只有房主可以开始游戏' });
            return;
          }
          const started = room.startGame();
          if (!started) {
            ws.sendJSON('errorMsg', { msg: '人数不足，无法开始' });
          }
          break;
        }

        case 'speak': {
          const room = Room.get(ws.roomId);
          if (!room || !room.game) return;
          room.game.handleSpeak(ws.playerId, payload.content);
          break;
        }

        case 'vote': {
          const room = Room.get(ws.roomId);
          if (!room || !room.game) return;
          room.game.handleVote(ws.playerId, payload.targetId);
          break;
        }

        default:
          ws.sendJSON('errorMsg', { msg: 'Unknown message type' });
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      const room = Room.get(ws.roomId);
      if (room) {
        room.removePlayer(ws.playerId);
        if (Room.get(room.roomId)) {
          broadcastRoomUpdate(room);
        }
      }
    });
  });
}

function broadcastRoomUpdate(room) {
  const data = room.toClientData();
  room.players.forEach((p) => {
    p.socket.sendJSON('roomUpdate', data);
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

module.exports = registerSocketHandlers;
