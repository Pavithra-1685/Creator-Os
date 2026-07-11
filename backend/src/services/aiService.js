const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AI_TYPES = [
  'caption', 'title', 'description', 'script', 'hook',
  'hashtag', 'seo', 'grammar', 'tone', 'rewrite',
  'youtube_idea', 'reel_idea', 'shorts_idea', 'weekly_plan', 'trending',
];

const callAI = async (prompt, systemPrompt) => {
  // Uses Groq API (fast + free tier available)
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    // Fallback to OpenAI if no Groq key
    return callOpenAI(prompt, systemPrompt);
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Groq API error: ${err.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    result: data.choices[0]?.message?.content || '',
    model,
    tokens: data.usage?.total_tokens,
  };
};

const callOpenAI = async (prompt, systemPrompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('No AI API key configured. Set GROQ_API_KEY or OPENAI_API_KEY.');

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.75,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API error: ${err.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    result: data.choices?.[0]?.message?.content || '',
    model,
    tokens: data.usage?.total_tokens,
  };
};

const SYSTEM_PROMPTS = {
  caption: 'You are an expert social media copywriter. Write engaging captions that drive engagement. Be concise, use emojis strategically, and include a call-to-action.',
  title: 'You are a YouTube SEO expert. Write compelling video titles that are clickable, SEO-optimized, and under 60 characters. Suggest 5 options.',
  description: 'You are a YouTube channel manager. Write detailed, SEO-rich video descriptions with timestamps, links sections, and relevant keywords.',
  script: 'You are a professional content scriptwriter. Write engaging, structured scripts with a hook, main content, and call-to-action. Format with clear sections.',
  hook: 'You are a viral content specialist. Write 5 powerful video hooks (first 5 seconds) that immediately grab attention. Use curiosity, controversy, or bold claims.',
  hashtag: 'You are a social media strategist. Generate 30 relevant hashtags — mix of trending, niche, and broad hashtags. Format as a list.',
  seo: 'You are an SEO specialist for content creators. Provide specific SEO recommendations including keywords, tags, and optimization tips.',
  grammar: 'You are a professional editor. Fix all grammar, spelling, and punctuation errors. Maintain the original voice and tone.',
  tone: 'You are a writing coach. Rewrite the provided text in the specified tone while maintaining the core message.',
  rewrite: 'You are a content strategist. Rewrite the provided content to be more engaging, clear, and impactful.',
  youtube_idea: 'You are a YouTube content strategist. Generate 10 compelling YouTube video ideas with titles, angles, and why they would perform well.',
  reel_idea: 'You are an Instagram Reels specialist. Generate 10 viral Reel ideas with hooks, concepts, and trending audio suggestions.',
  shorts_idea: 'You are a YouTube Shorts expert. Generate 10 short-form video ideas perfect for YouTube Shorts (under 60 seconds).',
  weekly_plan: 'You are a content calendar expert. Create a detailed 7-day content plan with specific post ideas, times, and platforms for each day.',
  trending: 'You are a trend analyst for content creators. Identify 10 trending topics in the specified niche with opportunity analysis and content angle suggestions.',
};

const generateContent = async (userId, { type, prompt, tone, platform, niche, extra }) => {
  if (!AI_TYPES.includes(type)) throw Object.assign(new Error(`Invalid AI type: ${type}`), { status: 400 });

  const systemPrompt = SYSTEM_PROMPTS[type] || 'You are a helpful content creation assistant.';
  const fullPrompt = buildPrompt(type, { prompt, tone, platform, niche, extra });

  const { result, model, tokens } = await callAI(fullPrompt, systemPrompt);

  // Log the AI request
  await prisma.aIRequest.create({
    data: { type, prompt: fullPrompt, result, model: model || 'unknown', tokens: tokens || 0, userId },
  });

  return { result, type, model };
};

const buildPrompt = (type, { prompt, tone, platform, niche, extra }) => {
  let p = prompt || '';
  if (platform) p += `\nTarget Platform: ${platform}`;
  if (niche) p += `\nContent Niche: ${niche}`;
  if (tone) p += `\nTone: ${tone}`;
  if (extra) p += `\nAdditional Context: ${extra}`;
  return p;
};

const getAIHistory = async (userId, { type, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = { userId, ...(type && { type }) };
  const [items, total] = await Promise.all([
    prisma.aIRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.aIRequest.count({ where }),
  ]);
  return { items, total, page, limit };
};

module.exports = { generateContent, getAIHistory, AI_TYPES };
