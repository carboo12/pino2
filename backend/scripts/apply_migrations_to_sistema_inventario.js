const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SISTEMA_INV_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';

async function runMigrationsOnSistemaInventario() {
  const client = new Client({ connectionString: SISTEMA_INV_CONN });
  
  try {
    await client.connect();
    console.log('================================================================');
    console.log(' APLICANDO MIGRACIONES DE IA-NÚCLEO A sistema_de_inventario');
    console.log('================================================================\n');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query('SELECT filename FROM schema_migrations');
    const appliedMigrations = new Set(rows.map(r => r.filename));

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => /^[0-9]{4}-[0-9]{2}-[0-9]{2}_.+\.sql$/.test(f))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (!appliedMigrations.has(file)) {
        console.log(`🔄 Ejecutando migración: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            `INSERT INTO schema_migrations (filename) VALUES ($1)`,
            [file],
          );
          await client.query('COMMIT');
          console.log(`✅ Migración aplicada exitosamente: ${file}`);
          appliedCount++;
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Error en migración ${file}:`, err.message);
        }
      }
    }

    console.log(`\n================================================================`);
    console.log(` 🎉 TOTAL MIGRACIONES APLICADAS EN sistema_de_inventario: ${appliedCount}`);
    console.log(`================================================================\n`);

  } finally {
    await client.end();
  }
}

runMigrationsOnSistemaInventario().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
