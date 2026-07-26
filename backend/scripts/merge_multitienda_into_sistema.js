const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.trim().match(/^([^#][^=]*)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
}

const SOURCE_DATABASE =
  process.env.SOURCE_DATABASE || 'multitienda_db';
const TARGET_DATABASE =
  process.env.TARGET_DATABASE || 'sistema_de_inventario';
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (dryRun === apply) {
  throw new Error('Use exactamente uno: --dry-run o --apply');
}
if (SOURCE_DATABASE !== 'multitienda_db') {
  throw new Error('SOURCE_DATABASE debe ser multitienda_db');
}
if (TARGET_DATABASE !== 'sistema_de_inventario') {
  throw new Error('TARGET_DATABASE debe ser sistema_de_inventario');
}

const TABLES = [
  'users',
  'departments',
  'clients',
  'products',
  'product_barcodes',
  'user_stores',
  'cash_shifts',
  'authorizations',
  'vendor_inventories',
  'orders',
  'order_items',
  'order_status_history',
  'pending_deliveries',
  'sales',
  'sale_items',
  'movements',
  'accounts_receivable',
  'account_payments',
  'notifications',
  'device_tokens',
  'error_logs',
  'outbox_events',
];

const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 300_000,
};

function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/.test(identifier)) {
    throw new Error(`Identificador inválido: ${identifier}`);
  }
  return `"${identifier}"`;
}

async function getInsertableColumns(source, target, table) {
  const sql = `
    SELECT column_name, ordinal_position
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND is_generated = 'NEVER'
     ORDER BY ordinal_position
  `;
  const [sourceResult, targetResult] = await Promise.all([
    source.query(sql, [table]),
    target.query(sql, [table]),
  ]);
  const targetColumns = new Set(
    targetResult.rows.map((row) => row.column_name),
  );
  const columns = sourceResult.rows
    .map((row) => row.column_name)
    .filter((column) => targetColumns.has(column));
  if (!columns.includes('id')) {
    throw new Error(`La tabla ${table} no tiene UUID id copiable`);
  }
  return columns;
}

async function copyMissingRows(source, target, table) {
  const quotedTable = quoteIdentifier(table);
  const columns = await getInsertableColumns(source, target, table);
  const sourceRows = (await source.query(`SELECT * FROM ${quotedTable}`))
    .rows;
  const targetIds = new Set(
    (await target.query(`SELECT id FROM ${quotedTable}`)).rows.map(
      (row) => row.id,
    ),
  );
  const missingRows = sourceRows.filter((row) => !targetIds.has(row.id));

  if (missingRows.length > 0) {
    const quotedColumns = columns.map(quoteIdentifier).join(', ');
    const placeholders = columns
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const insertSql = `
      INSERT INTO ${quotedTable} (${quotedColumns})
      VALUES (${placeholders})
    `;
    for (const row of missingRows) {
      await target.query(
        insertSql,
        columns.map((column) => row[column]),
      );
    }
  }

  let copiedCount = 0;
  if (sourceRows.length > 0) {
    const sourceIds = sourceRows.map((row) => row.id);
    const verify = await target.query(
      `SELECT count(*)::integer as count
         FROM ${quotedTable}
        WHERE id = ANY($1::uuid[])`,
      [sourceIds],
    );
    copiedCount = Number(verify.rows[0].count);
    if (copiedCount !== sourceRows.length) {
      throw new Error(
        `${table}: destino contiene ${copiedCount}/${sourceRows.length} UUID de la fuente`,
      );
    }
  }

  return {
    table,
    sourceRows: sourceRows.length,
    alreadyPresent: sourceRows.length - missingRows.length,
    inserted: missingRows.length,
    sourceIdsVerified: copiedCount,
  };
}

async function validateSharedIdentities(source, target) {
  for (const table of ['chains', 'stores']) {
    const quotedTable = quoteIdentifier(table);
    const sourceRows = (await source.query(
      `SELECT id, name FROM ${quotedTable} ORDER BY id`,
    )).rows;
    const targetRows = (await target.query(
      `SELECT id, name FROM ${quotedTable} WHERE id = ANY($1::uuid[]) ORDER BY id`,
      [sourceRows.map((row) => row.id)],
    )).rows;
    if (sourceRows.length !== targetRows.length) {
      throw new Error(
        `${table}: las identidades compartidas no coinciden`,
      );
    }
    for (let index = 0; index < sourceRows.length; index += 1) {
      if (
        sourceRows[index].id !== targetRows[index].id ||
        sourceRows[index].name !== targetRows[index].name
      ) {
        throw new Error(
          `${table}: contenido distinto para ${sourceRows[index].id}`,
        );
      }
    }
  }
}

async function restoreCollectionLinks(source, target) {
  const sourceRows = (
    await source.query(
      `SELECT id, account_id, client_id, rutero_id, cash_shift_id
         FROM collections`,
    )
  ).rows;
  let updated = 0;
  for (const row of sourceRows) {
    const result = await target.query(
      `UPDATE collections
          SET account_id = $2,
              client_id = $3,
              rutero_id = $4,
              cash_shift_id = $5
        WHERE id = $1
          AND (
            account_id IS DISTINCT FROM $2
            OR client_id IS DISTINCT FROM $3
            OR rutero_id IS DISTINCT FROM $4
            OR cash_shift_id IS DISTINCT FROM $5
          )`,
      [
        row.id,
        row.account_id,
        row.client_id,
        row.rutero_id,
        row.cash_shift_id,
      ],
    );
    updated += result.rowCount || 0;
  }
  return { table: 'collections', sourceRows: sourceRows.length, updated };
}

async function validateIntegrity(target) {
  const checks = {
    sale_items_without_sale: `
      SELECT count(*)::integer AS count
        FROM sale_items i LEFT JOIN sales h ON h.id = i.sale_id
       WHERE h.id IS NULL`,
    sale_items_without_product: `
      SELECT count(*)::integer AS count
        FROM sale_items i LEFT JOIN products p ON p.id = i.product_id
       WHERE p.id IS NULL`,
    order_items_without_order: `
      SELECT count(*)::integer AS count
        FROM order_items i LEFT JOIN orders h ON h.id = i.order_id
       WHERE h.id IS NULL`,
    order_items_without_product: `
      SELECT count(*)::integer AS count
        FROM order_items i LEFT JOIN products p ON p.id = i.product_id
       WHERE p.id IS NULL`,
    movements_without_product: `
      SELECT count(*)::integer AS count
        FROM movements m LEFT JOIN products p ON p.id = m.product_id
       WHERE p.id IS NULL`,
    receivables_without_client: `
      SELECT count(*)::integer AS count
        FROM accounts_receivable a
        LEFT JOIN clients c ON c.id = a.client_id
       WHERE a.client_id IS NOT NULL AND c.id IS NULL`,
    payments_without_receivable: `
      SELECT count(*)::integer AS count
        FROM account_payments p
        LEFT JOIN accounts_receivable a ON a.id = p.account_id
       WHERE a.id IS NULL`,
  };
  const result = {};
  for (const [name, sql] of Object.entries(checks)) {
    result[name] = Number((await target.query(sql)).rows[0].count);
    if (result[name] !== 0) {
      throw new Error(`Integridad inválida: ${name}=${result[name]}`);
    }
  }
  return result;
}

async function financialReconciliation(source, target) {
  const definitions = {
    sales: 'total',
    orders: 'total',
    accounts_receivable: 'remaining_amount',
    account_payments: 'amount',
  };
  const result = {};
  for (const [table, amountColumn] of Object.entries(definitions)) {
    const quotedTable = quoteIdentifier(table);
    const quotedAmount = quoteIdentifier(amountColumn);
    const sourceSummary = (
      await source.query(
        `SELECT count(*)::integer as count,
                COALESCE(sum(${quotedAmount}), 0)::numeric as amount
           FROM ${quotedTable}`,
      )
    ).rows[0];
    const sourceIds = (
      await source.query(`SELECT id FROM ${quotedTable}`)
    ).rows.map((row) => row.id);
    let targetSummary = { count: 0, amount: 0 };
    if (sourceIds.length > 0) {
      targetSummary = (
        await target.query(
          `SELECT count(*)::integer as count,
                  COALESCE(sum(${quotedAmount}), 0)::numeric as amount
             FROM ${quotedTable}
            WHERE id = ANY($1::uuid[])`,
          [sourceIds],
        )
      ).rows[0];
    }
    if (
      Number(sourceSummary.count) !== Number(targetSummary.count) ||
      Number(sourceSummary.amount) !== Number(targetSummary.amount)
    ) {
      throw new Error(`Diferencia monetaria en ${table}`);
    }
    result[table] = {
      sourceCount: Number(sourceSummary.count),
      targetCount: Number(targetSummary.count),
      amount: Number(sourceSummary.amount),
    };
  }
  return result;
}

async function main() {
  const source = new Client({
    ...dbConfig,
    database: SOURCE_DATABASE,
    application_name: 'pino-merge-source',
  });
  const target = new Client({
    ...dbConfig,
    database: TARGET_DATABASE,
    application_name: 'pino-merge-target',
  });
  await Promise.all([source.connect(), target.connect()]);

  const report = {
    mode: dryRun ? 'dry-run' : 'apply',
    source: SOURCE_DATABASE,
    target: TARGET_DATABASE,
    startedAt: new Date().toISOString(),
    tables: [],
  };

  try {
    await source.query(
      'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY',
    );
    await target.query('BEGIN');
    await target.query('SELECT pg_advisory_xact_lock($1)', [825472026]);

    await validateSharedIdentities(source, target);
    for (const table of TABLES) {
      const tableReport = await copyMissingRows(
        source,
        target,
        table,
      );
      report.tables.push(tableReport);
      process.stdout.write(
        `${table}: +${tableReport.inserted} (${tableReport.sourceIdsVerified}/${tableReport.sourceRows})\n`,
      );
    }

    report.collectionLinks = await restoreCollectionLinks(source, target);
    report.integrity = await validateIntegrity(target);
    report.financial = await financialReconciliation(source, target);
    report.finishedAt = new Date().toISOString();

    if (dryRun) {
      await target.query('ROLLBACK');
      report.transaction = 'ROLLED_BACK';
    } else {
      await target.query('COMMIT');
      report.transaction = 'COMMITTED';
    }
    await source.query('ROLLBACK');
  } catch (error) {
    await target.query('ROLLBACK').catch(() => {});
    await source.query('ROLLBACK').catch(() => {});
    report.transaction = 'ROLLED_BACK_ON_ERROR';
    report.error = error.message;
    throw error;
  } finally {
    fs.writeFileSync(
      '/tmp/pino_merge_last_report.json',
      JSON.stringify(report, null, 2),
    );
    await Promise.all([source.end(), target.end()]);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
