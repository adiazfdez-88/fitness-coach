import Anthropic from '@anthropic-ai/sdk';

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

  const lumbarCoreNote = hasLumbar
    ? `\n   ⚠️ CORE CON LESIÓN LUMBAR: Usa ÚNICAMENTE plancha en codos, dead bug, hollow hold, bird dog, respiración diafragmática. PROHIBIDO ABSOLUTO: crunches, sit-ups, elevaciones de piernas rectas, cualquier flexión lumbar bajo carga.`
    : '';

  return `⚠️ LESIONES/LIMITACIONES (CRÍTICO): El usuario reporta: "${injuries}".
OBLIGATORIO: Adapta TODOS los ejercicios para no agravar estas condiciones. No asumas ni inventes lesiones adicionales.${lumbarCoreNote}`;
}

function buildWorkoutTypeSection(workoutType) {
  if (workoutType === 'calistenia') {
    return `🏋️ TIPO DE ENTRENAMIENTO: Calistenia / peso corporal EXCLUSIVAMENTE.
REGLA ABSOLUTA: USA SOLO ejercicios de peso corporal. Permitidos: dominadas, fondos en paralelas, lagartijas (pushups) en todas sus variantes, sentadillas con peso corporal, zancadas, pistol squat, muscle-up, planche progressions, L-sit, dips, australian rows, pike pushup, archer pushup, etc.
PROHIBIDO: cualquier mancuerna, barra, máquina, cable o peso externo.`;
  }
  if (workoutType === 'casa') {
    return `🏋️ TIPO DE ENTRENAMIENTO: Casa con mancuernas.
USA SOLO mancuernas y ejercicios de peso corporal. No incluyas máquinas, cables ni barras olímpicas.`;
  }
  if (workoutType === 'gimnasio') {
    return `🏋️ TIPO DE ENTRENAMIENTO: Gimnasio completo con máquinas.
Puedes usar máquinas, cables, poleas, barras, mancuernas y todo el equipamiento de gimnasio disponible.`;
  }
  return `🏋️ TIPO DE ENTRENAMIENTO: Mixto (gimnasio + calistenia). Combina ejercicios con equipamiento y de peso corporal.`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en las variables de entorno de Vercel.' });
  }

  const { profile, selectedDays } = req.body;

  if (!profile || !selectedDays) {
    return res.status(400).json({ error: 'Faltan datos: profile y selectedDays son requeridos.' });
  }
  const daysText = selectedDays.join(', ');

  const injurySection = buildInjurySection(profile.injuries);
  const workoutTypeSection = buildWorkoutTypeSection(profile.workoutType);
  const workoutTypeLabel = WORKOUT_TYPE_LABELS[profile.workoutType] || profile.workoutType;

  const prompt = `Eres un entrenador personal certificado y experto en programación de entrenamiento. Genera una rutina semanal completa en español.

${injurySection}

${workoutTypeSection}

**PERFIL DEL USUARIO:**
- Nombre: ${profile.name}
- Edad: ${profile.age} años | Peso: ${profile.weight} kg | Estatura: ${profile.height} cm
- Nivel: ${profile.level}
- Tipo de entrenamiento: ${workoutTypeLabel}
- Objetivos: ${profile.goals}
- Equipamiento disponible: ${profile.equipment}
- Tiempo por sesión: ${profile.sessionTime}

**DÍAS DE ENTRENAMIENTO:** ${daysText}

**ESTRUCTURA OBLIGATORIA PARA CADA DÍA:**

## [Día] — [Grupo Muscular Principal]

### Calentamiento (5-10 min)
- Ejercicio · [Ver video](https://www.youtube.com/results?search_query=nombre+del+ejercicio+warm+up) · Duración

### Bloque principal
Para cada ejercicio usa EXACTAMENTE este formato:

**Nombre del Ejercicio** · [Ver video](https://www.youtube.com/results?search_query=nombre+del+ejercicio+proper+form+beginners)
- Series: X | Reps/Tiempo: X | Descanso: X seg
- Técnica: [nota clave de ejecución]

### Core / Abdomen (OBLIGATORIO en CADA sesión)
Incluye 2-3 ejercicios de core adaptados a las lesiones del usuario.
${profile.injuries ? `Recuerda la restricción de lesiones al elegir ejercicios de core.` : 'Sin restricciones, varía los ejercicios de core entre sesiones.'}

### Vuelta a la calma (5 min)
- Ejercicio · [Ver video](https://www.youtube.com/results?search_query=nombre+ejercicio+cool+down+stretch) · Duración

---

**REGLAS ABSOLUTAS:**
1. GENERA plan completo para LOS ${selectedDays.length} DÍAS: ${daysText}. No termines antes del último día.
2. Cada ejercicio lleva su [Ver video](...) — nombre real en la URL con + en lugar de espacios.
3. La sección ### Core / Abdomen es OBLIGATORIA en cada uno de los ${selectedDays.length} días.
4. ${profile.workoutType === 'calistenia' ? 'SOLO peso corporal. Cero pesos externos.' : `Usa ejercicios apropiados para "${workoutTypeLabel}".`}
5. Adapta volumen e intensidad al nivel ${profile.level} y ${profile.sessionTime} por sesión.
6. Al finalizar TODOS los días, agrega ## Recomendaciones generales (nutrición, sueño, recuperación).`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ routine: message.content[0].text });
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    const userMsg = error.status === 401
      ? 'API key de Anthropic inválida. Verifica la variable ANTHROPIC_API_KEY en Vercel.'
      : `Error al generar la rutina: ${error.message}`;
    res.status(500).json({ error: userMsg });
  }
}
