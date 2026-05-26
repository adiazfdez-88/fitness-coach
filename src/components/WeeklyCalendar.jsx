import './WeeklyCalendar.css';

const ALL_DAYS = [
  { id: 'Lunes',     short: 'LUN', num: '1' },
  { id: 'Martes',    short: 'MAR', num: '2' },
  { id: 'Miércoles', short: 'MIÉ', num: '3' },
  { id: 'Jueves',    short: 'JUE', num: '4' },
  { id: 'Viernes',   short: 'VIE', num: '5' },
  { id: 'Sábado',    short: 'SÁB', num: '6' },
  { id: 'Domingo',   short: 'DOM', num: '7' },
];

const LOCATION_ICONS = {
  gimnasio:   '🏋️',
  calistenia: '💪',
  casa:       '🏠',
  mixto:      '⚡',
  cardio:     '🏃',
};

const LOCATION_LABELS = {
  gimnasio:   'Gimnasio',
  calistenia: 'Calistenia',
  casa:       'Casa',
  mixto:      'Mixto',
  cardio:     'Cardio / Running',
};

export default function WeeklyCalendar({
  selectedDays,
  onChange,
  onNewWeek,
  workoutTypes = [],
  dayLocations = {},
  onLocationChange,
  loading = false,
  weekPlans = {},
}) {
  const toggleDay = (dayId) => {
    if (loading) return; // no cambiar días mientras genera
    const updated = selectedDays.includes(dayId)
      ? selectedDays.filter(d => d !== dayId)
      : [...selectedDays, dayId];
    onChange(updated);
  };

  return (
    <div className="calendar">
      <div className="calendar-grid">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const isDone    = isSelected && !!weekPlans[day.id];
          const isPending = isSelected && loading && !isDone;

          return (
            <div key={day.id} className="day-cell">
              <button
                type="button"
                className={[
                  'day-btn',
                  isSelected && !isDone ? 'day-btn--selected' : '',
                  isDone ? 'day-btn--done' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleDay(day.id)}
                title={isSelected ? `Quitar ${day.id}` : `Añadir ${day.id}`}
              >
                <span className="day-num">{day.num}</span>
                <span className="day-short">{day.short}</span>
                <span className="day-name">{day.id}</span>
                {isPending && <span className="day-dot day-dot--pulse" />}
                {isDone    && <span className="day-check">✓</span>}
                {isSelected && !isPending && !isDone && <span className="day-dot" />}
              </button>

              {/* Selector de ubicación (solo si perfil tiene >1 tipo) */}
              {isSelected && workoutTypes.length > 1 && (
                <div className="day-location">
                  {workoutTypes.map(type => {
                    const active = (dayLocations[day.id] || workoutTypes[0]) === type;
                    return (
                      <button
                        key={type}
                        className={`loc-btn ${active ? 'loc-btn--active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onLocationChange({ ...dayLocations, [day.id]: type }); }}
                        title={LOCATION_LABELS[type] || type}
                      >
                        {LOCATION_ICONS[type] || type}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-footer">
        <p className="calendar-hint">
          {selectedDays.length === 0
            ? 'Toca los días que vas a entrenar esta semana.'
            : `${selectedDays.length} día${selectedDays.length !== 1 ? 's' : ''}: ${selectedDays.join(', ')}`}
        </p>
        {selectedDays.length > 0 && (
          <button className="btn-new-week" onClick={onNewWeek}>
            🔄 Nueva semana
          </button>
        )}
      </div>
    </div>
  );
}
