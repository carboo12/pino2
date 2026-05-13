# DEPLOY PENDIENTE — Ejecutar en VPS Producción

## 1. Conectar al VPS

```bash
ssh usuario@rhclaroni.com
```

## 2. Actualizar código

```bash
cd /ruta/proyecto
git pull origin main
```

## 3. Ejecutar migraciones BD

```bash
cd sistema_final/backend
node migrations/run_all_migrations.js
```

### Verificar que las columnas existen:

```bash
psql -h 190.56.16.85 -U postgres -d multitienda_db -c "
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name LIKE 'bulk%'
ORDER BY column_name;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'cash_shifts' AND column_name LIKE '%denominations'
ORDER BY column_name;

SELECT * FROM schema_migrations ORDER BY applied_at;
"
```

## 4. Reconstruir backend y reiniciar

```bash
cd sistema_final/backend
npm install --production
npm run build
pm2 restart pino-api-dev
```

## 5. Probar endpoints (verificar que no den 500)

```bash
# Login
TOKEN=$(curl -s -X POST https://www.rhclaroni.com/api-dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@multitienda.com","password":"123"}' \
  | jq -r '.accessToken')

# Health
curl -s https://www.rhclaroni.com/api-dev/health

# Endpoints que estaban dando 500
curl -s -H "Authorization: Bearer $TOKEN" "https://www.rhclaroni.com/api-dev/users?storeId=1"
curl -s -H "Authorization: Bearer $TOKEN" "https://www.rhclaroni.com/api-dev/orders?storeId=1"
curl -s -H "Authorization: Bearer $TOKEN" "https://www.rhclaroni.com/api-dev/inventory?storeId=1"
curl -s -H "Authorization: Bearer $TOKEN" "https://www.rhclaroni.com/api-dev/stores"

# Endpoint nuevo default-client
curl -s -H "Authorization: Bearer $TOKEN" "https://www.rhclaroni.com/api-dev/stores/1/default-client"

echo "✅ Si todo responde 200, el deploy está completo."
```

## 6. Reconstruir web (opcional, ya está en Firebase)

```bash
cd sistema_final/web
npm run build
```

## 7. Distribuir APK

Archivo generado: `sistema_final/flutter/build/app/outputs/flutter-apk/app-release.apk`

- USB / Google Drive / Firebase App Distribution

## 8. Pruebas piloto en terreno

Una vez instalado el APK en dispositivos de ruteros:

- [ ] Login con credenciales reales
- [ ] Iniciar ruta → cargar clientes
- [ ] Crear pedido offline (sin datos)
- [ ] Sincronizar al reconectar
- [ ] Realizar cobro
- [ ] Hacer devolución
- [ ] Cierre diario
- [ ] Verificar que todo coincide con el panel web
