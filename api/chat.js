import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_INPUT_LENGTH = 400;
const MAX_HISTORY_MESSAGES = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
    const { message, history } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const cleanMessage = message.trim().slice(0, MAX_INPUT_LENGTH);

    if (groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
      try {
        const responseText = await callGroqChat({
          apiKey: groqApiKey.trim(),
          message: cleanMessage,
          history,
        });

        return res.status(200).json({ response: responseText, provider: 'groq' });
      } catch (groqError) {
        console.warn('Groq request failed, trying Gemini next:', groqError);
      }
    }

    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        const responseText = await callGeminiChat({
          apiKey: geminiApiKey.trim(),
          message: cleanMessage,
          history,
        });

        return res.status(200).json({ response: responseText, provider: 'gemini' });
      } catch (geminiError) {
        console.warn('Gemini request failed, falling back to local response:', geminiError);
      }
    }

    const { message: userMessage } = req.body || {};
    return res.status(200).json({ response: buildFallbackResponse(userMessage), fallback: true });
  } catch (err) {
    const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message || '') : '';

    if (errorMessage.includes('429')) {
      console.warn('Chat API: provider rate limit exceeded (429)');
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return res.status(502).json({ error: 'PROVIDER_AUTH_FAILED' });
    }

    console.warn('Chat API error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
>>>>>>> c4c748a (Add serverless chat API with AI provider fallback and rate limiting)
- **RoaDry**: flood monitoring and safe-route optimization for Metro Manila
- **KwikSlot**: a cinema booking platform with seat-grid and checkout flow logic

Which project do you want details on?`;
  }

  if (/education|school|college|course|graduat/.test(query)) {
    return `Noel is studying **BS Computer Science** at **FEU Institute of Technology** and is expected to graduate in **2026**.

- Thesis: **RoaDry**
- Coursework: OOP, Data Structures, Algorithms, Machine Learning, Web and Mobile Development
- Earlier education: **San Felipe Neri Catholic School**

Do you want certifications too?`;
  }

  if (/contact|email|github|linkedin|facebook/.test(query)) {
    return `You can reach Noel here:

- **Email:** noeljoshcasin@gmail.com
- **GitHub:** https://github.com/noeljosh123
- **LinkedIn:** https://www.linkedin.com/in/noel-josh-casin-aabb9538a/
- **Facebook:** https://www.facebook.com/noeljosh.casin.5/

Need help choosing the best contact method?`;
  }

  return `I can help with Noel's **skills**, **projects**, **experience**, **education**, or **contact links**.

Try asking something like:

- "Who is Noel?"
- "What's his tech stack?"
- "Tell me about his projects"

What would you like to know?`;
}

function readLocalEnvFile() {
  if (localEnvCache.size > 0) {
    return localEnvCache;
  }

  try {
    const raw = fs.readFileSync(localEnvPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      localEnvCache.set(key, value);
    }
  } catch {
    // Ignore missing local env files in production or during tests.
  }

  return localEnvCache;
}

function getEnvValue(name) {
  const runtimeValue = process.env[name];
  if (runtimeValue && runtimeValue.trim()) {
    return runtimeValue.trim();
  }

  const localValue = readLocalEnvFile().get(name);
  return localValue && localValue.trim() ? localValue.trim() : '';
}

function normalizeChatHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .flatMap((entry) => {
      if (!entry) {
        return [];
      }

      const text = Array.isArray(entry.parts)
        ? entry.parts
            .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text || '') : ''))
            .join(' ')
            .trim()
        : '';

      if (!text) {
        return [];
      }

      if (entry.role === 'model' || entry.role === 'assistant') {
        return [{ role: 'assistant', content: text.slice(0, MAX_INPUT_LENGTH) }];
      }

      if (entry.role === 'user') {
        return [{ role: 'user', content: text.slice(0, MAX_INPUT_LENGTH) }];
      }

      return [];
    });
}

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
}

function getTrustedOrigin() {
  const configuredOrigin = process.env.APP_ORIGIN || process.env.PUBLIC_APP_ORIGIN;
  const vercelOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const candidates = [
    configuredOrigin,
    vercelOrigin ? `https://${vercelOrigin}` : '',
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  for (const origin of candidates) {
    ORIGIN_ALLOWLIST.add(origin);
  }

  return ORIGIN_ALLOWLIST;
}

function getRequestOrigin(req) {
  const origin = normalizeOrigin(req.headers.origin);
  if (origin) {
    return origin;
  }

  const referer = req.headers.referer || req.headers.referrer;
  if (typeof referer === 'string' && referer.trim()) {
    try {
      const parsed = new URL(referer);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return '';
    }
  }

  return '';
}

function isTrustedRequest(req) {
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) {
    return false;
  }

  return getTrustedOrigin().has(requestOrigin);
}

function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const ip = getRequestIp(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hourlyWindowStart = now - 60 * RATE_LIMIT_WINDOW_MS;
  const timestamps = rateLimitStore.get(ip) || [];
  const recentTimestamps = timestamps.filter((timestamp) => timestamp > hourlyWindowStart);
  const minuteTimestamps = recentTimestamps.filter((timestamp) => timestamp > windowStart);
  const minuteCount = minuteTimestamps.length;

  if (minuteCount >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((minuteTimestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  recentTimestamps.push(now);
  rateLimitStore.set(ip, recentTimestamps);
  return { allowed: true };
}

function toGroqMessages(history) {
  return history.map((entry) => ({
    role: entry.role === 'assistant' ? 'assistant' : 'user',
    content: entry.content,
  }));
}

function toGeminiContents(history) {
  return history.map((entry) => ({
    role: entry.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: entry.content }],
  }));
}

async function callGroqChat({ apiKey, message, history }) {
  const groqHistory = toGroqMessages(normalizeChatHistory(history));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: 'system', content: PORTFOLIO_CONTEXT },
        {
          role: 'assistant',
          content: "Hello! 👋 I'm Noel's portfolio assistant. I can help you learn about his skills, projects, experience, and more. What would you like to know?",
        },
        ...groqHistory,
        { role: 'user', content: message },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Groq request failed (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq returned an empty response');
  }

  return content;
}

async function callGeminiChat({ apiKey, message, history }) {
  const normalizedHistory = normalizeChatHistory(history);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: PORTFOLIO_CONTEXT }],
        },
        contents: [
          ...toGeminiContents(normalizedHistory),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();

  if (!content) {
    throw new Error('Gemini returned an empty response');
  }

  return content;
}

function setResponseSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}



export default async function handler(req, res) {
  setResponseSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isTrustedRequest(req)) {
    return res.status(403).json({ error: 'FORBIDDEN_ORIGIN' });
  }

  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    if (rateLimit.retryAfterSeconds) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }
    return res.status(429).json({ error: 'RATE_LIMIT' });
  }

  try {
    const groqApiKey =
      getEnvValue('GROQ_API_KEY') ||
      getEnvValue('groq_api_key');

    const geminiApiKey = getEnvValue('GEMINI_API_KEY');

    if ((!groqApiKey || groqApiKey === 'your_groq_api_key_here') && (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here')) {
>>>>>>> c4c748a (Add serverless chat API with AI provider fallback and rate limiting)
      return res.status(500).json({ error: 'API_KEY_MISSING' });
    }

    const { message, history } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

<<<<<<< HEAD
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    if (groqApiKey) {
      // === Secure Backend GROQ Call ===
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: PORTFOLIO_CONTEXT },
            ...(history || []),
            { role: "user", content: message }
          ],
          stream: true,
          temperature: 0.4,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        if (response.status === 429) return res.status(429).json({ error: 'RATE_LIMIT' });
        throw new Error(`GROQ_API_ERROR: ${response.statusText}`);
      }

      // Stream the response back to the client
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const token = parsed.choices[0]?.delta?.content || "";
              if (token) res.write(token);
            } catch (e) { }
          }
        }
      }
      return res.end();
    } else {
      // === Secure Backend GEMINI Call ===
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
        systemInstruction: PORTFOLIO_CONTEXT,
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.7,
        },
      });

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: "Context: " + PORTFOLIO_CONTEXT }] },
          { role: 'model', parts: [{ text: "Understood. I am Noel's portfolio assistant." }] },
          ...(history || []).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          }))
        ],
      });

      const result = await chat.sendMessageStream(message);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        res.write(chunkText);
      }
      return res.end();
    }
  } catch (err) {
    if (err.message && err.message.includes('429')) {
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }
    console.error('Chat API Error:', err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: err.message
    });
=======
    const cleanMessage = message.trim().slice(0, MAX_INPUT_LENGTH);

    if (groqApiKey && groqApiKey !== 'your_groq_api_key_here') {
      try {
        const responseText = await callGroqChat({
          apiKey: groqApiKey.trim(),
          message: cleanMessage,
          history,
        });

        return res.status(200).json({ response: responseText, provider: 'groq' });
      } catch (groqError) {
        console.warn('Groq request failed, trying Gemini next:', groqError);
      }
    }

    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
      try {
        const responseText = await callGeminiChat({
          apiKey: geminiApiKey.trim(),
          message: cleanMessage,
          history,
        });

        return res.status(200).json({ response: responseText, provider: 'gemini' });
      } catch (geminiError) {
        console.warn('Gemini request failed, falling back to local response:', geminiError);
      }
    }

    const { message: userMessage } = req.body || {};
    return res.status(200).json({ response: buildFallbackResponse(userMessage), fallback: true });
  } catch (err) {
    const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message || '') : '';

    if (errorMessage.includes('429')) {
      console.warn('Chat API: provider rate limit exceeded (429)');
      return res.status(429).json({ error: 'RATE_LIMIT' });
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return res.status(502).json({ error: 'PROVIDER_AUTH_FAILED' });
    }

    console.warn('Chat API error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
>>>>>>> c4c748a (Add serverless chat API with AI provider fallback and rate limiting)
  }
}
