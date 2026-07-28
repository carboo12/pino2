const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DB_CONFIG = {
  host: '190.56.16.85',
  port: 5432,
  user: 'alacaja',
  password: '__DB_PASSWORD_PLACEHOLDER__',
  database: 'multitienda_db',
};

async function seed() {
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    console.log('🚀 Conectado a la DB para el Seeding...');

    // 1. Limpiar datos previos (en orden inverso de dependencias) con TRUNCATE CASCADE
    console.log('🧹 Limpiando tablas...');
    await client.query('TRUNCATE TABLE sale_items, sales, cash_shifts, order_items, orders, invoice_items, invoices, products, departments, user_stores, users, stores, chains, clients, suppliers, authorizations, error_logs, config CASCADE');

    // 2. Chains
    console.log('🔗 Insertando Cadena Única Oficial...');
    const chainRes = await client.query(`
      INSERT INTO chains (name, owner_name, owner_email, status)
      VALUES 
        ('Grupo Los Pinos', 'Carlos Lira', 'carlos@lospinos.com', 'active')
      RETURNING id, name
    `);
    const chainId = chainRes.rows[0].id;

    // 3. Stores
    console.log('🏪 Insertando las 3 Sucursales Oficiales...');
    const storeRes = await client.query(`
      INSERT INTO stores (chain_id, name, address, phone, store_type, is_active, settings)
      VALUES 
        ($1, 'Bodega Central Los Pinos', 'Managua, Nicaragua', '2222-1111', 'BODEGA_CENTRAL', true, '{"taxRate": 15, "currency": "NIO", "exchangeRate": 36.62}'),
        ($1, 'Distribuidora Los Pinos', 'Rivas, Nicaragua', '2222-2222', 'DISTRIBUIDORA', true, '{"taxRate": 15, "currency": "NIO", "exchangeRate": 36.62}'),
        ($1, 'Supermercado Los Pinos', 'Estelí, Nicaragua', '2222-3333', 'SUPERMERCADO', true, '{"taxRate": 15, "currency": "NIO", "exchangeRate": 36.62}')
      RETURNING id, name
    `, [chainId]);
    const storeId = storeRes.rows[0].id;
    const storeId2 = storeRes.rows[1].id;

    // 4. Users
    console.log('👥 Insertando Usuarios...');
    const passHash = await bcrypt.hash('admin123', 10);
    const userRes = await client.query(`
      INSERT INTO users (email, password_hash, name, role, is_active)
      VALUES 
        ('admin@multitienda.com', $1, 'Super Administrador', 'master-admin', true),
        ('gerente@tienda.com', $1, 'Gerente de Tienda', 'store-admin', true),
        ('cajero@tienda.com', $1, 'Cajero Principal', 'cashier', true),
        ('bodeguero@tienda.com', $1, 'Juan Bodeguero', 'warehouse', true),
        ('vendedor@tienda.com', $1, 'Marcos Vendedor', 'vendor', true)
      RETURNING id, role
    `, [passHash]);
    const masterAdminId = userRes.rows[0].id;
    const storeAdminId = userRes.rows[1].id;
    const cashierId = userRes.rows[2].id;

    // 5. Vincular Usuarios a Tiendas
    await client.query(`
      INSERT INTO user_stores (user_id, store_id)
      VALUES ($1, $2), ($3, $4)
    `, [storeAdminId, storeId, cashierId, storeId2]);

    // 6. Departments
    console.log('📁 Insertando Departamentos...');
    const deptRes = await client.query(`
      INSERT INTO departments (store_id, name, description)
      VALUES 
        ($1, 'Abarrotes', 'Productos básicos y comida'),
        ($1, 'Bebidas', 'Refrescos y licores'),
        ($1, 'Limpieza', 'Artículos de aseo hogar')
      RETURNING id, name
    `, [storeId]);
    const deptId = deptRes.rows[0].id;

    // 7. Products
    console.log('📦 Insertando Productos...');
    await client.query(`
      INSERT INTO products (store_id, department_id, barcode, description, sale_price, cost_price, current_stock, min_stock, brand, uses_inventory)
      VALUES 
        ($1, $2, '7411001', 'Arroz Faisán 10lb', 145.50, 110.00, 50, 10, 'Faisan', true),
        ($1, $2, '7411002', 'Aceite Patrona 1L', 78.00, 60.00, 100, 20, 'Patrona', true),
        ($1, $2, '7411003', 'Frijoles Rojos 1lb', 35.00, 28.00, 200, 50, 'Generico', true),
        ($1, $2, '7411004', 'Coca Cola 2L', 45.00, 32.00, 48, 12, 'Coca Cola', true),
        ($1, $2, '7411005', 'Detergente Omo 500g', 32.00, 22.00, 60, 15, 'Unilever', true)
    `, [storeId, deptId]);

    // 8. Clients
    console.log('👤 Insertando Clientes...');
    const clientDataRes = await client.query(`
      INSERT INTO clients (store_id, name, email, phone, address)
      VALUES 
        ($1, 'Consumidor Final', 'final@cliente.com', '0000-0000', 'Ventas de mostrador'),
        ($1, 'Juan Pérez Lopez', 'jperez@gmail.com', '8888-7777', 'Bosques de Altamira #12')
      RETURNING id
    `, [storeId]);

    // 9. Cash Shifts
    console.log('💰 Abriendo Turnos de Caja...');
    const shiftRes = await client.query(`
      INSERT INTO cash_shifts (store_id, opened_by, starting_cash, status)
      VALUES ($1, $2, 1000.00, 'OPEN')
      RETURNING id
    `, [storeId, cashierId]);
    const shiftId = shiftRes.rows[0].id;

    // 10. Authorizations (Pendientes)
    console.log('🔐 Insertando Autorizaciones...');
    await client.query(`
      INSERT INTO authorizations (store_id, requester_id, type, details, status)
      VALUES 
        ($1, $2, 'PRICE_OVERRIDE', '{"originalPrice": 145, "newPrice": 130, "product": "Arroz Faisan"}', 'PENDING'),
        ($1, $2, 'VOID_TICKET', '{"ticketNumber": "TK-1001", "reason": "Error en cantidad"}', 'PENDING')
    `, [storeId, cashierId]);

    // 11. Config General
    console.log('⚙️ Insertando Configuración...');
    await client.query(`
      INSERT INTO config (key, value)
      VALUES 
        ('general', '{"appName": "MultiTienda Los Pinos", "version": "1.2.0", "maintenance": false}'),
        ('branding', '{"primaryColor": "#2563eb", "logo": "/assets/logo.png"}')
    `);

    console.log('✅ SEED COMPLETADO SATISFACTORIAMENTE');
  } catch (err) {
    console.error('❌ Error durante el Seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
