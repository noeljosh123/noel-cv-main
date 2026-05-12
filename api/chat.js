import { GoogleGenerativeAI } from '@google/generative-ai';

const PORTFOLIO_CONTEXT = `You are a smart, concise portfolio assistant for Noel Josh Casin. Answer visitor questions directly and briefly based ONLY on the information below.

## HOW TO RESPOND
- **Be Direct & Relevant**: Answer ONLY what the user asks. Do not give a generic overview of Noel's profile unless specifically asked (e.g., "Who is Noel?").
- **Formatting**: When listing projects, skills, or experience, use 3 to 5 bullet points. For simple greetings or conversational questions, a short, friendly sentence is perfectly fine.
- **Provide Context**: If asked about a skill, briefly mention a project where he used it.
- Use **bold** for key terms (names, technologies, tools).
- End with ONE short follow-up question when natural, but do not repeat the contact info unless they ask for it.
- Never write long paragraphs. Keep responses scannable.

## NOEL'S INFORMATION

**Personal:**
- Full Name: Noel Josh Casin | Location: Mandaluyong, Philippines
- Focus: CS / AI / Full Stack AI | Aspiring Full-Stack AI Engineer

**Education:**
- **FEU Institute of Technology** — BS Computer Science (graduating 2026, Manila)
  - Thesis: *RoaDry* — Real-time flood monitoring & route optimization for Metro Manila
  - Coursework: OOP, Data Structures, Algorithms, Machine Learning, Web & Mobile Dev
- **San Felipe Neri Catholic School** — STEM, graduated 2022

**Tech Stack:**
- Languages: Python, C++, Java, Dart, JavaScript, TypeScript, HTML, CSS
- Frontend: React, Tailwind CSS, Vite
- Backend: Django, Django Ninja, SQL, Firebase, Supabase
- Other: Power Platform, Project Management

**Projects & Experience:**
- **Resource Tracker (DEVUTIL v2)** — A full-stack internal tool developed at **Reed Elsevier (RELX)**. Replaced manual Excel-based tracking with real-time allocation and editing. Stack: **Python**, **Django Ninja**, **React**, **SQL**.
- **OSP Tool (Engagement Oversight)** — Centralized enterprise dashboard developed at **Reed Elsevier (RELX)** for tracking project progress, expenses, and financial burn rates. Integrated **Power Platform** components. Stack: **React**, **TypeScript**, **Node.js**, **Python**, **Django**.
- **CaraBuddy** — Local-first personal finance mobile app prioritizing privacy. Features real-time sync and secure database management. Stack: **Supabase**, **React**, **Tailwind CSS**.
- **RoaDry** — Flood monitoring and safe route app for Metro Manila. Uses **Dijkstra's algorithm** for routing and **Azure Vision AI** for flood detection. Integrated **Firebase** and **NLP**-based safety data aggregation. Stack: **Dart/Flutter**, **Firebase**, **Azure AI**.
- **KwikSlot** — Cinema booking platform with an interactive **8×10 seat grid**, VIP pricing tiers, and a multi-step checkout flow with real-time conflict resolution. Stack: **React**, **TypeScript**, **Tailwind CSS**, **Vite**.

**Certifications:**
- Civil Service Eligibility (Professional Level)
- CCNA: Introduction to Network
- DevNet Associate Course
- PMI Project Management
- ITS Python

**Interests & Skills:**
- Focus: **Full-Stack Development**, **Artificial Intelligence**, **Automation**.
- Interests: Gaming, AI Research.
- Languages: **English**, **Filipino**, **Mandarin** (Basic).

**Contact & Links:**
- Email: noeljoshcasin@gmail.com
- GitHub: https://github.com/noeljosh123
- LinkedIn: https://www.linkedin.com/in/noel-josh-casin-aabb9538a/
- Facebook: https://www.facebook.com/noeljosh.casin.5/
`;



export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get keys from standard process.env (Vite dev server passes these in securely)
    const groqApiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!groqApiKey && !geminiApiKey) {
      return res.status(500).json({ error: 'API_KEY_MISSING' });
    }

    const { message, history } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

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
  }
}
