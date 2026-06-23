# 🤖 ConectaIA — Plataforma de Reclutamiento con IA

> Plataforma fullstack de reclutamiento y empleo potenciada por Inteligencia Artificial.  
> Conecta candidatos con empresas de forma inteligente: analiza CVs, sugiere matches, gestiona postulaciones y permite mensajería entre ambos en tiempo real.

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Funcionalidades](#-funcionalidades)
- [Variables de entorno](#-variables-de-entorno)
- [Instalación local](#-instalación-local)
- [Hosting en Render](#-hosting-en-render)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Flujos de IA](#-flujos-de-ia)
- [Despliegue](#-despliegue-en-render)
- [Equipo](#-equipo)

---

## 📌 Descripción

**ConectaIA** es una aplicación web desarrollada para la materia **Ingeniería Web II — UNDEF 2026**.  
Permite a candidatos crear su perfil, subir su CV para que la IA extraiga sus datos automáticamente y postularse a ofertas laborales. Las empresas pueden publicar puestos, buscar candidatos y recibir sugerencias de la IA sobre qué perfiles son más compatibles con cada vacante. Ambos roles pueden comunicarse entre sí mediante un sistema de mensajería propio.

---

## 🛠 Tecnologías

### Backend
| Tecnología | Uso |
|---|---|
| **NestJS** | Framework principal (Node.js + TypeScript) |
| **TypeORM** | ORM para PostgreSQL (`synchronize: true`, sin migraciones formales) |
| **PostgreSQL** | Base de datos relacional (hosteada en Render) |
| **JWT (`@nestjs/jwt`)** | Autenticación con tokens firmados (8h, o 7 días con "recordarme") |
| **bcryptjs** | Hash de contraseñas |
| **Groq API** (`llama-3.3-70b-versatile`) | Análisis de CV, recomendaciones, sugerencia de candidatos y simulación de entrevistas — llamado directo vía `fetch()` nativo de Node, sin intermediarios |
| **Brevo API** | Envío de emails (verificación de cuenta, notificaciones de cambio de estado de postulación) vía `fetch()` directo a `api.brevo.com` |
| **pdf-parse** | Extracción de texto de PDFs para el análisis de CV |

### Frontend
| Tecnología | Uso |
|---|---|
| **HTML5 / CSS3 / JS vanilla (ES Modules)** | Sin frameworks frontend |
| **CSS Variables** | Sistema de temas claro/oscuro/sistema |
| **Canvas API** | Compresión de imágenes de perfil antes de subirlas (inline en `profile.html`) |
| **Chart.js** (CDN) | Gráficos de demanda de habilidades y score de CV |
| **Fetch API** | Comunicación con el backend (wrapper `authFetch()` en `auth.js`) |
| **Polling (setInterval)** | Actualización casi en tiempo real de mensajes y notificaciones, sin WebSockets |

> Nota: el `package.json` del backend incluye `@google/generative-ai`, pero no está integrado en ningún módulo actual — toda la IA en producción pasa por Groq.

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│   HTML/CSS/JS vanilla  →  Render Static Site             │
└────────────────────┬──────────────────────────────────────┘
                      │ HTTP (REST API) + JWT en Authorization
┌────────────────────▼──────────────────────────────────────┐
│                      BACKEND                              │
│              NestJS  →  Puerto 3001  →  prefijo /api      │
│                                                            │
│  /api/auth            →  Login / Register / Verify email  │
│  /api/users           →  Perfil candidato/empresa          │
│  /api/cv              →  Análisis de CV con Groq            │
│  /api/jobs            →  CRUD de ofertas laborales          │
│  /api/applications    →  Gestión de postulaciones           │
│  /api/recommendations →  Matches IA (Groq directo)          │
│  /api/interviews      →  Simulación de entrevista con IA    │
│  /api/messages        →  Conversaciones y mensajería         │
│  /api/notifications   →  Notificaciones (badge no leídos)    │
└────────────────────┬───────────────────────────────────────┘
           ┌──────────┴──────────┐
           │                     │
┌──────────▼──────┐   ┌──────────▼──────────────────────┐
│  PostgreSQL      │   │  Servicios externos              │
│  (Render DB)     │   │  • Groq API (llama-3.3-70b)      │
│                  │   │  • Brevo API (envío de emails)   │
└──────────────────┘   └───────────────────────────────────┘
```

---

## ✨ Funcionalidades

### 👤 Candidato
- Registro e inicio de sesión con JWT (con verificación de email obligatoria antes de loguear)
- Opción **"Recordarme"**: define si la sesión persiste 7 días (`localStorage`) o solo dura mientras esté la pestaña abierta (`sessionStorage`, token de 8hs)
- Perfil completo: datos personales, experiencia, educación, skills técnicas y blandas, idiomas
- **Subir CV en PDF → la IA extrae y completa el perfil automáticamente**
- **Foto de perfil** con compresión automática (Canvas API)
- Explorar y filtrar ofertas laborales, postularse con un click
- Ver estado de postulaciones (pendiente / en revisión / aceptada / rechazada)
- **Dashboard con recomendaciones personalizadas de la IA** (Match % + razón + skills técnicas faltantes), cacheadas 12hs para no recalcular en cada visita
- Gráfico de **habilidades más demandadas** en el mercado y de demanda de las propias habilidades
- **Simulación de entrevista con IA**: genera preguntas y evalúa las respuestas
- **Generador de CV** a partir de los datos del perfil
- Guardar ofertas favoritas
- **Mensajería** con empresas (por conversación, con badge de no leídos)
- Notificaciones de eventos relevantes (cambios de estado, nuevos mensajes)
- Tema claro / oscuro / según sistema

### 🏢 Empresa
- Registro e inicio de sesión
- Publicar y gestionar ofertas laborales (con skills técnicas y blandas en columnas separadas)
- **Buscar candidatos con sugerencia IA** por oferta
- Ver perfil completo y CV de cada candidato
- Gestionar postulaciones recibidas: cambiar estado (dispara notificación al candidato)
- Guardar candidatos como favoritos
- **Mensajería** con candidatos
- Dashboard con estadísticas
- Logo de empresa con foto

### 🤖 Inteligencia Artificial (Groq, `llama-3.3-70b-versatile`)
- **Análisis de CV**: extrae nombre, skills, experiencia, educación, bio, idiomas y genera un comentario del CV
- **Recomendaciones para candidato**: cruza las skills del candidato contra las ofertas activas y devuelve hasta 3 con Match %, razón y skills técnicas faltantes (filtradas para no mezclar con habilidades blandas)
- **Sugerencia de candidatos para empresa**: dado un puesto, ordena los candidatos por compatibilidad
- **Simulación de entrevista**: genera preguntas relevantes al perfil/puesto y evalúa la calidad de la respuesta del candidato

---

## 🔑 Variables de entorno

El backend espera estas variables (configurables en `backend/.env` localmente, o en el panel de Render en producción):

| Variable | Uso |
|---|---|
| `PORT` | Puerto del servidor (default `3001`) |
| `JWT_SECRET` | Clave para firmar/verificar los JWT |
| `GROQ_API_KEY` | Clave de [console.groq.com](https://console.groq.com) — requerida para CV, recomendaciones, sugerencia de candidatos y entrevistas |
| `BREVO_API_KEY` | Clave de [Brevo](https://www.brevo.com) — requerida para el envío de emails (verificación, notificaciones) |
| `DATABASE_URL` | URL completa de conexión a Postgres (la usa Render automáticamente); si no está presente, se usan `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` para conexión local |
| `NODE_ENV` | Si es `production` (o si hay `DATABASE_URL`), activa SSL en la conexión a Postgres |

> El `.env.example` del repo actualmente solo incluye `PORT` y `JWT_SECRET` — al levantar el proyecto localmente, completar también `GROQ_API_KEY` y `BREVO_API_KEY` para que las funciones de IA y de email funcionen.

---

## 🚀 Instalación local

### Requisitos previos
- Node.js 18+ (usa `fetch()` nativo, sin `node-fetch`)
- PostgreSQL 14+ (local o en Render)
- Cuenta en [console.groq.com](https://console.groq.com) — gratis
- Cuenta en [brevo.com](https://www.brevo.com) — gratis

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
# Completar PORT, JWT_SECRET, GROQ_API_KEY, BREVO_API_KEY y datos de DB (ver sección anterior)
```

### 4. Levantar el backend

```bash
npm run start:dev
# Vas a ver: 🚀 TalentAI Backend corriendo en http://localhost:3001/api
```

### 5. Abrir el frontend

Abrí `frontend/pages/index.html` con **Live Server** en VS Code  
(click derecho sobre el archivo → *Open with Live Server*)

> Nota: las páginas del frontend apuntan por defecto a la API en producción (`https://ing-web-ii.onrender.com/api`, hardcodeada en `frontend/js/auth.js`). Para probar contra el backend local hay que cambiar manualmente `API_BASE` en ese archivo.

---

## 🌍 Hosting en Render

https://ing-web-ii.onrender.com/

---

## 📁 Estructura del proyecto

```
Ing_Web_II/
├── backend/
│   ├── src/
│   │   ├── app.module.ts           # Módulo raíz + TypeORM config (SSL condicional a producción)
│   │   ├── main.ts                 # Bootstrap (puerto, CORS, prefijo /api, body limit 25mb)
│   │   ├── auth/                   # Login, register, verificación de email, JWT
│   │   ├── users/
│   │   │   ├── user.entity.ts      # Entidad TypeORM (todos los campos del perfil)
│   │   │   ├── users.service.ts    # CRUD, findCandidates, suggest (IA), sanitize
│   │   │   └── users.controller.ts # PATCH /me, GET /candidates, POST /candidates/suggest
│   │   ├── cv/                     # pdf-parse + Groq → análisis y autocompletado de perfil
│   │   ├── jobs/                   # CRUD de ofertas laborales + ranking de skills demandadas
│   │   ├── applications/           # Postulaciones + cambio de estado
│   │   ├── recommendations/        # Match candidato ↔ oferta con Groq, cacheado 12hs
│   │   ├── interviews/             # Simulación de entrevista con IA (genera y evalúa)
│   │   ├── messages/                # Conversaciones y mensajes entre candidato y empresa
│   │   ├── notifications/          # Notificaciones (badge de no leídos)
│   │   └── mail/                   # Envío de emails vía Brevo API
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── css/
    │   ├── global.css              # Design tokens, temas dark/light/system
    │   ├── candidate.css           # Layout candidato + sidebar
    │   ├── company.css             # Layout empresa + sidebar
    │   ├── messages.css            # Estilos de la mensajería
    │   └── landing.css             # Páginas públicas (index, info)
    ├── js/
    │   ├── auth.js                  # API_BASE, authFetch, login, register, logout, redirect
    │   ├── login.js                 # Lógica del form de login + redirect si ya hay sesión
    │   ├── register.js              # Lógica del form de registro
    │   ├── profile.js               # initProfile, updateDashboardHero, calcPercent, avatares
    │   ├── messages.js              # Lógica de la mensajería (lista, chat, polling)
    │   ├── notifications.js         # Badge y dropdown de notificaciones
    │   ├── sidebar-candidate.js     # Inyecta sidebar candidato en runtime
    │   ├── sidebar-company.js       # Inyecta sidebar empresa en runtime
    │   ├── sidebar-admin.js         # Inyecta sidebar admin en runtime
    │   ├── sidebar-toggle.js        # Colapsar/expandir sidebar en desktop
    │   ├── mobile-sidebar.js        # Comportamiento del sidebar en mobile
    │   ├── theme.js                 # Sistema de temas claro/oscuro/sistema
    │   └── user-loader.js           # Guard: redirige si no hay sesión activa + autocompleta UI
    └── pages/
        ├── index.html               # Landing principal
        ├── login.html / register.html / verify-email.html
        ├── info_candidate.html / info_company.html
        ├── public-profile.html      # Perfil público de un candidato/empresa
        ├── admin/                   # dashboard.html, jobs.html, users.html (panel admin)
        ├── candidate/
        │   ├── dashboard.html       # Recomendaciones IA + % de perfil + ranking de skills
        │   ├── profile.html         # Editar perfil + foto + gráfico de demanda de habilidades
        │   ├── jobs.html            # Explorar y filtrar ofertas
        │   ├── applications.html    # Mis postulaciones
        │   ├── saved.html           # Ofertas guardadas
        │   ├── messages.html        # Mensajería con empresas
        │   ├── cv-generator.html    # Generador de CV a partir del perfil
        │   ├── interview-simulation.html # Simulación de entrevista con IA
        │   └── settings.html        # Configuración de cuenta
        └── company/
            ├── dashboard.html       # Stats de la empresa
            ├── candidates.html      # Buscar candidatos + sugerencia IA
            ├── applications.html    # Gestionar postulaciones
            ├── post-job.html        # Publicar oferta
            ├── my-jobs.html         # Mis ofertas activas
            ├── favorites.html       # Candidatos guardados
            ├── messages.html        # Mensajería con candidatos
            └── settings.html        # Perfil empresa + logo
```

---

## 🤖 Flujos de IA

Todos los flujos de IA llaman **directamente** a la API de Groq desde el backend, vía `fetch()` nativo — no hay intermediarios de automatización (no se usa Make.com ni n8n ni similares).

### Flujo 1 — Análisis de CV

```
Candidato sube PDF
  → Frontend convierte a base64
  → POST /api/cv/analyze-preview  (preview sin guardar)
     o /api/cv/analyze            (analiza y guarda)
  → Backend: pdf-parse extrae texto del PDF
  → fetch() directo a Groq (llama-3.3-70b-versatile)
  → Devuelve JSON: nombre, apellido, skills, experiencia,
    educación, bio, idiomas + comentario del CV
  → Frontend muestra preview → candidato confirma
  → Perfil completado automáticamente
```

### Flujo 2 — Recomendaciones para candidato

```
Candidato abre el dashboard
  → GET /api/recommendations
  → Backend chequea caché en el propio usuario (TTL 12hs, o invalida si hay oferta más nueva)
  → Si no hay caché válido: arma prompt con skills del candidato + ofertas activas de la DB
  → fetch() directo a Groq → devuelve hasta 3 ofertas con { jobId, matchPct, reason, missingSkills }
  → Backend enriquece con datos reales de la DB y filtra missingSkills para que solo sean skills técnicas
  → Guarda el resultado en caché y lo devuelve
  → Frontend renderiza cards con % de match y razón
```

### Flujo 3 — Sugerencia de candidatos para empresa

```
Empresa selecciona oferta y hace click en "✨ Sugerir"
  → POST /api/users/candidates/suggest
  → Backend trae: todos los candidatos + datos del puesto
  → fetch() directo a Groq → devuelve candidatos ordenados con { candidateId, matchPct, reason }
  → Frontend reordena cards con % de match
```

### Flujo 4 — Simulación de entrevista

```
Candidato inicia la simulación
  → POST /api/interviews/start    → Groq genera una pregunta relevante al perfil/puesto
  → Candidato responde
  → POST /api/interviews/evaluate → Groq evalúa la respuesta y devuelve feedback
  → Frontend muestra el resultado de la evaluación
```

---

## 🌐 Despliegue en Render

### Backend
1. Crear un **Web Service** en Render apuntando a la carpeta `backend/`
2. Build command: `npm install && npm run build`
3. Start command: `node dist/main`
4. Agregar todas las variables de entorno listadas en [Variables de entorno](#-variables-de-entorno) en el panel de Render

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
El frontend (`frontend/`) se sirve como **Static Site** en Render.

---

## 👥 Equipo

Proyecto académico — **Ingeniería Web II, UNDEF 2026**

| Integrante | Rol |
|---|---|
| Francisco Bossio | Fullstack + Integración IA |
| Sofia Correa | Fullstack + Integración IA + Diseño |

---

## 📄 Licencia

Proyecto académico — uso educativo únicamente.
