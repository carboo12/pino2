# Rotacion de secretos

## Secretos actuales

| Secreto | Donde se usa | Ultima rotacion |
|---------|-------------|-----------------|
| DATABASE_PASSWORD | backend/.env, Docker | 2026-07-24 |
| JWT_SECRET | backend/.env | 2026-07-24 |
| JWT_REFRESH_SECRET | backend/.env | 2026-07-24 |

## Como rotar

1. Generar nuevo secreto:
   ```bash
   openssl rand -base64 32
   ```

2. Actualizar backend/.env

3. Si se rota DB password:
   ```bash
   docker exec postgres_alacaja psql -U postgres -c "ALTER USER pino_app WITH PASSWORD 'nuevo_password';"
   ```

4. Actualizar .env.test.example con el nuevo valor

5. No commitar .env ni .env.test
