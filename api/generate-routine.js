import Anthropic from '@anthropic-ai/sdk';

// Lee y parsea el body manualmente (req.body no siempre viene pre-parseado en Vercel)
async function readBody(req) {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk.toString(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada. Ve a Vercel → Settings → Environment Variables y agrega ANTHROPIC_API_KEY.' });
  }

  let prompt;
  try {
    const body = await readBody(req);
    prompt = body?.prompt;
  } catch (e) {
    return res.status(400).json({ error: 'Error leyendo la solicitud: ' + e.message });
  }

  if (!prompt) return res.status(400).json({ error: 'Falta el prompt en la solicitud' });

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
    console.error('Anthropic error:', err.status, err.message);
    const msg =
      err.status === 401 ? 'API key inválida. Verifica ANTHROPIC_API_KEY en Vercel.' :
      err.status === 429 ? 'Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.' :
      err.status === 529 ? 'La IA está ocupada. Intenta de nuevo en unos segundos.' :
      `Error ${err.status || ''}: ${err.message}`;
    return res.status(err.status || 500).json({ error: msg });
  }
}
