import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

const WORKOUT_TYPE_LABELS = {
  gimnasio:  'Gimnasio con máquinas (usa máquinas, cables, barras, mancuernas)',
  calistenia: 'Calistenia / peso corporal',
  casa:      'Casa con mancuernas (solo mancuernas y peso corporal, sin barras ni máquinas)',
  mixto:     'Mixto (combina ejercicios de gimnasio y calistenia)',
};

function buildInjurySection(injuries) {
  if (!injuries || !injuries.trim()) {
    return `✅ SIN LESIONES: El usuario no reporta lesiones. Incluye cualquier ejercicio apropiado para su nivel.`;
  }
  const text = injuries.toLowerCase();
  const hasLumbar = text.includes('l4') || text.includes('l5') || text.includes('s1') ||
    text.includes('lumbar') || text.includes('hernia') || text.includes('disco') ||
    text.includes('espalda baja') || text.includes('lumbago');
  const lumbarNote = hasLumbar
    ? `\n   ⚠️ CORE CON LESIÓN LUMBAR: Usa ÚNICAMENTE plancha en codos, dead bug, hollow hold, bird dog. PROHIBIDO ABSOLUTO: crunches, sit-ups, elevaciones de piernas rectas.`
    : '';
  return `⚠️ LESIONES/LIMITACIONES (CRÍTICO): El usuario reporta: "${injuries}". Adapta TODOS los ejercicios. No asumas lesiones adicionales.${lumbarNote}`;
}

function buildWorkoutTypeSection(workoutType) {
  if (workoutType === 'calistenia') {
    return `🏋️ TIPO: Calistenia EXCLUSIVAMENTE. SOLO peso corporal: dominadas, fondos, lagartijas, sentadillas, zancadas, pistol squat, etc. PROHIBIDO cualquier peso externo.`;
  }
  if (workoutType === 'casa') return `🏋️ TIPO: Casa con mancuernas. Solo mancuernas y peso corporal.`;
  if (workoutType === 'gimnasio') return `🏋️ TIPO: Gimnasio completo. Usa máquinas, cables, barras y mancuernas.`;
  return `🏋️ TIPO: Mixto. Combina equipamiento de gimnasio y calistenia.`;
}

function buildPrompt(profile, selectedDays) {
  const daysText = selectedDays.join(', ');
  const workoutTypeLabel = WORKOUT_TYPE_LABELS[profile.workoutType] || profile.workoutType;
  return `Eres un entrenador personal certificado. Genera una rutina semanal completa en español.

${buildInjurySection(profile.injuries)}

${buildWorkoutTypeSection(profile.workoutType)}

**PERFIL:**
- Nombre: ${profile.name} | Edad: ${profile.age} | Peso: ${profile.weight} kg | Estatura: ${profile.height} cm
- Nivel: ${profile.level} | Tiempo por sesión: ${profile.sessionTime}
- Tipo de entrenamiento: ${workoutTypeLabel}
- Objetivos: ${profile.goals}
- Equipamiento: ${profile.equipment}

**DÍAS:** ${daysText}

**ESTRUCTURA POR DÍA:**

## [Día] — [Grupo Muscular]

### Calentamiento (5-10 min)
- Ejercicio · [Ver video](https://www.youtube.com/results?search_query=ejercicio+warm+up) · Duración

### Bloque principal
**Nombre Ejercicio** · [Ver video](https://www.youtube.com/results?search_query=ejercicio+proper+form+beginners)
- Series: X | Reps: X | Descanso: X seg
- Técnica: nota clave

### Core / Abdomen (OBLIGATORIO cada sesión)
2-3 ejercicios de core adaptados a lesiones.

### Vuelta a la calma (5 min)
- Ejercicio · [Ver video](https://www.youtube.com/results?search_query=ejercicio+cool+down) · Duración

---

**REGLAS:**
1. Plan completo para LOS ${selectedDays.length} DÍAS: ${daysText}. No termines antes.
2. Cada ejercicio lleva [Ver video](...) con nombre real en la URL (+ en lugar de espacios).
3. Core obligatorio en cada día.
4. ${profile.workoutType === 'calistenia' ? 'SOLO peso corporal.' : `Ejercicios para "${workoutTypeLabel}".`}
5. Al final: ## Recomendaciones generales.`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en Vercel → Settings → Environment Variables.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  let profile, selectedDays;
  try {
    ({ profile, selectedDays } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON inválido' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildPrompt(profile, selectedDays);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        });
        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err.status === 401
          ? 'API key inválida. Verifica ANTHROPIC_API_KEY en Vercel.'
          : `Error: ${err.message}`;
        controller.enqueue(new TextEncoder().encode(`\n\n⚠️ ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
