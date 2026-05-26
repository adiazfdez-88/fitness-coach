import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { generateDayPlan } from './lib/claude';
import { useLocalStorage } from './hooks/useLocalStorage';
import AuthScreen from './components/AuthScreen';
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
  workoutTypes: [],
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

function extractExercises(plan) {
  if (!plan || typeof plan !== 'object') return [];
  return [
    ...(plan.warmup || []),
    ...(plan.main || []),
    ...(plan.core || []),
    ...(plan.cooldown || []),
  ].map(e => e.name).filter(Boolean);
}

function getWeeklySplit(days) {
  const splits = {
    1: ['Cuerpo completo'],
    2: ['Empuje — Pecho + Hombros + Tríceps', 'Jalón — Espalda + Bíceps + Piernas'],
    3: ['Empuje — Pecho + Hombros + Tríceps', 'Jalón — Espalda + Bíceps', 'Piernas + Glúteos'],
    4: ['Empuje — Pecho + Tríceps', 'Jalón — Espalda + Bíceps', 'Piernas + Glúteos', 'Hombros + Core'],
    5: ['Pecho + Tríceps', 'Espalda + Bíceps', 'Piernas + Glúteos', 'Hombros + Core', 'Cuerpo completo'],
    6: ['Empuje — Pecho + Tríceps', 'Jalón — Espalda + Bíceps', 'Piernas + Glúteos', 'Hombros + Pecho', 'Espalda + Bíceps', 'Piernas + Core'],
  };
  const n = Math.min(days.length, 6);
  const splitList = splits[n] || splits[6];
  const result = {};
  days.forEach((day, i) => { result[day] = splitList[i % splitList.length]; });
  return result;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [rawProfile, setProfile] = useLocalStorage('fitcoach_profile', EMPTY_PROFILE);
  const profile = {
    ...EMPTY_PROFILE,
    ...rawProfile,
    goals: Array.isArray(rawProfile.goals) ? rawProfile.goals.join(', ') : (rawProfile.goals ?? ''),
    workoutTypes: Array.isArray(rawProfile.workoutTypes)
      ? rawProfile.workoutTypes
      : rawProfile.workoutType ? [rawProfile.workoutType] : [],
  };
  const [selectedDays, setSelectedDays] = useLocalStorage('fitcoach_days', []);
  const [dayStatuses, setDayStatuses] = useLocalStorage('fitcoach_day_statuses', {});
  const [reschedules, setReschedules] = useLocalStorage('fitcoach_reschedules', {});
  const [onboarded, setOnboarded] = useLocalStorage('fitcoach_onboarded', false);

  const [weekPlans, setWeekPlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const saveTimer = useRef(null);
  const isInit = useRef(true);

  async function loadUserData(currentUser) {
    isInit.current = true;
    setWeekPlans({});
    try {
      const { data: profileData } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.name || '',
          age: profileData.age?.toString() || '',
          weight: profileData.weight?.toString() || '',
          height: profileData.height?.toString() || '',
          injuries: profileData.injuries || '',
          goals: profileData.goals || '',
          equipment: profileData.equipment || [],
          level: profileData.level || '',
          daysPerWeek: profileData.days_per_week?.toString() || '',
          sessionTime: profileData.session_time || '',
          workoutTypes: profileData.workout_types || [],
        });
        if (profileData.training_days?.length) setSelectedDays(profileData.training_days);
        if (profileData.name) setOnboarded(true);
      } else {
        setProfile(EMPTY_PROFILE);
        setSelectedDays([]);
        setOnboarded(false);
      }

      const weekStart = getWeekStart();
      const { data: plans } = await supabase
        .from('weekly_plans')
        .select('day_name, workout_content')
        .eq('week_start', weekStart)
        .eq('user_id', currentUser.id);

      if (plans?.length) {
        const map = {};
        plans.forEach(p => {
          try { map[p.day_name] = JSON.parse(p.workout_content); } catch { /* skip malformed */ }
        });
        setWeekPlans(map);
      }
    } catch {
      // Supabase unavailable, keep empty state
    } finally {
      setTimeout(() => { isInit.current = false; }, 100);
    }
  }

  useEffect(() => {
    const fallback = setTimeout(() => setInitializing(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'INITIAL_SESSION') {
        try {
          if (currentUser) await loadUserData(currentUser);
        } finally {
          clearTimeout(fallback);
          setInitializing(false);
        }
      } else if (event === 'SIGNED_IN') {
        await loadUserData(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setWeekPlans({});
        setProfile(EMPTY_PROFILE);
        setSelectedDays([]);
        setOnboarded(false);
        isInit.current = true;
      }
      // TOKEN_REFRESHED / USER_UPDATED: solo actualizar user
    });

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!rawProfile.name || isInit.current || !user) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncing(true);
      await supabase.from('profile').upsert({
        user_id: user.id,
        name: rawProfile.name,
        age: rawProfile.age ? Number(rawProfile.age) : null,
        weight: rawProfile.weight ? Number(rawProfile.weight) : null,
        height: rawProfile.height ? Number(rawProfile.height) : null,
        injuries: rawProfile.injuries,
        goals: rawProfile.goals,
        equipment: rawProfile.equipment,
        level: rawProfile.level,
        days_per_week: rawProfile.daysPerWeek ? Number(rawProfile.daysPerWeek) : null,
        session_time: rawProfile.sessionTime,
        workout_types: rawProfile.workoutTypes || [],
        training_days: selectedDays,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      setSyncing(false);
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [rawProfile, selectedDays, user]);

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
    profile.workoutTypes?.length > 0 &&
    selectedDays.length > 0;

  const generatedDays = selectedDays.filter(d => weekPlans[d]);
  const plans = generatedDays.map(d => weekPlans[d]).filter(Boolean);

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
    setWeekPlans({});
  };

  const getLastWeekSummary = async () => {
    if (!user) return '';
    const weekStart = getWeekStart();
    const lastWeekDate = new Date(weekStart);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekStart = lastWeekDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('weekly_plans')
      .select('day_name, workout_content')
      .eq('week_start', lastWeekStart)
      .eq('user_id', user.id);
    if (!data?.length) return '';
    return data.map(d => {
      try {
        const plan = JSON.parse(d.workout_content);
        const exercises = [...(plan.main || []), ...(plan.core || [])].map(e => e.name).join(', ');
        return `${d.day_name} (${plan.muscleGroup || ''}): ${exercises}`;
      } catch {
        return `${d.day_name}: ${d.workout_content.substring(0, 300)}`;
      }
    }).join('\n');
  };

  const callAPI = (day, assignedGroup, usedExercises, isLastDay, lastWeekSummary) =>
    generateDayPlan({ profile, day, allDays: selectedDays, assignedGroup, usedExercises, isLastDay, lastWeekSummary });

  const generateAll = async () => {
    setWeekPlans({});
    setLoading(true);
    setError(null);

    try {
      const lastWeekSummary = await getLastWeekSummary();
      const weekStart = getWeekStart();
      const weeklySplit = getWeeklySplit(selectedDays);

      const results = await Promise.all(
        selectedDays.map((day, i) =>
          callAPI(day, weeklySplit[day], [], i === selectedDays.length - 1, lastWeekSummary)
            .then(content => ({ day, content }))
        )
      );

      const newPlans = {};
      await Promise.all(
        results.map(async ({ day, content }) => {
          await supabase.from('weekly_plans').delete()
            .eq('week_start', weekStart)
            .eq('day_name', day)
            .eq('user_id', user.id);
          await supabase.from('weekly_plans').insert({
            week_start: weekStart,
            day_name: day,
            workout_content: JSON.stringify(content),
            user_id: user.id,
          });
          newPlans[day] = content;
        })
      );

      setWeekPlans({ ...newPlans });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="app">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#888', fontSize: '1.1rem' }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

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
              <span className="header-sub">
                Hola, {profile.name}
                {syncing && <span style={{ opacity: 0.5 }}> · guardando…</span>}
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-edit-profile"
            onClick={() => setShowProfilePanel(true)}
          >
            ✏️ Perfil
          </button>
          <button
            className="btn-logout"
            onClick={() => supabase.auth.signOut()}
          >
            Salir
          </button>
        </div>
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
            onClick={generateAll}
            disabled={!canGenerate || loading}
          >
            {loading ? (
              <>
                <span className="generating-spinner">⚙️</span>
                Generando {selectedDays.length} días…
              </>
            ) : (
              '✨ Generar Rutina Semanal'
            )}
          </button>

          {!canGenerate && !loading && (
            <p className="generating-text">
              {selectedDays.length === 0
                ? 'Selecciona al menos un día de entrenamiento'
                : 'Perfil incompleto — haz clic en "Perfil" para completarlo'}
            </p>
          )}

          {loading && (
            <p className="generating-text">
              Generando todos los días en paralelo…
            </p>
          )}

          {error && <div className="error-msg">⚠️ {error}</div>}
        </div>

        {plans.length > 0 && (
          <section className="section-card">
            <h2 className="section-title">
              <span className="icon">🏋️</span>
              Tu Rutina Semanal
              {loading && (
                <span className="section-badge">
                  {generatedDays.length}/{selectedDays.length} días
                </span>
              )}
            </h2>
            <WorkoutPlan plans={plans} />
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
