import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './AuthScreen.css';

export default function AuthScreen() {
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
      else setMessage('¡Cuenta creada! Revisa tu email para confirmarla, luego inicia sesión.');
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-hero">
          <span className="auth-emoji">💪</span>
          <h1>FitCoach AI</h1>
          <p>Tu entrenador personal con inteligencia artificial</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>

          <label className="auth-label">
            Email
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            Contraseña
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && <p className="auth-error">⚠️ {error}</p>}
          {message && <p className="auth-message">✅ {message}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button className="auth-toggle" onClick={toggleMode}>
          {mode === 'login'
            ? '¿No tienes cuenta? Regístrate gratis'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
