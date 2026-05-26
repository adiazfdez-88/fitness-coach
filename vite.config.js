import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const WORKOUT_TYPE_LABELS = {
  gimnasio:   'Gimnasio completo (máquinas, cables, barras, mancuernas)',
  calistenia: 'Calistenia (SOLO peso corporal)',
  casa:       'Casa con mancuernas (mancuernas + peso corporal)',
  mixto:      'Mixto (gimnasio + calistenia)',
}

function buildInjuryNote(injuries) {
  if (!injuries?.trim()) return ''
  const t = injuries.toLowerCase()
  const lumbar = t.includes('l4') || t.includes('l5') || t.includes('s1') ||
    t.includes('lumbar') || t.includes('hernia') || t.includes('disco') ||
    t.includes('espalda baja') || t.includes('lumbago')
  const coreRule = lumbar
    ? ' Core: SOLO plancha en codos, dead bug, bird dog. PROHIBIDO crunches/sit-ups.'
    : ''
  return `⚠️ LESIONES: "${injuries}". Adapta todos los ejercicios.${coreRule}\n\n`
}

function extractJSON(text) {
  try { return JSON.parse(text) } catch {}
  const stripped = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  try { return JSON.parse(stripped) } catch {}
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }
  return null
}

function buildPrompt(profile, day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary) {
  const workoutLabel = WORKOUT_TYPE_LABELS[profile.workoutType] || profile.workoutType
  const typeRule = profile.workoutType === 'calistenia'
    ? 'SOLO peso corporal, sin equipamiento externo.'
    : `Equipamiento: ${workoutLabel}.`
  const injuryNote = buildInjuryNote(profile.injuries)

  const lastWeekSection = lastWeekSummary
    ? `SEMANA ANTERIOR (para continuidad y progresión):\n${lastWeekSummary}\n\n`
    : ''
  const groupSection = assignedGroup
    ? `GRUPO MUSCULAR PARA HOY: ${assignedGroup}\nEl campo "muscleGroup" debe reflejar exactamente este grupo.\n\n`
    : ''
  const avoidSection = usedExercises?.length
    ? `EJERCICIOS YA USADOS ESTA SEMANA — NO REPETIR NINGUNO:\n${usedExercises.join(', ')}\n\n`
    : ''
  const weekSection = allDays?.length > 1
    ? `SEMANA (${allDays.length} días: ${allDays.join(', ')})\n\n`
    : ''

  return `Eres un entrenador personal experto. Genera la rutina de ${day} en español.

${weekSection}${groupSection}${avoidSection}${lastWeekSection}${injuryNote}Perfil: ${profile.name}, ${profile.age}a, ${profile.weight}kg, ${profile.height}cm | Nivel: ${profile.level} | Sesión: ${profile.sessionTime} | Objetivos: ${profile.goals} | ${typeRule}

Responde ÚNICAMENTE con un objeto JSON válido. Sin texto antes ni después. Sin bloques markdown. Solo el JSON puro.

Estructura exacta:
{
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
- Nivel de dificultad: ${profile.level}
- NO incluyas URLs en el JSON`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-handler',
        configureServer(server) {
          server.middlewares.use('/api/generate-routine', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200)
              res.end()
              return
            }
            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', async () => {
              try {
                const { profile, day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary } = JSON.parse(body)
                const { default: Anthropic } = await import('@anthropic-ai/sdk')
                const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

                const message = await anthropic.messages.create({
                  model: 'claude-sonnet-4-6',
                  max_tokens: 2500,
                  temperature: 0.3,
                  messages: [{ role: 'user', content: buildPrompt(profile, day, allDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary) }],
                })

                const raw = message.content[0].text
                const plan = extractJSON(raw)
                if (!plan) {
                  console.error('JSON parse error. Raw:', raw.substring(0, 600))
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ error: 'La IA no devolvió un formato válido. Inténtalo de nuevo.' }))
                  return
                }

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ content: plan }))
              } catch (err) {
                console.error('API error:', err)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: err.message || 'Error al generar la rutina.' }))
              }
            })
          })
        },
      },
    ],
  }
})
