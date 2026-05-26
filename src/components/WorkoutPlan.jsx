import { useState, useRef, useEffect } from 'react';
import './WorkoutPlan.css';

function YoutubeButton({ name }) {
  const query = encodeURIComponent(`${name} ejercicio forma correcta`);
  const url = `https://www.youtube.com/results?search_query=${query}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="yt-btn" title="Ver video en YouTube">
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      Ver video
    </a>
  );
}

function ExerciseCard({ exercise, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`ex-card${exercise.isKey ? ' ex-card--key' : ''}`}>
      <div className="ex-card-top">
        <span className="ex-num">{index + 1}</span>
        <div className="ex-body">
          <div className="ex-name-row">
            <span className="ex-name">{exercise.name}</span>
            {exercise.isKey && <span className="badge-key">CLAVE</span>}
            <YoutubeButton name={exercise.name} />
          </div>
          <div className="ex-stats">
            <span className="ex-pill">{exercise.sets} series × {exercise.reps}</span>
            <span className="ex-rest">· Descanso {exercise.rest}</span>
          </div>
          {exercise.why && (
            <p className="ex-why"><span className="ex-why-dot" />  {exercise.why}</p>
          )}
        </div>
      </div>
      {exercise.technique && (
        <>
          <button className="ex-tech-toggle" onClick={() => setExpanded(v => !v)}>
            <span>Técnica</span>
            <span className={`ex-chevron${expanded ? ' ex-chevron--open' : ''}`}>›</span>
          </button>
          {expanded && <div className="ex-tech-body">{exercise.technique}</div>}
        </>
      )}
    </div>
  );
}

function SimpleCard({ exercise, variant }) {
  return (
    <div className={`simple-card simple-card--${variant}`}>
      <div className="simple-row">
        <span className="simple-name">{exercise.name}</span>
        <span className="simple-duration">
          {exercise.duration || (exercise.sets ? `${exercise.sets}×${exercise.reps}` : '')}
        </span>
        <YoutubeButton name={exercise.name} />
      </div>
      {exercise.why && (
        <p className="ex-why"><span className="ex-why-dot" />  {exercise.why}</p>
      )}
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="sec-header">
      <span className="sec-icon">{icon}</span>
      <span className="sec-title">{title}</span>
      <div className="sec-line" />
    </div>
  );
}

function DayPlan({ plan }) {
  return (
    <div className="day-plan">
      <div className="day-hero">
        <p className="day-hero-label">Día de entrenamiento</p>
        <h2 className="day-hero-name">{plan.day}</h2>
        {plan.muscleGroup && (
          <p className="day-hero-group">{plan.muscleGroup}</p>
        )}
      </div>

      {plan.warmup?.length > 0 && (
        <div className="ex-section">
          <SectionHeader title="Calentamiento" icon="🔥" />
          {plan.warmup.map((ex, i) => <SimpleCard key={i} exercise={ex} variant="warmup" />)}
        </div>
      )}

      {plan.main?.length > 0 && (
        <div className="ex-section">
          <SectionHeader title="Bloque principal" icon="🏋️" />
          {plan.main.map((ex, i) => <ExerciseCard key={i} exercise={ex} index={i} />)}
        </div>
      )}

      {plan.core?.length > 0 && (
        <div className="ex-section">
          <SectionHeader title="Core / Abdomen" icon="⚡" />
          {plan.core.map((ex, i) => <ExerciseCard key={i} exercise={ex} index={i} />)}
        </div>
      )}

      {plan.cooldown?.length > 0 && (
        <div className="ex-section">
          <SectionHeader title="Vuelta a la calma" icon="🧘" />
          {plan.cooldown.map((ex, i) => <SimpleCard key={i} exercise={ex} variant="cooldown" />)}
        </div>
      )}

      {plan.weekTip && (
        <div className="week-tip">
          <p className="week-tip-label">Recomendaciones para la semana</p>
          <p className="week-tip-text">{plan.weekTip}</p>
        </div>
      )}
    </div>
  );
}

const TODAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getTodayIdx(plans) {
  const today = TODAY_NAMES[new Date().getDay()];
  const idx = plans.findIndex(p => p.day === today);
  return idx !== -1 ? idx : 0;
}

const LOCATION_ICONS = { gimnasio: '🏋️', calistenia: '💪', casa: '🏠', mixto: '⚡', cardio: '🏃', fuerza_cardio: '🔥' };

export default function WorkoutPlan({ plans, dayLocations = {}, workoutTypes = [] }) {
  const [activeIdx, setActiveIdx] = useState(() => getTodayIdx(plans));
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    setActiveIdx(getTodayIdx(plans));
  }, [plans.length]);

  if (!plans?.length) return null;

  const activePlan = plans[activeIdx] ?? plans[0];

  return (
    <div className="workout-plan" ref={ref}>
      {plans.length > 1 && (
        <div className="day-tabs">
          {plans.map((plan, i) => {
            const loc = dayLocations[plan.day] || workoutTypes[0];
            const locIcon = LOCATION_ICONS[loc] || '';
            return (
              <button
                key={i}
                className={`day-tab${i === activeIdx ? ' day-tab--active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <span className="day-tab-name">{plan.day} {locIcon}</span>
                {plan.muscleGroup && (
                  <span className="day-tab-group">
                    {plan.muscleGroup.split('—')[0].trim()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <DayPlan plan={activePlan} />
    </div>
  );
}
