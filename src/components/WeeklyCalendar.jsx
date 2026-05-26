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
};

const LOCATION_LABELS = {
  gimnasio:   'Gimnasio',
  calistenia: 'Calistenia',
  casa:       'Casa',
  mixto:      'Mixto',
};

export default function WeeklyCalendar({
  selectedDays,
  onChange,
  dayStatuses,
  onMarkStatus,
  onNewWeek,
  workoutTypes = [],
  dayLocations = {},
  onLocationChange,
}) {
  // Ciclo: no seleccionado → seleccionado (verde) → fallado (rojo) → no seleccionado
  const handleDayClick = (dayId) => {
    const isSelected = selectedDays.includes(dayId);
    const status = dayStatuses[dayId];

    if (!isSelected) {
      // Añadir al plan
      onChange([...selectedDays, dayId]);
      onMarkStatus(dayId, null);
    } else if (!status || status === 'completed') {
      // Marcar como fallado
      onMarkStatus(dayId, 'missed');
    } else {
      // Quitar del plan
      onChange(selectedDays.filter(d => d !== dayId));
      onMarkStatus(dayId, null);
    }
  };

  const selectedCount = selectedDays.length;
  const hasMissed = selectedDays.some(d => dayStatuses[d] === 'missed');

  return (
    <div className="calendar">
      <div className="calendar-grid">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const status = dayStatuses[day.id];
          const isMissed = isSelected && status === 'missed';

          return (
            <div key={day.id} className="day-cell">
              <button
                type="button"
                className={[
                  'day-btn',
                  isSelected && !isMissed ? 'day-btn--selected' : '',
                  isMissed ? 'day-btn--missed' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(day.id)}
                title={
                  !isSelected ? `Añadir ${day.id}`
                  : !isMissed  ? `Marcar ${day.id} como fallado`
                  : `Quitar ${day.id} del plan`
                }
              >
                <span className="day-num">{day.num}</span>
                <span className="day-short">{day.short}</span>
                <span className="day-name">{day.id}</span>
                {isSelected && !isMissed && <span className="day-dot" />}
                {isMissed && <span className="day-icon">❌</span>}
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
          {selectedCount === 0
            ? 'Toca un día para añadirlo. Tócalo de nuevo para marcarlo como fallado.'
            : `${selectedCount} día${selectedCount !== 1 ? 's' : ''}: ${selectedDays.join(', ')}`}
        </p>
        {hasMissed && (
          <button className="btn-new-week" onClick={onNewWeek}>
            🔄 Nueva semana
          </button>
        )}
      </div>
    </div>
  );
}
