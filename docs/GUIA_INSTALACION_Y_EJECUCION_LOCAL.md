# Guía de Instalación y Configuración Local: NestJS & React

Este documento describe los pasos detallados para instalar, configurar y ejecutar en entorno local tanto el backend (**NestJS**) como el frontend (**React + Vite**), asegurando que el frontend apunte correctamente al servidor backend local.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de contar con los siguientes elementos instalados en tu sistema:

1. **Node.js**: Versión `18.x` o `20.x` (se recomienda LTS).
2. **npm**: Versión `9.x` o superior (incluido con Node.js).
3. **Git**: Para el control de versiones y descarga del código.
4. **Base de Datos PostgreSQL**: Conexión a la base de datos de desarrollo (local o remota).

---

## 🏗️ Estructura del Proyecto

```text
sistema_final/
├── backend/    # Servidor API NestJS (Fastify + Raw SQL PostgreSQL)
└── web/        # Aplicación Web React (Vite + Tailwind CSS + TanStack Query)
```

---

## ⚡ 1. Configuración e Instalación del Backend (NestJS)

### Paso 1.1: Acceder al directorio del backend
```bash
cd backend
```

### Paso 1.2: Instalar dependencias
```bash
npm install
# O si prefieres una instalación exacta basada en lockfile:
# npm ci
```

### Paso 1.3: Configurar variables de entorno (`.env`)
Crea un archivo `.env` en la raíz de la carpeta `backend/` (puedes tomar como base el archivo `.env.example`):

```bash
cp .env.example .env
```

Configura las variables dentro de `backend/.env` para apuntar a tu entorno local:

```env
# Conexión a la Base de Datos PostgreSQL
DATABASE_HOST=localhost # o la IP de tu servidor de BD
DATABASE_PORT=5432
DATABASE_USER=tu_usuario_db
DATABASE_PASSWORD=tu_password_db
DATABASE_NAME=sistema_de_inventario
DATABASE_URL="postgresql://tu_usuario_db:tu_password_db@localhost:5432/sistema_de_inventario"

# Configuración del Servidor NestJS
PORT=3010
API_PREFIX=api

# Seguridad y Autenticación JWT
JWT_SECRET=secreto_super_seguro_local_123
JWT_REFRESH_SECRET=refresco_super_seguro_local_123
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# Permitir CORS para la aplicación React Local
CORS_ORIGIN=http://localhost:5173,http://localhost:9002

# Firebase / Credenciales Adicionales (Opcional en desarrollo)
FIREBASE_CREDENTIALS_PATH=pino-5fe44-firebase-adminsdk-fbsvc-23206ab8a2.json
DATABASE_CONNECTION_TIMEOUT_MS=10000
```

### Paso 1.4: (Opcional) Ejecutar Migraciones de Base de Datos
Si estás iniciando con una BD limpia, ejecuta las migraciones:
```bash
npm run db:migrate
```

### Paso 1.5: Iniciar el servidor backend en modo desarrollo
```bash
npm run start:dev
```

El servidor estará escuchando en:
- **API URL Base**: `http://localhost:3010/api`
- **Documentación Swagger**: `http://localhost:3010/docs`

---

## 🌐 2. Configuración e Instalación del Frontend (React + Vite)

### Paso 2.1: Acceder al directorio de la aplicación web
```bash
cd ../web
```

### Paso 2.2: Instalar dependencias
```bash
npm install
```

### Paso 2.3: Configurar apuntamiento local (`.env.local`)
Crea o edita el archivo `.env.local` dentro de la carpeta `web/` con la siguiente configuración activa para **apuntar al NestJS Local**:

```env
# ==========================================
# CONFIGURACIÓN LOCAL (Activa)
# ==========================================
VITE_API_URL=http://localhost:3010/api
VITE_SOCKET_URL=http://localhost:3010
VITE_SOCKET_PATH=/socket.io
VITE_DEV_BACKEND_ORIGIN=http://localhost:3010
VITE_APP_NAME=MultiTienda Local
```

> **Nota:** La configuración `VITE_API_URL=http://localhost:3010/api` le indica a React que realice todas las peticiones REST al servidor NestJS local en el puerto `3010`.

### Paso 2.4: Iniciar el frontend en modo desarrollo
```bash
npm run dev
```

La aplicación React estará disponible en tu navegador en:
- **URL Frontend**: `http://localhost:5173`

---

## 🚀 3. Flujo de Ejecución Local Integrada

Para desarrollar y probar de forma completa en tu máquina local:

1. **Terminal 1 (Backend NestJS)**:
   ```bash
   cd backend
   npm run start:dev
   ```
   *Verifica la salida en consola:* `⚡ MultiTienda API (FASTIFY) running on http://localhost:3010`

2. **Terminal 2 (Frontend React)**:
   ```bash
   cd web
   npm run dev
   ```
   *Verifica la salida en consola:* `Local: http://localhost:5173/`

3. **Acceso y Verificación**:
   - Abre `http://localhost:5173` en tu navegador.
   - Intenta iniciar sesión con un usuario registrado.
   - Abre las herramientas de desarrollador (`F12` -> Network/Red) para confirmar que las peticiones se realizan hacia `http://localhost:3010/api/...`.

---

## 🛠️ 4. Solución de Problemas Frecuentes (Troubleshooting)

### A. Error de CORS (Blocked by CORS policy)
- **Causa**: El backend no está permitiendo el origen del frontend local.
- **Solución**: Asegúrate de que en `backend/.env` la variable `CORS_ORIGIN` incluya `http://localhost:5173`.

### B. Error 404 o `Failed to fetch` en Peticiones API
- **Causa**: El frontend no logra comunicarse con la API.
- **Solución**: 
  1. Revisa que el backend esté corriendo en `http://localhost:3010`.
  2. Verifica que `web/.env.local` tenga `VITE_API_URL=http://localhost:3010/api`.
  3. Si cambiaste `.env.local`, reinicia el servidor de Vite (`Ctrl+C` y `npm run dev`).

### C. Error de Conexión a Base de Datos
- **Causa**: Credenciales o servidor PostgreSQL inalcanzable.
- **Solución**: Verifica `DATABASE_HOST`, `DATABASE_USER` y `DATABASE_PASSWORD` en `backend/.env`.

---

## 📝 5. Resumen de Comandos Rápidos

| Acción | Comando Backend (`/backend`) | Comando Frontend (`/web`) |
| :--- | :--- | :--- |
| **Instalación** | `npm install` | `npm install` |
| **Desarrollo** | `npm run start:dev` | `npm run dev` |
| **Build Prod** | `npm run build` | `npm run build` |
| **Verificación** | `npm run typecheck` | `npm run typecheck` |
