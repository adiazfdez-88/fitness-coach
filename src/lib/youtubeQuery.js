/**
 * buildYoutubeQuery
 * Construye un query de búsqueda de YouTube para un ejercicio,
 * adaptado al perfil del usuario (edad y lesiones).
 *
 * Para añadir nuevas condiciones: agrega una entrada a INJURY_MAP.
 * Para ajustar rangos de edad: modifica AGE_MAP.
 */

// ── Mapeo lesiones/condiciones → términos en inglés ──────────────────────────
// Cada entrada tiene:
//   keywords: palabras que se buscan en el campo injuries del perfil (minúsculas)
//   terms:    modificadores que se añaden al query de YouTube
const INJURY_MAP = [
  {
    keywords: ['lumbar', 'l4', 'l5', 's1', 'hernia', 'disco', 'espalda baja', 'lumbago', 'columna'],
    terms: ['spine safe', 'lower back friendly'],
  },
  {
    keywords: ['hombro', 'impingement', 'manguito', 'rotador', 'bursitis', 'supraspinoso'],
    terms: ['shoulder safe', 'rotator cuff friendly'],
  },
  {
    keywords: ['rodilla', 'menisco', 'meniscopatía', 'ligamento', 'cruzado', 'condromalacia'],
    terms: ['knee friendly', 'low impact'],
  },
  {
    keywords: ['cadera', 'displasia', 'coxartrosis', 'iliopsoas'],
    terms: ['hip friendly'],
  },
  {
    keywords: ['muñeca', 'carpo', 'túnel carpiano', 'epicondilitis', 'codo'],
    terms: ['wrist friendly'],
  },
  {
    keywords: ['cervical', 'cuello', 'cervicalgia', 'tortícolis'],
    terms: ['neck safe'],
  },
  {
    keywords: ['tobillo', 'fascitis', 'plantar', 'aquiles'],
    terms: ['low impact', 'ankle friendly'],
  },
];

// ── Mapeo de edad → términos ──────────────────────────────────────────────────
// Se aplica el primer rango que coincida (de más específico a menos).
const AGE_MAP = [
  { minAge: 65, terms: ['over 65', 'older adults'] },
  { minAge: 60, terms: ['over 60', 'seniors'] },
  { minAge: 50, terms: ['over 50', 'seniors'] },
];

// ── Función principal ─────────────────────────────────────────────────────────
export function buildYoutubeQuery(exerciseName, profile = {}) {
  const modifiers = new Set();
  const age = parseInt(profile.age, 10);
  const injuries = (profile.injuries || '').toLowerCase();

  // 1. Modificadores por edad
  if (!isNaN(age)) {
    for (const { minAge, terms } of AGE_MAP) {
      if (age >= minAge) {
        terms.forEach(t => modifiers.add(t));
        break; // solo el rango más específico
      }
    }
  }

  // 2. Modificadores por lesiones
  for (const { keywords, terms } of INJURY_MAP) {
    if (keywords.some(k => injuries.includes(k))) {
      terms.forEach(t => modifiers.add(t));
    }
  }

  // 3. Construir query final
  const parts = [
    exerciseName,
    'ejercicio forma correcta',
    ...modifiers,
  ];

  return encodeURIComponent(parts.join(' '));
}
