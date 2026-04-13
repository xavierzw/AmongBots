require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  MAX_PLAYERS: 4,
  HUMAN_COUNT: 3,
  AI_COUNT: 1,
  TOTAL_ROUNDS: 5,
  SPEAK_TIMEOUT_MS: 30000,
};
