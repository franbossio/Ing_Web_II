# 🤖 ConectaIA — Plataforma de Reclutamiento con IA

> Plataforma fullstack de reclutamiento y empleo potenciada por Inteligencia Artificial.  
> Conecta candidatos con empresas de forma inteligente: analiza CVs, sugiere matches y gestiona postulaciones en tiempo real.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Funcionalidades](#-funcionalidades)
- [Instalación local](#-instalación-local)
- [Variables de entorno](#-variables-de-entorno)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Flujos de IA](#-flujos-de-ia)
- [Despliegue](#-despliegue)
- [Equipo](#-equipo)

---

## 📌 Descripción

**ConectaIA** es una aplicación web desarrollada para la materia **Ingeniería Web II — UNDEF 2026**.  
Permite a candidatos crear su perfil, subir su CV para que la IA extraiga sus datos automáticamente y postularse a ofertas laborales. Las empresas pueden publicar puestos, buscar candidatos y recibir sugerencias de la IA sobre qué perfiles son más compatibles con cada vacante.

---

## 🛠 Tecnologías

### Backend
| Tecnología | Uso |
|---|---|
| **NestJS** | Framework principal (Node.js + TypeScript) |
| **TypeORM** | ORM para PostgreSQL |
| **PostgreSQL** | Base de datos relacional (hosteada en Render) |
| **JWT + Passport** | Autenticación y autorización |
| **Groq API** (llama-3.3-70b) | Análisis de CV y matching con IA |
| **Make.com** | Automatización de flujos de IA |
| **pdf-parse** | Extracción de texto de PDFs |

### Frontend
| Tecnología | Uso |
|---|---|
| **HTML5 / CSS3 / JS vanilla** | Sin frameworks frontend |
| **CSS Variables** | Sistema de temas claro/oscuro |
| **Canvas API** | Compresión de imágenes de perfil |
| **Fetch API** | Comunicación con el backend |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│   HTML/CSS/JS vanilla  →  Live Server / Render Static   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (REST API)
┌────────────────────▼────────────────────────────────────┐
│                      BACKEND                            │
│              NestJS  →  Puerto 3001                     │
│                                                         │
│  /api/auth          →  Login / Register                 │
│  /api/users         →  Perfil candidato/empresa         │
│  /api/cv            →  Análisis de CV con Groq          │
│  /api/jobs          →  CRUD de ofertas laborales        │
│  /api/applications  →  Gestión de postulaciones         │
│  /api/recommendations → Matches IA vía Make.com         │
└────────────────────┬────────────────────────────────────┘
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────┐   ┌─────────▼──────────────────────┐
│  PostgreSQL     │   │  Servicios externos             │
│  (Render DB)   │   │  • Groq API (llama-3.3-70b)     │
│                │   │  • Make.com (automatización)    │
└────────────────┘   └────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 👤 Candidato
- Registro e inicio de sesión con JWT
- Perfil completo: datos personales, experiencia, educación, skills, idiomas
- **Subir CV en PDF → la IA extrae y completa el perfil automáticamente**
- **Foto de perfil** con compresión automática
- Explorar y filtrar ofertas laborales
- Postularse a ofertas con un click
- Ver estado de postulaciones en tiempo real
- **Dashboard con recomendaciones personalizadas de la IA** (Match % + razón)
- Guardar ofertas favoritas
- Tema claro / oscuro

### 🏢 Empresa
- Registro e inicio de sesión
- Publicar y gestionar ofertas laborales
- **Buscar candidatos con sugerencia IA** por oferta
- Ver perfil completo y descargar CV de cada candidato
- Gestionar postulaciones: cambiar estado, agendar entrevistas
- Dashboard con estadísticas
- Logo de empresa con foto

### 🤖 Inteligencia Artificial
- **Análisis de CV**: Groq extrae nombre, skills, experiencia, educación, bio, idiomas y genera un comentario del CV
- **Recomendaciones para candidato**: Make.com + Groq analiza las ofertas activas contra el perfil y devuelve las 3 mejores con Match %
- **Sugerencia de candidatos para empresa**: dado un puesto, la IA ordena los candidatos por compatibilidad

---

## 🚀 Instalación local

### Requisitos previos
- Node.js 18+
- PostgreSQL 14+ (local o en Render)
- Cuenta en [console.groq.com](https://console.groq.com) — gratis
- Cuenta en [make.com](https://make.com) — gratis

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Ing_Web_II.git
cd Ing_Web_II
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editá el .env con tus datos (ver sección siguiente)
```

### 4. Levantar el backend

```bash
npm run start:dev
# Vas a ver: 🚀 TalentAI Backend corriendo en http://localhost:3001/api
```

### 5. Abrir el frontend

Abrí `frontend/pages/index.html` con **Live Server** en VS Code  
(click derecho sobre el archivo → *Open with Live Server*)

---

## 🔑 Variables de entorno

Creá un archivo `.env` dentro de la carpeta `backend/`:

```env
# ── Servidor ──────────────────────────────────────────────
PORT=3001

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=cambia-esto-por-una-clave-secreta

# ── PostgreSQL local ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=conectaia

# ── O usar URL completa (Render / producción) ─────────────
# DATABASE_URL=postgresql://user:password@host/db

# ── Groq IA ───────────────────────────────────────────────
# Obtener gratis en: console.groq.com → API Keys → Create API Key
GROQ_API_KEY=gsk_...

# ── Make.com webhooks ─────────────────────────────────────
# Escenario 1: Análisis de CV con Groq
MAKE_WEBHOOK_URL=https://hook.us2.make.com/...

# Escenario 2: Recomendaciones de ofertas para candidato
MAKE_RECOMMENDATIONS_URL=https://hook.us2.make.com/...

# Escenario 3: Sugerencia de candidatos para empresa
MAKE_CANDIDATES_URL=https://hook.us2.make.com/...
```

> ⚠️ **Nunca subas el `.env` real a GitHub.** Ya está en el `.gitignore`.

---

## 📁 Estructura del proyecto

```
Ing_Web_II/
├── backend/
│   ├── src/
│   │   ├── app.module.ts           # Módulo raíz + TypeORM config
│   │   ├── main.ts                 # Bootstrap (puerto, CORS, body limit 25mb)
│   │   ├── auth/                   # Login, register, JWT strategy
│   │   ├── users/
│   │   │   ├── user.entity.ts      # Entidad TypeORM (todos los campos del perfil)
│   │   │   ├── users.service.ts    # CRUD, findCandidates, sanitize
│   │   │   └── users.controller.ts # PATCH /me, GET /candidates, POST /suggest
│   │   ├── cv/
│   │   │   ├── cv.service.ts       # pdf-parse + Groq API
│   │   │   └── cv.controller.ts    # POST /analyze, POST /analyze-preview
│   │   ├── jobs/                   # CRUD de ofertas laborales
│   │   ├── applications/           # Postulaciones + cambio de estado
│   │   └── recommendations/        # Match candidato ↔ oferta vía Make
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── css/
    │   ├── global.css              # Design tokens, temas dark/light/system
    │   ├── candidate.css           # Layout candidato + sidebar
    │   ├── company.css             # Layout empresa + sidebar
    │   └── landing.css             # Páginas públicas (index, info)
    ├── js/
    │   ├── auth.js                 # API_BASE, login, register, logout, redirect
    │   ├── profile.js              # initProfile, updateDashboardHero, calcPercent
    │   ├── avatar.js               # Upload/delete foto, compresión con canvas
    │   ├── sidebar-candidate.js    # Inyecta sidebar candidato en runtime
    │   ├── sidebar-company.js      # Inyecta sidebar empresa en runtime
    │   ├── theme.js                # Sistema de temas claro/oscuro/sistema
    │   └── user-loader.js          # Guard: redirige si no hay sesión activa
    └── pages/
        ├── index.html              # Landing principal
        ├── info_candidate.html     # Info para candidatos
        ├── info_company.html       # Info para empresas
        ├── login.html
        ├── register.html
        ├── candidate/
        │   ├── dashboard.html      # Recomendaciones IA + subir CV
        │   ├── profile.html        # Editar perfil + foto
        │   ├── jobs.html           # Explorar y filtrar ofertas
        │   ├── applications.html   # Mis postulaciones
        │   ├── saved.html          # Ofertas guardadas
        │   └── settings.html       # Configuración de cuenta
        └── company/
            ├── dashboard.html      # Stats de la empresa
            ├── candidates.html     # Buscar candidatos + sugerencia IA
            ├── applications.html   # Gestionar postulaciones + agendar entrevistas
            ├── post-job.html       # Publicar oferta
            ├── my-jobs.html        # Mis ofertas activas
            ├── favorites.html      # Candidatos guardados
            └── settings.html       # Perfil empresa + logo
```

---

## 🤖 Flujos de IA

### Flujo 1 — Análisis de CV (Groq directo)

```
Candidato sube PDF
  → Frontend convierte a base64
  → POST /api/cv/analyze-preview  (preview sin guardar)
     o /api/cv/analyze            (analiza y guarda)
  → Backend: pdf-parse extrae texto del PDF
  → Groq llama-3.3-70b procesa el texto
  → Devuelve JSON: nombre, apellido, skills, experiencia,
    educación, bio, idiomas + comentario del CV
  → Frontend muestra preview → candidato confirma
  → Perfil completado automáticamente
```

### Flujo 2 — Recomendaciones para candidato (Make → Groq)

```
Candidato abre el dashboard
  → POST /api/recommendations
  → Backend trae: skills del candidato + ofertas activas de la DB
  → Manda payload al webhook de Make.com
  → Make → HTTP → Groq API (llama-3.3-70b)
  → Groq analiza compatibilidad y devuelve:
    3 ofertas con { jobId, matchPct, reason }
  → Backend enriquece con datos reales de la DB
  → Frontend renderiza cards con % de match y razón
```

### Flujo 3 — Sugerencia de candidatos para empresa (Make → Groq)

```
Empresa selecciona oferta y hace click en "✨ Sugerir"
  → POST /api/users/candidates/suggest
  → Backend trae: todos los candidatos + datos del puesto
  → Manda payload al webhook de Make.com
  → Make → HTTP → Groq API (llama-3.3-70b)
  → Groq analiza compatibilidad y devuelve:
    candidatos ordenados con { candidateId, matchPct, reason }
  → Frontend reordena cards con % de match
```

---

## 🌐 Despliegue en Render

### Backend
1. Crear un **Web Service** en Render apuntando a la carpeta `backend/`
2. Build command: `npm install && npm run build`
3. Start command: `node dist/main`
4. Agregar todas las variables de entorno en el panel de Render

### Base de datos
1. Crear un **PostgreSQL** en Render (plan gratuito disponible)
2. Copiar la **External Database URL**
3. Pegarla como `DATABASE_URL` en las env vars del backend

### SSL automático
El `app.module.ts` detecta el entorno y activa SSL solo en producción:
```typescript
ssl: isProduction ? { rejectUnauthorized: false } : false
```
Se activa cuando existe `DATABASE_URL` o `NODE_ENV=production`.

### Frontend
Podés servir la carpeta `frontend/` como un **Static Site** en Render  
o subirla a cualquier hosting estático (Netlify, Vercel, GitHub Pages).

---

## 👥 Equipo

Proyecto académico — **Ingeniería Web II, UNDEF 2026**

| Integrante | Rol |
|---|---|
| Francisco Bossio | Fullstack + Integración IA |
| Sofia Correa | Fullstack + Integracón IA + Diseño |

---

## 📄 Licencia

Proyecto académico — uso educativo únicamente.
