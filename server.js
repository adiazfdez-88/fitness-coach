import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
    ? `\n   ⚠️ CORE CON LESIÓN LUMBAR: Usa ÚNICAMENTE plancha en codos, dead bug, hollow hold, bird dog. PROHIBIDO: crunches, sit-ups, elevaciones de piernas rectas.`
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

app.post('/api/generate-routine', async (req, res) => {
  const { profile, selectedDays } = req.body;
  const daysText = selectedDays.join(', ');
  const workoutTypeLabel = WORKOUT_TYPE_LABELS[profile.workoutType] || profile.workoutType;

  const prompt = `Eres un entrenador personal certificado. Genera una rutina semanal completa en español.

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

  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        res.write(chunk.delta.text);
      }
    }
    res.end();
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar la rutina.' });
    }
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
