import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'nodejs' };

const WORKOUT_TYPE_LABELS = {
  gimnasio:   'Gimnasio completo (máquinas, cables, barras, mancuernas)',
  calistenia: 'Calistenia (SOLO peso corporal)',
  casa:       'Casa con mancuernas (mancuernas + peso corporal)',
  mixto:      'Mixto (gimnasio + calistenia)',
};

function buildInjuryNote(injuries) {
  if (!injuries?.trim()) return '';
  const t = injuries.toLowerCase();
  const lumbar = t.includes('l4') || t.includes('l5') || t.includes('s1') ||
    t.includes('lumbar') || t.includes('hernia') || t.includes('disco') ||
    t.includes('espalda baja') || t.includes('lumbago');
  const coreRule = lumbar
    ? ' Core: SOLO plancha en codos, dead bug, bird dog. PROHIBIDO crunches/sit-ups.'
    : '';
  return `⚠️ LESIONES: "${injuries}". Adapta todos los ejercicios.${coreRule}\n\n`;
}

function buildPrompt(profile, day, dayIndex, totalDays, isLast) {
  const workoutLabel = WORKOUT_TYPE_LABELS[profile.workoutType] || profile.workoutType;
  const typeRule = profile.workoutType === 'calistenia'
    ? 'SOLO peso corporal, sin equipamiento externo.'
    : `Usa equipamiento de: ${workoutLabel}.`;
  const injuryNote = buildInjuryNote(profile.injuries);

  return `Eres un entrenador personal. Genera la rutina del ${day} (${dayIndex + 1}/${totalDays}) de forma CONCISA.

${injuryNote}Perfil: ${profile.name}, ${profile.age}a, ${profile.weight}kg, ${profile.height}cm | Nivel: ${profile.level} | Sesión: ${profile.sessionTime} | Objetivos: ${profile.goals} | ${typeRule}

## ${day} — [Grupo muscular]

### Calentamiento (5 min)
Escribe 3 ejercicios con formato:
- Nombre · [Ver video](https://www.youtube.com/results?search_query=nombre+warm+up) · duración

### Bloque principal
Escribe 5 ejercicios con formato:
**Nombre** · [Ver video](https://www.youtube.com/results?search_query=nombre+proper+form)
- Series: X | Reps: X | Descanso: Xs
- Técnica: nota breve

### Core / Abdomen (obligatorio)
Escribe 2 ejercicios con link de video. Respeta lesiones.

### Vuelta a la calma (5 min)
Escribe 2 ejercicios con link de video.${isLast ? '\n\n## Recomendaciones generales\nEscribe 3 puntos clave de nutrición, descanso y progresión.' : ''}`;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Vercel → Settings → Environment Variables.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  let profile, day, dayIndex, totalDays, isLast;
  try {
    ({ profile, day, dayIndex, totalDays, isLast } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildPrompt(profile, day, dayIndex, totalDays, isLast);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = message.content[0].text;
    return new Response(JSON.stringify({ content }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err.status === 401
      ? 'API key inválida. Verifica ANTHROPIC_API_KEY en Vercel.'
      : `Error Anthropic: ${err.message}`;
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
