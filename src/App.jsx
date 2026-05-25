import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import WelcomeScreen from './components/WelcomeScreen';
import ProfilePanel from './components/ProfilePanel';
import UserProfile from './components/UserProfile';
import WeeklyCalendar from './components/WeeklyCalendar';
import WorkoutPlan from './components/WorkoutPlan';
import './App.css';

const EMPTY_PROFILE = {
  name: '',
  age: '',
  weight: '',
  height: '',
  injuries: '',
  goals: '',
  equipment: [],
  level: '',
  daysPerWeek: '',
  sessionTime: '',
  workoutType: '',
};

export default function App() {
  const [rawProfile, setProfile] = useLocalStorage('fitcoach_profile', EMPTY_PROFILE);
  // Normalize synchronously: migrate legacy format where goals was an array
  const profile = {
    ...EMPTY_PROFILE,
    ...rawProfile,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals.join(', ') : (rawProfile.goals ?? ''),
    workoutType: rawProfile.workoutType ?? '',
  };
  const [selectedDays, setSelectedDays] = useLocalStorage('fitcoach_days', []);
  const [dayStatuses, setDayStatuses] = useLocalStorage('fitcoach_day_statuses', {});
  const [reschedules, setReschedules] = useLocalStorage('fitcoach_reschedules', {});
  const [onboarded, setOnboarded] = useLocalStorage('fitcoach_onboarded', false);

  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  const isFirstVisit = !onboarded;

  const canGenerate =
    profile.name &&
    profile.age &&
    profile.weight &&
    profile.height &&
    profile.goals?.trim() &&
    profile.equipment?.length > 0 &&
    profile.level &&
    profile.sessionTime &&
    profile.workoutType &&
    selectedDays.length > 0;

  const handleStart = () => setOnboarded(true);

  const handleMarkStatus = (dayId, status) => {
    setDayStatuses((prev) => {
      const updated = { ...prev };
      if (status === null) {
        delete updated[dayId];
      } else {
        updated[dayId] = status;
      }
      return updated;
    });
  };

  const handleNewWeek = () => {
    setDayStatuses({});
    setReschedules({});
  };

  const generateRoutine = async () => {
    setLoading(true);
    setError(null);
    setRoutine(null);

    const results = Array(selectedDays.length).fill(null);
    const flatProfile = { ...profile, equipment: profile.equipment.join(', ') };

    const updateDisplay = (completed) => {
      setLoadingStatus(`${completed} de ${selectedDays.length} días generados…`);
      // Show days in sequence order, up to the first gap
      let display = '';
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) break;
        display += (display ? '\n\n---\n\n' : '') + results[i];
      }
      if (display) setRoutine(display);
    };

    try {
      setLoadingStatus(`Generando ${selectedDays.length} días en paralelo…`);

      await Promise.all(
        selectedDays.map(async (day, i) => {
          const res = await fetch('/api/generate-routine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profile: flatProfile,
              day,
              dayIndex: i,
              totalDays: selectedDays.length,
              isLast: i === selectedDays.length - 1,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Error ${res.status} en ${day}`);
          }

          const data = await res.json();
          if (data.error) throw new Error(data.error);

          results[i] = data.content;
          const completed = results.filter((r) => r !== null).length;
          updateDisplay(completed);
        })
      );

      // Final display with all days in order
      setRoutine(results.join('\n\n---\n\n'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  if (isFirstVisit) {
    return (
      <WelcomeScreen
        profile={profile}
        onChange={setProfile}
        onStart={handleStart}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="header-logo">💪</span>
          <div>
            <h1 className="header-title">FitCoach AI</h1>
            {profile.name && (
              <span className="header-sub">Hola, {profile.name}</span>
            )}
          </div>
        </div>
        <button
          className="btn-edit-profile"
          onClick={() => setShowProfilePanel(true)}
        >
          ✏️ Editar perfil
        </button>
      </header>

      <main className="main">
        <section className="section-card">
          <h2 className="section-title">
            <span className="icon">📅</span>
            Días de entrenamiento
          </h2>
          <WeeklyCalendar
            selectedDays={selectedDays}
            onChange={setSelectedDays}
            dayStatuses={dayStatuses}
            reschedules={reschedules}
            onMarkStatus={handleMarkStatus}
            onReschedule={setReschedules}
            onNewWeek={handleNewWeek}
          />
        </section>

        <div className="generate-section">
          <button
            className="btn-generate"
            onClick={generateRoutine}
            disabled={!canGenerate || loading}
          >
            {loading ? (
              <>
                <span className="generating-spinner">⚙️</span>
                Generando rutina...
              </>
            ) : (
              '✨ Generar Rutina Semanal'
            )}
          </button>

          {!canGenerate && !loading && (
            <p className="generating-text">
              {selectedDays.length === 0
                ? 'Selecciona al menos un día de entrenamiento'
                : 'Perfil incompleto — haz clic en "Editar perfil" para completarlo'}
            </p>
          )}

          {loading && (
            <p className="generating-text">
              {loadingStatus || 'Diseñando tu rutina personalizada…'}
            </p>
          )}

          {error && <div className="error-msg">⚠️ {error}</div>}
        </div>

        {routine && (
          <section className="section-card">
            <h2 className="section-title">
              <span className="icon">🏋️</span>
              Tu Rutina Semanal
            </h2>
            <WorkoutPlan routine={routine} />
          </section>
        )}
      </main>

      <footer className="footer">
        FitCoach AI &mdash; Powered by Claude Sonnet
      </footer>

      {showProfilePanel && (
        <ProfilePanel
          profile={profile}
          onChange={setProfile}
          onClose={() => setShowProfilePanel(false)}
        />
      )}
    </div>
  );
}
