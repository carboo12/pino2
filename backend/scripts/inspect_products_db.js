const { Client } = require('pg');

const DB_CONN = 'postgresql://alacaja:HY1kE7TZsyCnfy7stfBhVZoczA02CWd8@190.56.16.85:5432/sistema_de_inventario';
const STORE_ID = '9321856d-19ba-42b8-ba47-cf35c0d133dd';

async function inspectProducts() {
  const client = new Client({ connectionString: DB_CONN });
  await client.connect();

  console.log('================================================================');
  console.log('  INSPECCIONANDO PRODUCTOS Y DEPARTAMENTOS EN POSTGRESQL');
  console.log('================================================================\n');

  // 1. Total de productos por store_id
  const totalRes = await client.query('SELECT COUNT(*) FROM products WHERE store_id = $1', [STORE_ID]);
  console.log(`Total Productos en Store ${STORE_ID}: ${totalRes.rows[0].count}`);

  // 2. Total de productos activos
  const activeRes = await client.query('SELECT COUNT(*) FROM products WHERE store_id = $1 AND is_active = true', [STORE_ID]);
  console.log(`Productos Activos (is_active = true): ${activeRes.rows[0].count}`);

  // 3. Productos sin department_id o con department_id
  const nullDeptRes = await client.query('SELECT COUNT(*) FROM products WHERE store_id = $1 AND department_id IS NULL', [STORE_ID]);
  console.log(`Productos con department_id NULL: ${nullDeptRes.rows[0].count}`);

  const withDeptRes = await client.query('SELECT COUNT(*) FROM products WHERE store_id = $1 AND department_id IS NOT NULL', [STORE_ID]);
  console.log(`Productos con department_id VÁLIDO: ${withDeptRes.rows[0].count}`);

  // 4. Muestra de departamentos y conteo de productos vinculados
  const deptsRes = await client.query(`
    SELECT d.id, d.name, COUNT(p.id) as product_count
      FROM departments d
      LEFT JOIN products p ON p.department_id = d.id AND p.is_active = true
     WHERE d.store_id = $1
     GROUP BY d.id, d.name
     ORDER BY product_count DESC
     LIMIT 15
  `, [STORE_ID]);

  console.log('\nTop 15 Departamentos y sus conteos de productos:');
  console.table(deptsRes.rows);

  // 5. Muestra de productos y sus department_ids vs departamento asignado
  const sampleProducts = await client.query(`
    SELECT p.id, p.description, p.department_id, d.name as department_name, p.is_active
      FROM products p
      LEFT JOIN departments d ON d.id = p.department_id
     WHERE p.store_id = $1
     LIMIT 10
  `, [STORE_ID]);

  console.log('\nMuestra de 10 productos:');
  console.table(sampleProducts.rows);

  await client.end();
}

inspectProducts().catch(console.error);
