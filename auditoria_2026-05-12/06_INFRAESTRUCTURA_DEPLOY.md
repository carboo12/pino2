# 🚀 AUDITORÍA INFRAESTRUCTURA Y DESPLIEGUE

## Arquitectura de Producción

```
┌─────────────────────────────────────────────────────┐
│                    VPS (rhclaroni.com)                │
│                                                      │
│  ┌──────────────────┐    ┌─────────────────────────┐ │
│  │  Nginx           │───▶│ PM2: pino-api-dev       │ │
│  │  (Reverse Proxy) │    │ NestJS + Fastify         │ │
│  │  /dev → static   │    │ Puerto: 3035             │ │
│  │  /api-dev → :3035│    │                           │ │
│  └──────────────────┘    └────────────┬────────────┘ │
│                                       │              │
│                          ┌────────────▼────────────┐ │
│                          │ PostgreSQL 16            │ │
│                          │ Host: 190.56.16.85:5432 │ │
│                          │ DB: multitienda_db      │ │
│                          └─────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌──────────────────────┐    ┌──────────────────────┐
│  Firebase Hosting    │    │  Flutter APK          │
│  pino-5fe44.web.app  │    │  (Pendiente generar)  │
│  Web Admin SPA       │    │  App ruteros          │
└──────────────────────┘    └──────────────────────┘
```

## Backend Deploy

| Parámetro | Valor |
|-----------|-------|
| Servidor | VPS `rhclaroni.com` |
| PM2 Process | `pino-api-dev` |
| Puerto | 3035 |
| URL API | `https://www.rhclaroni.com/api-dev` |
| Git repo | `github.com/galz35/pino2.git` rama `main` |
| Script deploy | `manual_update_dev.sh` |
| Node.js | ≥18.x |

### Proceso de deploy:
```bash
# En el VPS:
cd /ruta/proyecto
git pull origin main
cd sistema_final/backend
npm install --production
npm run build
pm2 restart pino-api-dev
```

## Web Deploy

| Parámetro | Valor |
|-----------|-------|
| Ruta VPS | `/var/www/dev` |
| URL VPS | `https://rhclaroni.com/dev` |
| Firebase | `pino-5fe44.web.app` |
| Build | `npm run build` → `dist/` |

### Proceso de deploy web:
```bash
cd sistema_final/web
npm run build
# Opción A: Copiar dist/ al VPS
scp -r dist/* usuario@rhclaroni.com:/var/www/dev/
# Opción B: Firebase
firebase deploy --only hosting
```

## Flutter Deploy — 🔴 PENDIENTE

### Paso 1 — Verificar compilación
```bash
cd sistema_final/flutter
flutter analyze
flutter build apk --debug   # Test primero
```

### Paso 2 — Generar signing key (solo primera vez)
```bash
keytool -genkey -v \
  -keystore pino-release-key.jks \
  -alias pino \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Paso 3 — Crear `android/key.properties`
```properties
storePassword=<password>
keyPassword=<password>
keyAlias=pino
storeFile=../../pino-release-key.jks
```

### Paso 4 — Configurar `android/app/build.gradle`
Agregar antes de `android {`:
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

En `android { buildTypes { release } }`:
```groovy
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Paso 5 — Verificar URL de producción
En `flutter/lib/core/config/`, asegurar que el base URL sea:
```dart
static const String baseUrl = 'https://www.rhclaroni.com/api-dev';
```

### Paso 6 — Build release
```bash
flutter build apk --release
# Resultado: build/app/outputs/flutter-apk/app-release.apk
```

### Paso 7 — Distribuir
Copiar el APK a los dispositivos de los ruteros via:
- USB directo
- Google Drive compartido
- Firebase App Distribution (si se configura)

## Variables de Entorno Backend (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3035` |
| `API_PREFIX` | Prefijo global | `api-dev` |
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://...` |
| `JWT_SECRET` | Secreto para JWT | `<secreto>` |
| `JWT_EXPIRES_IN` | TTL access token | `12h` |
| `JWT_REFRESH_EXPIRES_IN` | TTL refresh token | `7d` |
| `CORS_ORIGIN` | Orígenes permitidos | `http://localhost:5173,...` |
| `NODE_ENV` | Entorno | `production` |
| `FIREBASE_PROJECT_ID` | Proyecto Firebase | `pino-5fe44` |

## Verificación de Endpoints en Producción

```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST https://www.rhclaroni.com/api-dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@multitienda.com","password":"123"}' \
  | jq -r '.accessToken')

# 2. Health check
curl -s https://www.rhclaroni.com/api-dev/health

# 3. Listar tiendas
curl -s -H "Authorization: Bearer $TOKEN" \
  https://www.rhclaroni.com/api-dev/stores

# 4. Listar productos (usar storeId real)
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://www.rhclaroni.com/api-dev/products?storeId=<STORE_ID>"

# 5. Verificar cash-shifts
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://www.rhclaroni.com/api-dev/cash-shifts?storeId=<STORE_ID>"

# 6. Verificar departments
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://www.rhclaroni.com/api-dev/departments?storeId=<STORE_ID>"
```

## Conclusión

✅ Infraestructura backend y web funcional y desplegada.
🔴 APK de producción pendiente de generar (guía paso a paso arriba).
⚠️ Verificar endpoints en producción con los curl commands.
