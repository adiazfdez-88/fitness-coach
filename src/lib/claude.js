const WORKOUT_TYPE_LABELS = {
  gimnasio:   'Gimnasio completo (máquinas, cables, barras, mancuernas)',
  calistenia: 'Calistenia (SOLO peso corporal)',
  casa:       'Casa con mancuernas (mancuernas + peso corporal)',
  mixto:      'Mixto (gimnasio + calistenia)',
  cardio:        'Cardio / Running (carrera, intervalos, HIIT cardio — sin pesas)',
  fuerza_cardio: 'Fuerza + Cardio (primera mitad pesas, segunda mitad cardio o circuito mixto)',
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

function extractJSON(text) {
  try { return JSON.parse(text); } catch {}
  const stripped = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try { return JSON.parse(stripped); } catch {}
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  return null;
}

function buildPrompt(profile, day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary) {
  const types = Array.isArray(profile.workoutTypes) ? profile.workoutTypes : [profile.workoutType].filter(Boolean);
  const isCardioDay = types.length === 1 && types[0] === 'cardio';
  const isFuerzaCardio = types.length === 1 && types[0] === 'fuerza_cardio';
  const onlyCalistenia = types.length === 1 && types[0] === 'calistenia';
  const typeRule = isCardioDay
    ? 'DÍA DE CARDIO / RUNNING. Genera un plan de carrera o cardio, NO de fuerza.'
    : onlyCalistenia
      ? 'SOLO peso corporal, sin equipamiento externo.'
      : `Equipamiento/entornos: ${types.map(t => WORKOUT_TYPE_LABELS[t] || t).join(' + ')}.`;
  const injuryNote = buildInjuryNote(profile.injuries);

  const lastWeekSection = lastWeekSummary
    ? `SEMANA ANTERIOR (para continuidad y progresión):\n${lastWeekSummary}\n\n`
    : '';
  const groupSection = !isCardioDay && !isFuerzaCardio && assignedGroup
    ? `GRUPO MUSCULAR PARA HOY: ${assignedGroup}\nEl campo "muscleGroup" debe reflejar exactamente este grupo.\n\n`
    : '';
  const avoidSection = usedExercises?.length
    ? `EJERCICIOS YA USADOS ESTA SEMANA — NO REPETIR NINGUNO:\n${usedExercises.join(', ')}\n\n`
    : '';
  const weekSection = allDays?.length > 1
    ? `SEMANA (${allDays.length} días: ${allDays.join(', ')})\n\n`
    : '';

  const cardioStructure = `{
  "day": "${day}",
  "muscleGroup": "Cardio / Running",
  "weekTip": ${isLastDay ? '"3 recomendaciones breves: una de nutrición para corredores, una de descanso/recuperación, una de progresión en running."' : 'null'},
  "warmup": [
    {"name": "nombre del ejercicio de calentamiento", "duration": "X min", "why": "razón en 1 línea"}
  ],
  "main": [
    {
      "name": "nombre del bloque (ej: Carrera continua, Intervalos 400m, HIIT)",
      "sets": "X series o bloques",
      "reps": "X min / X km / X repeticiones",
      "rest": "Xs o X min",
      "technique": "ritmo, frecuencia cardíaca o consejo clave de forma",
      "why": "razón en 1 línea",
      "isKey": true
    }
  ],
  "core": [
    {
      "name": "ejercicio de core para runners",
      "sets": "X",
      "reps": "X o Xs",
      "rest": "Xs",
      "technique": "consejo técnico",
      "why": "por qué ayuda al running",
      "isKey": false
    }
  ],
  "cooldown": [
    {"name": "estiramiento post-carrera", "duration": "X seg por lado", "why": "razón en 1 línea"}
  ]
}

Reglas cardio:
- warmup: 2 elementos de movilidad dinámica para runners
- main: 3 a 4 bloques de entrenamiento de cardio (carrera continua, intervalos, fartlek, HIIT, etc.) adaptados al nivel ${profile.level}
- core: 2 ejercicios que beneficien específicamente a runners (cadera, glúteos, estabilidad)
- cooldown: 2 estiramientos para piernas/caderas post-carrera
- Usa distancias y tiempos reales, no pesos`;

  const strengthStructure = `{
  "day": "${day}",
  "muscleGroup": "nombre del grupo muscular",
  "weekTip": ${isLastDay ? '"3 recomendaciones breves separadas por puntos: una de nutrición, una de descanso, una de progresión."' : 'null'},
  "warmup": [
    {"name": "nombre", "duration": "X min", "why": "razón en 1 línea"}
  ],
  "main": [
    {
      "name": "nombre del ejercicio",
      "sets": "X",
      "reps": "X-X",
      "rest": "Xs",
      "technique": "consejo técnico clave en 1 oración",
      "why": "razón en 1 línea",
      "isKey": false
    }
  ],
  "core": [
    {
      "name": "nombre",
      "sets": "X",
      "reps": "X o Xs",
      "rest": "Xs",
      "technique": "consejo técnico",
      "why": "razón en 1 línea",
      "isKey": false
    }
  ],
  "cooldown": [
    {"name": "nombre", "duration": "X seg por lado", "why": "razón en 1 línea"}
  ]
}

Reglas:
- warmup: exactamente 2 elementos
- main: 4 a 5 elementos, marca isKey:true en 1 o 2 ejercicios clave del día
- core: exactamente 2 elementos${injuryNote ? ' (obligatoriamente adaptados a las lesiones indicadas)' : ''}
- cooldown: exactamente 2 elementos
- Nivel de dificultad: ${profile.level}`;

  const fuerzaCardioStructure = `{
  "day": "${day}",
  "muscleGroup": "Fuerza + Cardio",
  "weekTip": ${isLastDay ? '"3 recomendaciones: una de nutrición pre/post entreno mixto, una de recuperación, una de progresión."' : 'null'},
  "warmup": [
    {"name": "ejercicio de calentamiento dinámico", "duration": "X min", "why": "razón en 1 línea"}
  ],
  "main": [
    {
      "name": "ejercicio de fuerza",
      "sets": "X",
      "reps": "X-X",
      "rest": "Xs",
      "technique": "consejo técnico",
      "why": "razón en 1 línea",
      "isKey": false
    }
  ],
  "core": [
    {
      "name": "ejercicio de core",
      "sets": "X",
      "reps": "X o Xs",
      "rest": "Xs",
      "technique": "consejo técnico",
      "why": "razón en 1 línea",
      "isKey": false
    }
  ],
  "cooldown": [
    {"name": "estiramiento", "duration": "X seg", "why": "razón en 1 línea"}
  ]
}

Reglas Fuerza + Cardio:
- warmup: 2 elementos dinámicos
- main: 3 ejercicios de fuerza compuestos (con series/reps) seguidos de 2 bloques de cardio (con duración/distancia). Marca isKey:true en el ejercicio de fuerza principal y en el bloque cardio principal
- core: 2 ejercicios
- cooldown: 2 estiramientos
- La sesión debe tener estructura clara: BLOQUE FUERZA → BLOQUE CARDIO
- Nivel: ${profile.level}`;

  return `Eres un entrenador personal experto. Genera la rutina de ${day} en español.

${weekSection}${groupSection}${avoidSection}${lastWeekSection}${injuryNote}Perfil: ${profile.name}, ${profile.age}a, ${profile.weight}kg, ${profile.height}cm | Nivel: ${profile.level} | Sesión: ${profile.sessionTime} | Objetivos: ${profile.goals} | ${typeRule}

Responde ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después. Sin bloques markdown. Solo el JSON puro.

Estructura exacta:
${isCardioDay ? cardioStructure : isFuerzaCardio ? fuerzaCardioStructure : strengthStructure}
- NO incluyas URLs en el JSON`;
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 529) {
      // Límite de velocidad — esperar y reintentar
      if (attempt < maxRetries) {
        await sleep(2000 * (attempt + 1)); // 2s, 4s, 6s
        continue;
      }
    }
    return res;
  }
}

export async function generateDayPlan({ profile, day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY no configurada en Vercel.');

  const prompt = buildPrompt(
    { ...profile, equipment: Array.isArray(profile.equipment) ? profile.equipment.join(', ') : profile.equipment },
    day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary
  );

  const res = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1600,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 429 || res.status === 529)
      throw new Error('Demasiadas solicitudes al mismo tiempo. Inténtalo de nuevo en unos segundos.');
    throw new Error(err.error?.message || `Error ${res.status} de la API`);
  }

  const data = await res.json();
  const plan = extractJSON(data.content[0].text);
  if (!plan) throw new Error('La IA no devolvió un formato válido. Inténtalo de nuevo.');
  return plan;
}
