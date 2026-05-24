import { useEffect } from 'react';
import UserProfile from './UserProfile';
import './ProfilePanel.css';

export default function ProfilePanel({ profile, onChange, onClose }) {
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
