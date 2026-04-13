require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MODES = {
  FIND_AI: 'find-ai',
  BATTLE_ROYALE: 'battle-royale',
};

const MODE_CONFIG = {
  [MODES.FIND_AI]: {
    MAX_PLAYERS: 4,
    MIN_PLAYERS: 2,
    HUMAN_COUNT: 3,
    AI_COUNT: 1,
    TOTAL_ROUNDS: 5,
    SPEAK_TIMEOUT_MS: 30000,
  },
  [MODES.BATTLE_ROYALE]: {
    MAX_PLAYERS: 8, // dynamic based on difficulty, this is a safe upper bound
    MIN_PLAYERS: 1,
    HUMAN_COUNT: 1,
    AI_COUNT: 3, // default for easy
    TOTAL_ROUNDS: 2,
    SPEAK_TIMEOUT_MS: 30000,
  },
};

const BATTLE_ROYALE_DIFFICULTY = {
  easy: { aiCount: 3, totalRounds: 2, label: '简单' },
  normal: { aiCount: 5, totalRounds: 3, label: '普通' },
  hard: { aiCount: 7, totalRounds: 4, label: '困难' },
};

module.exports = {
  PORT: process.env.PORT || 3000,
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  MODES,
  MODE_CONFIG,
  BATTLE_ROYALE_DIFFICULTY,
};
