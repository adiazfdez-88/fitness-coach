# FitCoach AI

Entrenador personal con inteligencia artificial — rutinas semanales personalizadas generadas con Claude Sonnet.

## Stack

- **Frontend**: React + Vite
- **Backend (dev)**: Express.js (`server.js`)
- **Backend (prod)**: Vercel Serverless Functions (`api/generate-routine.js`)
- **IA**: Anthropic Claude Sonnet (`claude-sonnet-4-6`)

## Desarrollo local

```bash
# 1. Copia el archivo de variables de entorno
cp .env.example .env

# 2. Agrega tu API key de Anthropic en .env
ANTHROPIC_API_KEY=sk-ant-...

# 3. Instala dependencias
npm install

# 4. Arranca frontend + backend juntos
npm run dev
```

Abre `http://localhost:5173`

## Deploy en Vercel

### 1. Importar repositorio
En [vercel.com/new](https://vercel.com/new) importa el repo `adiazfdez-88/fitness-coach`.

### 2. Configurar variable de entorno
En **Settings → Environment Variables** añade:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` |

### 3. Deploy
Vercel detecta la config en `vercel.json` automáticamente:
- Build: `npm run build` → `dist/`
- API: `api/generate-routine.js` → `/api/generate-routine`

## Estructura

```
├── src/                    # React frontend
│   ├── components/
│   │   ├── UserProfile.jsx       # Formulario de perfil
│   │   ├── WeeklyCalendar.jsx    # Calendario con seguimiento
│   │   ├── WorkoutPlan.jsx       # Render de rutina con react-markdown
│   │   ├── WelcomeScreen.jsx     # Primera visita
│   │   └── ProfilePanel.jsx      # Panel lateral de edición
│   └── hooks/
│       └── useLocalStorage.js
├── api/
│   └── generate-routine.js # Vercel Serverless Function (producción)
├── server.js               # Express server (desarrollo local)
├── vercel.json             # Configuración de deploy
└── vite.config.js          # Proxy /api → :3001 en dev
```
