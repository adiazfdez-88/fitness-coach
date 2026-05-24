import './UserProfile.css';

const EQUIPMENT_OPTIONS = [
  'Solo peso corporal',
  'Mancuernas',
  'Barra y discos',
  'Máquinas de gimnasio (completo)',
  'Bandas elásticas',
  'Kettlebells',
  'TRX / suspensión',
  'Barra de dominadas',
  'Banco',
  'Cajón pliométrico',
];

const SESSION_TIMES = [
  '30 minutos',
  '45 minutos',
  '60 minutos',
  '75 minutos',
  '90 minutos',
  '2 horas o más',
];

const WORKOUT_TYPES = [
  { id: 'gimnasio', label: '🏋️ Gimnasio con máquinas' },
  { id: 'calistenia', label: '💪 Calistenia / peso corporal' },
  { id: 'casa', label: '🏠 Casa con mancuernas' },
  { id: 'mixto', label: '⚡ Mixto (gimnasio + calistenia)' },
];

export default function UserProfile({ profile, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...profile, [field]: value });
  };

  const toggleChip = (field, item) => {
    const current = profile[field] || [];
    const updated = current.includes(item)
      ? current.filter((v) => v !== item)
      : [...current, item];
    handleChange(field, updated);
  };

  return (
    <div className="profile-form">
      <div className="profile-row">
        <div className="form-group">
          <label htmlFor="p-name">Nombre</label>
          <input
            id="p-name"
            type="text"
            placeholder="Tu nombre"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="p-age">Edad</label>
          <input
            id="p-age"
            type="number"
            placeholder="—"
            min="10"
            max="100"
            value={profile.age}
            onChange={(e) => handleChange('age', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="p-weight">Peso (kg)</label>
          <input
            id="p-weight"
            type="number"
            placeholder="—"
            min="30"
            max="300"
            value={profile.weight}
            onChange={(e) => handleChange('weight', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="p-height">Estatura (cm)</label>
          <input
            id="p-height"
            type="number"
            placeholder="—"
            min="100"
            max="250"
            value={profile.height}
            onChange={(e) => handleChange('height', e.target.value)}
          />
        </div>
      </div>

      <div className="profile-row profile-row--2">
        <div className="form-group">
          <label htmlFor="p-level">Nivel de experiencia</label>
          <select
            id="p-level"
            value={profile.level}
            onChange={(e) => handleChange('level', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="Principiante">Principiante (menos de 6 meses)</option>
            <option value="Intermedio">Intermedio (6 meses – 2 años)</option>
            <option value="Avanzado">Avanzado (más de 2 años)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="p-days">Días disponibles por semana</label>
          <select
            id="p-days"
            value={profile.daysPerWeek}
            onChange={(e) => handleChange('daysPerWeek', e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n} día{n !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Tiempo disponible por sesión</label>
        <div className="chip-group">
          {SESSION_TIMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${profile.sessionTime === t ? 'chip--active' : ''}`}
              onClick={() => handleChange('sessionTime', profile.sessionTime === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Tipo de entrenamiento</label>
        <div className="chip-group">
          {WORKOUT_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              className={`chip chip--wide ${profile.workoutType === wt.id ? 'chip--active' : ''}`}
              onClick={() => handleChange('workoutType', profile.workoutType === wt.id ? '' : wt.id)}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="p-goals">Objetivos — escribe exactamente lo que quieres lograr</label>
        <textarea
          id="p-goals"
          placeholder="Ej: brazos más fuertes, pecho definido, perder grasa abdominal, mejorar postura, correr 5km sin cansarme..."
          value={profile.goals}
          onChange={(e) => handleChange('goals', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Equipamiento disponible</label>
        <div className="chip-group">
          {EQUIPMENT_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`chip ${(profile.equipment || []).includes(item) ? 'chip--active' : ''}`}
              onClick={() => toggleChip('equipment', item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="p-injuries">Lesiones / Limitaciones físicas</label>
        <textarea
          id="p-injuries"
          placeholder="Describe cualquier lesión, dolor crónico o limitación. Ej: hernia discal L5-S1, rodilla operada, dolor lumbar. Si no tienes ninguna, escribe 'Sin lesiones'."
          value={profile.injuries}
          onChange={(e) => handleChange('injuries', e.target.value)}
        />
      </div>
    </div>
  );
}
