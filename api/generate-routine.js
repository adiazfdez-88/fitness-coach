import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en Vercel → Settings → Environment Variables.' });
  }

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1600,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });
    return res.status(200).json({ text: message.content[0].text });
  } catch (err) {
    const msg =
      err.status === 401 ? 'API key inválida. Verifica la variable en Vercel.' :
      err.status === 429 ? 'Demasiadas solicitudes. Inténtalo en unos segundos.' :
      `Error de la IA: ${err.message}`;
    return res.status(err.status || 500).json({ error: msg });
  }
}
