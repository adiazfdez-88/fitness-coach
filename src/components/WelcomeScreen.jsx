import UserProfile from './UserProfile';
import './WelcomeScreen.css';

const REQUIRED_FIELDS = (p) =>
  p.name && p.age && p.weight && p.height &&
  p.goals?.trim() && p.equipment?.length > 0 &&
  p.level && p.sessionTime && p.workoutType;

export default function WelcomeScreen({ profile, onChange, onStart, apiKey, onApiKeyChange }) {
  const ready = REQUIRED_FIELDS(profile) && apiKey.trim();

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
          <h2>API Key de Anthropic</h2>
          <p className="welcome-form-sub">
            Tu clave se guarda solo en este navegador (localStorage) y nunca sale de él.
            Obtenla en{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">
              console.anthropic.com
            </a>.
          </p>
          <div className="profile-form">
            <div className="form-group">
              <label htmlFor="welcome-api-key">API Key</label>
              <input
                id="welcome-api-key"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value.trim())}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
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
              {!apiKey.trim()
                ? 'Ingresa tu API Key de Anthropic para comenzar'
                : 'Completa nombre, medidas, nivel, tiempo por sesión, objetivos y equipamiento'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
