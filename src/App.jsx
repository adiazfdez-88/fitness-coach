import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import WelcomeScreen from './components/WelcomeScreen';
import ProfilePanel from './components/ProfilePanel';
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

const BATCH_SIZE = 2;

export default function App() {
  const [rawProfile, setProfile] = useLocalStorage('fitcoach_profile', EMPTY_PROFILE);
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

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  // Group selected days into batches of BATCH_SIZE
  const dayBatches = [];
  for (let i = 0; i < selectedDays.length; i += BATCH_SIZE) {
    dayBatches.push(selectedDays.slice(i, i + BATCH_SIZE));
  }
  const totalBatches = dayBatches.length;
  const allGenerated = batches.length >= totalBatches;
  const routine = batches.length > 0 ? batches.join('\n\n---\n\n') : null;
  const nextBatchDays = !allGenerated ? dayBatches[batches.length] : null;

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

  const generateBatch = async (batchIdx) => {
    const days = dayBatches[batchIdx];
    const isLastBatch = batchIdx === totalBatches - 1;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { ...profile, equipment: profile.equipment.join(', ') },
          days,
          isLastBatch,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBatches((prev) => [...prev, data.content]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRoutine = () => {
    setBatches([]);
    // Use setTimeout(0) so batches resets before generateBatch reads dayBatches[0]
    setTimeout(() => generateBatch(0), 0);
  };

  const generateNextBatch = () => generateBatch(batches.length);

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
            {loading && batches.length === 0 ? (
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

          {loading && batches.length === 0 && (
            <p className="generating-text">
              Generando {dayBatches[0]?.join(' y ')}… esto tarda unos segundos.
            </p>
          )}

          {error && <div className="error-msg">⚠️ {error}</div>}
        </div>

        {routine && (
          <>
            <section className="section-card">
              <h2 className="section-title">
                <span className="icon">🏋️</span>
                Tu Rutina Semanal
                {!allGenerated && (
                  <span className="section-badge">
                    {batches.length}/{totalBatches} bloques
                  </span>
                )}
              </h2>
              <WorkoutPlan routine={routine} />
            </section>

            {!allGenerated && (
              <div className="generate-section">
                <button
                  className="btn-generate"
                  onClick={generateNextBatch}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="generating-spinner">⚙️</span>
                      Generando {nextBatchDays?.join(' y ')}...
                    </>
                  ) : (
                    `📅 Generar ${nextBatchDays?.join(' y ')} →`
                  )}
                </button>
                {loading && (
                  <p className="generating-text">
                    Generando {nextBatchDays?.join(' y ')}… esto tarda unos segundos.
                  </p>
                )}
              </div>
            )}
          </>
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
