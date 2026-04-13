const { MODES } = require('../config');
const FindAIGame = require('./FindAIGame');
const BattleRoyaleGame = require('./BattleRoyaleGame');

function createGame(room, mode, options = {}) {
  switch (mode) {
    case MODES.BATTLE_ROYALE:
      return new BattleRoyaleGame(room, options.difficulty);
    case MODES.FIND_AI:
    default:
      return new FindAIGame(room);
  }
}

module.exports = { createGame };
