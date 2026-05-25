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
Escribe 3 ejercicios:
- Nombre · [Ver video](https://www.youtube.com/results?search_query=nombre+warm+up) · duración

### Bloque principal
Escribe 5 ejercicios:
**Nombre** · [Ver video](https://www.youtube.com/results?search_query=nombre+proper+form)
- Series: X | Reps: X | Descanso: Xs
- Técnica: nota breve

### Core / Abdomen (obligatorio)
2 ejercicios con link de video. Respeta lesiones.

### Vuelta a la calma (5 min)
2 ejercicios con link de video.${isLast ? '\n\n## Recomendaciones generales\n3 puntos clave de nutrición, descanso y progresión.' : ''}`;
}

export async function generateDayRoutine(apiKey, profile, day, dayIndex, totalDays, isLast) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{ role: 'user', content: buildPrompt(profile, day, dayIndex, totalDays, isLast) }],
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = data.error?.message || `Error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  return data.content[0].text;
}
