import { useState } from 'react';
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

const STATUS_LABEL = {
  completed: { label: 'Completado', cls: 'status--completed', icon: '✅' },
  missed:    { label: 'Fallado',    cls: 'status--missed',    icon: '❌' },
};

export default function WeeklyCalendar({
  selectedDays,
  onChange,
  dayStatuses,
  reschedules,
  onMarkStatus,
  onReschedule,
  onNewWeek,
}) {
  const [rescheduleOpen, setRescheduleOpen] = useState(null); // dayId being rescheduled

  const toggleDay = (dayId) => {
    const updated = selectedDays.includes(dayId)
      ? selectedDays.filter((d) => d !== dayId)
      : [...selectedDays, dayId];
    onChange(updated);
  };

  const handleMarkStatus = (dayId, status) => {
    const current = dayStatuses[dayId];
    // toggle off if already set
    if (current === status) {
      onMarkStatus(dayId, null);
      if (status === 'missed') {
        // clear any reschedule for this day
        const updated = { ...reschedules };
        delete updated[dayId];
        onReschedule(updated);
        setRescheduleOpen(null);
      }
    } else {
      onMarkStatus(dayId, status);
      if (status === 'missed') {
        setRescheduleOpen(dayId);
      } else {
        // if changing from missed to completed, clear reschedule
        const updated = { ...reschedules };
        delete updated[dayId];
        onReschedule(updated);
        setRescheduleOpen(null);
      }
    }
  };

  const handleReschedule = (fromDay, toDay) => {
    const updated = { ...reschedules, [fromDay]: toDay };
    onReschedule(updated);
    setRescheduleOpen(null);
  };

  // Days already used as reschedule targets
  const rescheduledTo = new Set(Object.values(reschedules));

  // Days available to reschedule a missed session to
  const availableForReschedule = ALL_DAYS
    .map((d) => d.id)
    .filter((d) => !selectedDays.includes(d) && !rescheduledTo.has(d));

  const selectedCount = selectedDays.length;

  return (
    <div className="calendar">
      <div className="calendar-grid">
        {ALL_DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const status = dayStatuses[day.id]; // 'completed' | 'missed' | null
          const isRescheduleTo = rescheduledTo.has(day.id);
          const rescheduleFrom = Object.entries(reschedules).find(([, to]) => to === day.id)?.[0];

          return (
            <div key={day.id} className="day-cell">
              <button
                type="button"
                className={[
                  'day-btn',
                  isSelected ? 'day-btn--selected' : '',
                  isSelected && status === 'completed' ? 'day-btn--completed' : '',
                  isSelected && status === 'missed' ? 'day-btn--missed' : '',
                  isRescheduleTo ? 'day-btn--rescheduled' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleDay(day.id)}
                title={
                  isRescheduleTo
                    ? `Sesión reprogramada (de ${rescheduleFrom})`
                    : isSelected ? `Quitar ${day.id}` : `Añadir ${day.id}`
                }
              >
                <span className="day-num">{day.num}</span>
                <span className="day-short">{day.short}</span>
                <span className="day-name">{day.id}</span>
                {isSelected && !status && <span className="day-dot" />}
                {isSelected && status && (
                  <span className="day-icon">{STATUS_LABEL[status].icon}</span>
                )}
                {isRescheduleTo && <span className="day-reschedule-badge">↩</span>}
              </button>

              {/* Status controls for selected days */}
              {isSelected && (
                <div className="day-controls">
                  <button
                    className={`ctrl-btn ctrl-done ${status === 'completed' ? 'ctrl-btn--on' : ''}`}
                    onClick={() => handleMarkStatus(day.id, 'completed')}
                    title="Marcar como completado"
                  >✓</button>
                  <button
                    className={`ctrl-btn ctrl-miss ${status === 'missed' ? 'ctrl-btn--on' : ''}`}
                    onClick={() => handleMarkStatus(day.id, 'missed')}
                    title="Marcar como fallado"
                  >✗</button>
                </div>
              )}

              {/* Reschedule picker */}
              {status === 'missed' && rescheduleOpen === day.id && availableForReschedule.length > 0 && (
                <div className="reschedule-picker">
                  <span className="reschedule-label">Mover a:</span>
                  {availableForReschedule.map((d) => (
                    <button
                      key={d}
                      className="reschedule-day-btn"
                      onClick={() => handleReschedule(day.id, d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {/* Show reschedule target */}
              {status === 'missed' && reschedules[day.id] && (
                <div className="reschedule-info">
                  ↩ {reschedules[day.id]}
                  <button
                    className="reschedule-clear"
                    onClick={() => {
                      const updated = { ...reschedules };
                      delete updated[day.id];
                      onReschedule(updated);
                    }}
                    title="Quitar reprogramación"
                  >✕</button>
                </div>
              )}

              {/* Rescheduled-to info */}
              {isRescheduleTo && (
                <div className="rescheduled-from-info">
                  de {rescheduleFrom}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-footer">
        <p className="calendar-hint">
          {selectedCount === 0
            ? 'Selecciona los días que entrenas. Usa ✓/✗ para marcar completados o fallados.'
            : `${selectedCount} día${selectedCount !== 1 ? 's' : ''}: ${selectedDays.join(', ')}`}
        </p>
        {Object.keys(dayStatuses).some((k) => dayStatuses[k]) && (
          <button className="btn-new-week" onClick={onNewWeek}>
            🔄 Nueva semana
          </button>
        )}
      </div>
    </div>
  );
}
