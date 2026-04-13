const config = require('../config');

async function generateAIResponse(topic, history, playerName) {
  const { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } = config;

  if (!LLM_API_KEY) {
    // Fallback mock response when no API key configured
    const mocks = [
      '我觉得这个问题挺有意思的，我也在想呢。',
      '哈哈，我跟楼上想法差不多。',
      '其实我还没太想好，不过大概就是这样吧。',
      '说到这个，我最近刚好有点体会。',
      '嗯，我理解你的意思，我也有类似经历。',
    ];
    return mocks[Math.floor(Math.random() * mocks.length)];
  }

  const messages = [
    {
      role: 'system',
      content:
        `你正在一个微信群聊中扮演一名普通人类玩家，你的名字是「${playerName}」。\n` +
        `当前讨论话题是：${topic}\n` +
        `要求：\n` +
        `1. 用自然、口语化的中文回复，像真人聊天一样，可以有少量语气词。\n` +
        `2. 字数控制在 20-50 字。\n` +
        `3. 不要暴露自己是 AI，不要出现"作为 AI"、"我没有感情"等表述。\n` +
        `4. 可以适当赞同或回应其他玩家的观点。`,
    },
    ...history.map((h) => ({
      role: h.role || 'user',
      content: h.content,
    })),
  ];

  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.9,
        max_tokens: 80,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('LLM API error:', text);
      return '（网络有点卡，稍后再说）';
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || '（嗯……让我想想）';
  } catch (err) {
    console.error('LLM request failed:', err);
    return '（刚才走神了，哈哈）';
  }
}

module.exports = { generateAIResponse };
