import { useState } from 'react';
import { supabase } from '../lib/supabase';
import heroImg from '../assets/hero.png';
import './AuthScreen.css';

function LandingPage({ onStart }) {
  return (
    <div className="landing">

      {/* Hero: imagen de fondo con todo encima */}
      <div className="landing-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="landing-hero-overlay" />

        {/* Header encima de la foto */}
        <div className="landing-header">
          <div className="landing-logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="10" r="5" fill="currentColor"/>
              <path d="M14 22c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M24 22v14M17 28l-5 6M31 28l5 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <path d="M8 20h6M34 20h6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="landing-title">
            <span className="landing-title-dark">FitCoach</span> <span className="landing-title-green">AI</span>
          </h1>
          <div className="landing-tagline-row">
            <span className="landing-line" />
            <span className="landing-tagline">Fuerza para toda la vida</span>
            <span className="landing-line" />
          </div>
        </div>

        {/* Badge top right */}
        <div className="landing-badge landing-badge--tr">
          <span className="badge-icon">🧠</span>
          <div>
            <div className="badge-title">Plan adaptado por IA</div>
            <div className="badge-sub">✓ Tu historial</div>
            <div className="badge-sub">✓ Tus lesiones</div>
            <div className="badge-sub">✓ Tu progreso</div>
          </div>
        </div>

        {/* Badge bottom left */}
        <div className="landing-badge landing-badge--bl">
          <span className="badge-dot" />
          <div>
            <div className="badge-title">Hombro</div>
            <div className="badge-tag">✓ Protegido</div>
          </div>
        </div>

        {/* Badge bottom right */}
        <div className="landing-badge landing-badge--br">
          <span className="badge-dot badge-dot--green" />
          <div>
            <div className="badge-title">Espalda</div>
            <div className="badge-tag">✓ Alineada</div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="landing-features">
        {[
          { icon: '🛡️', label: 'Entrenos seguros' },
          { icon: '🎯', label: 'Adaptado a ti' },
          { icon: '📈', label: 'Progreso real' },
          { icon: '❤️', label: 'Largo plazo' },
        ].map(f => (
          <div key={f.label} className="landing-feat">
            <span className="feat-icon">{f.icon}</span>
            <span className="feat-label">{f.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="landing-cta">
        <button className="btn-comenzar" onClick={onStart}>Comenzar</button>
        <p className="landing-slogan">Tu cuerpo. Tu historial. <strong>Tu plan.</strong></p>
      </div>
    </div>
  );
}

function AuthForm({ onBack }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Email o contraseña incorrectos.');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('¡Cuenta creada! Revisa tu email para confirmarla.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="auth-form-screen">
      <button className="auth-back" onClick={onBack}>← Volver</button>

      <div className="auth-form-card">
        <h2 className="auth-form-title">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        <button className="auth-google-btn" onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="auth-divider"><span>o</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="auth-label">
            Contraseña
            <input type="password" placeholder="Mínimo 6 caracteres" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {error   && <p className="auth-error">⚠️ {error}</p>}
          {message && <p className="auth-message">✅ {message}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button className="auth-toggle" onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}>
          {mode === 'login' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const [showAuth, setShowAuth] = useState(false);
  return showAuth
    ? <AuthForm onBack={() => setShowAuth(false)} />
    : <LandingPage onStart={() => setShowAuth(true)} />;
}
