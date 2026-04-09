# TalentAI Backend — NestJS + TypeScript

## Stack
- **NestJS 10** con TypeScript
- **JWT** (passport-jwt) para autenticación
- **bcryptjs** para hash de contraseñas
- **class-validator** para validación de DTOs
- Base de datos **en memoria** (temporal, lista para reemplazar con TypeORM/Prisma)

---

## Instalación y uso

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Modo desarrollo (hot reload)
npm run start:dev

# 4. Modo producción
npm run build && npm run start:prod
```

El servidor arranca en: **http://localhost:3001/api**

---

## Endpoints

| Método | Ruta              | Auth | Descripción                        |
|--------|-------------------|------|------------------------------------|
| POST   | /api/auth/login   | ❌   | Iniciar sesión                     |
| POST   | /api/auth/register| ❌   | Registrar nuevo usuario            |
| GET    | /api/auth/me      | ✅   | Perfil del usuario autenticado     |
| GET    | /api/users        | ✅ admin | Listar todos los usuarios      |

### POST /api/auth/login
```json
{
  "email": "candidate@test.com",
  "password": "Test1234!",
  "remember": false
}
```

### POST /api/auth/register
```json
// Candidato
{
  "role": "candidate",
  "email": "nuevo@email.com",
  "password": "MiPassword1!",
  "firstName": "María",
  "lastName": "González"
}

// Empresa
{
  "role": "company",
  "email": "empresa@email.com",
  "password": "MiPassword1!",
  "companyName": "TechCorp S.A."
}
```

### Respuesta exitosa (login/register)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "user": {
    "id": "uuid",
    "email": "candidate@test.com",
    "role": "candidate",
    "firstName": "Juan",
    "lastName": "Pérez",
    "createdAt": "2026-03-30T...",
    "isActive": true
  }
}
```

---

## Usuarios de prueba

| Email               | Password    | Rol       |
|---------------------|-------------|-----------|
| candidate@test.com  | Test1234!   | candidate |
| company@test.com    | Test1234!   | company   |
| admin@test.com      | Test1234!   | admin     |

---

## Integración con el Frontend

### 1. Copiar los scripts JS

```
frontend-js/auth.js      → frontend/js/auth.js
frontend-js/login.js     → frontend/js/login.js
frontend-js/register.js  → frontend/js/register.js
```

### 2. Actualizar login.html

Agregar al final del `<body>`:
```html
<script src="../js/login.js" type="module"></script>
```

### 3. Actualizar register.html

Reemplazar la línea existente:
```html
<!-- ANTES -->
<script src="../ts/pages/register.js" type="module"></script>

<!-- DESPUÉS -->
<script src="../js/register.js" type="module"></script>
```

### 4. Abrir el frontend con un servidor local

El frontend debe servirse con un servidor HTTP (no file://) para que los módulos ES funcionen:

```bash
# Con VS Code: instalar extensión "Live Server" y click en "Go Live"
# Con npx:
npx serve frontend/
# Con Python:
cd frontend && python3 -m http.server 5500
```

---

## Estructura del proyecto

```
src/
├── main.ts                        # Bootstrap + CORS + ValidationPipe
├── app.module.ts                  # Módulo raíz
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts            # Login / Register / GetMe
│   ├── auth.controller.ts         # POST /auth/login, /register, GET /me
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts           # CRUD + DB en memoria + seed
│   ├── users.controller.ts        # GET /users (admin)
│   └── user.entity.ts             # Interfaces User / SafeUser
└── common/
    ├── guards/
    │   ├── jwt-auth.guard.ts
    │   └── roles.guard.ts
    └── decorators/
        └── roles.decorator.ts

frontend-js/                       # Scripts listos para el frontend
├── auth.js                        # Helper: token, login, register, logout
├── login.js                       # Lógica de login.html
└── register.js                    # Lógica de register.html
```

---

## Próximos pasos para producción

1. **Base de datos real**: reemplazar `UsersService` con TypeORM + PostgreSQL o Prisma
2. **Variables de entorno**: usar `@nestjs/config` para gestionar `.env`
3. **Refresh tokens**: implementar rotación de tokens
4. **Rate limiting**: agregar `@nestjs/throttler`
5. **Swagger**: documentación automática con `@nestjs/swagger`
