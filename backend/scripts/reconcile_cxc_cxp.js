const { Client } = require('pg');

const LEGACY_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/pino_legacy_db';

async function inspectCliempreCredit() {
  const client = new Client({ connectionString: LEGACY_CONN });
  await client.connect();

  console.log('================================================================');
  console.log('  RECONCILIACIÓN R7: CLIENTES CON CRÉDITO Y TRANSACCIONES CxC');
  console.log('================================================================\n');

  // Summary of credit clients in cliempre
  const creditSummary = await client.query(`
    SELECT 
      COUNT(*) as total_clientes,
      COUNT(CASE WHEN TRIM(credito) = 'Y' OR credito = '1' THEN 1 END) as flag_credito,
      COUNT(CASE WHEN COALESCE(dias, 0) > 0 THEN 1 END) as con_dias,
      COUNT(CASE WHEN COALESCE(limite, 0) > 0 THEN 1 END) as con_limite,
      SUM(COALESCE(limite, 0)) as total_limite
    FROM adminss.cliempre
  `);
  console.log('--- RESUMEN DE CLIENTES EN adminss.cliempre ---');
  console.log(creditSummary.rows[0]);

  // Sample credit clients
  const sampleCredit = await client.query(`
    SELECT codigo, nombre, credito, dias, limite
    FROM adminss.cliempre
    WHERE TRIM(credito) = 'Y' OR COALESCE(dias, 0) > 0 OR COALESCE(limite, 0) > 0
    LIMIT 10
  `);
  console.log('\n--- MUESTRA DE CLIENTES TIPO CRÉDITO EN adminss.cliempre ---');
  console.log(sampleCredit.rows);

  // Now check operclit: are there pending transactions/invoices?
  const operclitSummary = await client.query(`
    SELECT 
      tipodoc,
      COUNT(*) as total_filas,
      SUM(CAST(monto AS NUMERIC)) as total_monto
    FROM adminss.operclit
    GROUP BY tipodoc
    ORDER BY total_filas DESC
  `);
  console.log('\n--- TRANSACCIONES DE CLIENTES (adminss.operclit) POR TIPO ---');
  console.log(operclitSummary.rows);

  await client.end();
}

inspectCliempreCredit().catch(console.error);
