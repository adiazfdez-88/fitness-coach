import UserProfile from './UserProfile';
import './WelcomeScreen.css';

const REQUIRED_FIELDS = (p) =>
  p.name && p.age && p.weight && p.height &&
  p.goals?.trim() && p.equipment?.length > 0 &&
  p.level && p.sessionTime && p.workoutTypes?.length > 0;

export default function WelcomeScreen({ profile, onChange, onStart }) {
  const ready = REQUIRED_FIELDS(profile);

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="welcome-hero">
          <span className="welcome-emoji">💪</span>
          <h1>FitCoach AI</h1>
          <p>Tu entrenador personal con inteligencia artificial</p>
        </div>

        <div className="welcome-features">
          <div className="wf-item"><span>🎯</span> Rutina semanal personalizada</div>
          <div className="wf-item"><span>🎬</span> Video de YouTube por ejercicio</div>
          <div className="wf-item"><span>📅</span> Calendario con seguimiento diario</div>
          <div className="wf-item"><span>💾</span> Perfil guardado automáticamente</div>
        </div>

        <div className="welcome-form-section">
          <h2>Completa tu perfil para comenzar</h2>
          <p className="welcome-form-sub">
            Toda la información es usada para generar tu rutina — cuanto más detallada sea, mejor será el plan.
          </p>
          <UserProfile profile={profile} onChange={onChange} />
        </div>

        <div className="welcome-cta">
          <button
            className="btn-start"
            onClick={onStart}
            disabled={!ready}
          >
            Comenzar mi rutina →
          </button>
          {!ready && (
            <p className="welcome-hint">
              Completa nombre, medidas, nivel, tiempo por sesión, objetivos y equipamiento
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
