import { useEffect } from 'react';
import UserProfile from './UserProfile';
import './ProfilePanel.css';

export default function ProfilePanel({ profile, onChange, onClose, apiKey, onApiKeyChange }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="profile-panel" aria-label="Editar perfil">
        <div className="panel-header">
          <h2>Editar perfil</h2>
          <button className="panel-close" onClick={onClose} aria-label="Cerrar panel">✕</button>
        </div>
        <div className="panel-body">
          <div className="profile-form" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="panel-api-key">API Key de Anthropic</label>
              <input
                id="panel-api-key"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value.trim())}
                autoComplete="off"
                spellCheck={false}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #888)', marginTop: '0.25rem', display: 'block' }}>
                Guardada solo en este navegador (localStorage)
              </span>
            </div>
          </div>
          <UserProfile profile={profile} onChange={onChange} />
        </div>
        <div className="panel-footer">
          <span className="autosave-note">✅ Cambios guardados automáticamente</span>
          <button className="btn-done" onClick={onClose}>Listo</button>
        </div>
      </aside>
    </>
  );
}
