-- schema.sql
-- Archivo maestro DDL para MultiTienda (PostgreSQL Puro)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas maestras de contexto
CREATE TABLE IF NOT EXISTS chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    logo_url TEXT,
    owner_name VARCHAR(100),
    owner_email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios y Autenticación
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE(user_id, store_id)
);

-- Catálogo
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    description TEXT NOT NULL,
    sale_price DECIMAL(12, 2) NOT NULL,
    cost_price DECIMAL(12, 2) DEFAULT 0,
    current_stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices críticos para performance (Kárdex y MultiTienda)
CREATE INDEX IF NOT EXISTS idx_products_store_barcode ON products(store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Códigos de barra multi-barcode (fuente única de verdad)
CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL,
    label VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_barcodes_unique_code ON product_barcodes(barcode, store_id);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode_lookup ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON product_barcodes(product_id);

-- Ventas y Caja
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    opened_by UUID REFERENCES users(id),
    closed_by UUID REFERENCES users(id),
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'OPEN',
    starting_cash DECIMAL(12, 2) NOT NULL,
    expected_cash DECIMAL(12, 2),
    actual_cash DECIMAL(12, 2),
    difference DECIMAL(12, 2)
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    cash_shift_id UUID REFERENCES cash_shifts(id),
    cashier_id UUID REFERENCES users(id),
    ticket_number VARCHAR(50) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    external_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

-- Inventario (Kárdex)
CREATE TABLE IF NOT EXISTS movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'IN', 'OUT'
    quantity INT NOT NULL,
    balance INT NOT NULL,  -- Saldo resultante tras el movimiento (KARDEX)
    reference VARCHAR(100), -- ej. 'Venta TKT-1020', 'Ajuste inventario'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones Offline a Online
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log de idempotencia para sync offline (evita duplicados)
CREATE TABLE IF NOT EXISTS sync_idempotency_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    external_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_sync_idempotency_store_ext_entity UNIQUE (store_id, external_id, entity_type)
);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_store ON sync_idempotency_log(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_created ON sync_idempotency_log(created_at DESC);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(150),
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sales_manager_name VARCHAR(150),
    total DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'PENDING',
    notes TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    external_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status);

-- Zonas Geográficas
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licencias
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    license_key VARCHAR(100),
    status VARCHAR(30) DEFAULT 'Activa',
    type VARCHAR(50) DEFAULT 'standard',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    max_users INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facturas de Proveedor
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    payment_type VARCHAR(30) DEFAULT 'Contado',
    due_date TIMESTAMP,
    total DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Pendiente',
    cashier_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

-- Configuración Global (key-value)
CREATE TABLE IF NOT EXISTS config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extensiones de productos (columnas que faltan)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price1 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price2 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price3 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price4 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price5 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS uses_inventory BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_department VARCHAR(100);

-- ============================================================
-- SECCIÓN 2: TABLAS FANTASMA (código las usa, DDL faltaba)
-- ============================================================

-- Inventario del Vendedor/Rutero (vendor-inventories.service.ts las consulta)
CREATE TABLE IF NOT EXISTS vendor_inventories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    assigned_quantity INT DEFAULT 0,
    sold_quantity INT DEFAULT 0,
    current_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, product_id)
);

-- Cuentas por Cobrar (accounts-receivable.service.ts las consulta)
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    remaining_amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pagos de Cuentas por Cobrar (accounts-receivable.service.ts → addPayment)
CREATE TABLE IF NOT EXISTS account_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts_receivable(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    notes TEXT,
    collected_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos Pendientes (pending-orders.service.ts las consulta)
CREATE TABLE IF NOT EXISTS pending_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    items JSONB DEFAULT '[]',
    total DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pendiente',
    dispatched_by VARCHAR(255),
    dispatched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Entregas Pendientes (pending-deliveries.service.ts las consulta)
CREATE TABLE IF NOT EXISTS pending_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    rutero_id UUID REFERENCES users(id) ON DELETE SET NULL,
    address TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Pendiente',
    route_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zonas por tienda para vendedores (vendor-zones-page.tsx)
CREATE TABLE IF NOT EXISTS store_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50),
    description TEXT,
    visit_day VARCHAR(30) DEFAULT 'Ninguno',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitas del Vendedor (vendor-dashboard-page.tsx)
CREATE TABLE IF NOT EXISTS visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    notes TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SECCIÓN 3: TABLAS NUEVAS (requeridas por requerimiento.txt)
-- ============================================================

-- Devoluciones del Rutero (req. §6.6, §15)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rutero_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    total DECIMAL(12, 2) DEFAULT 0,
    external_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity_bulks INT DEFAULT 0,
    quantity_units INT DEFAULT 0,
    unit_price DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) DEFAULT 0
);

-- Cobros del Rutero (req. §6.5, §14)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts_receivable(id) ON DELETE SET NULL,
    rutero_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'CASH',
    notes TEXT,
    external_id UUID UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cuentas por Pagar (req. §12.3)
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    remaining_amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payable_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts_payable(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'TRANSFER',
    notes TEXT,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cierre de Caja del Rutero (req. §14.3 — solo campos confirmados, no inventar estructura)
CREATE TABLE IF NOT EXISTS daily_closings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    rutero_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_collections DECIMAL(12, 2) DEFAULT 0,
    total_returns DECIMAL(12, 2) DEFAULT 0,
    cash_total DECIMAL(12, 2) DEFAULT 0,
    closing_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rutas Formales del Vendedor (routes.service.ts usa `routes` hoy)
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_ids JSONB DEFAULT '[]',
    route_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuración y trazabilidad opcional de consultas lentas
CREATE TABLE IF NOT EXISTS consultasql (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    umbral_ms INTEGER NOT NULL DEFAULT 200 CHECK (umbral_ms >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO consultasql (id, activo, umbral_ms)
VALUES (1, FALSE, 200)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS consultasql_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operacion VARCHAR(20),
    origen VARCHAR(30) NOT NULL DEFAULT 'pool',
    duracion_ms INTEGER NOT NULL,
    row_count INTEGER,
    consulta TEXT NOT NULL,
    parametros JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SECCIÓN 4: COLUMNAS NUEVAS EN TABLAS EXISTENTES
-- ============================================================

-- 4.1 Productos: Bultos y Unidades (req. §10 — punto fuerte del requerimiento)
ALTER TABLE products ADD COLUMN IF NOT EXISTS units_per_bulk INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_bulks INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_units INT DEFAULT 0;

-- 4.2 Pedidos: Tipo de pago y nivel de precio (req. §7.1, §11)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'CONTADO';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_level INT DEFAULT 1;

-- 4.3 Items de pedido: Presentación y nivel de precio
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS presentation VARCHAR(10) DEFAULT 'UNIT';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS price_level INT DEFAULT 1;

-- 4.4 Movimientos de Kárdex: Bultos y Unidades
ALTER TABLE movements ADD COLUMN IF NOT EXISTS quantity_bulks INT DEFAULT 0;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS quantity_units INT DEFAULT 0;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS balance_bulks INT DEFAULT 0;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS balance_units INT DEFAULT 0;

-- 4.5 Inventario Vendedor: Bultos y Unidades
ALTER TABLE vendor_inventories ADD COLUMN IF NOT EXISTS assigned_bulks INT DEFAULT 0;
ALTER TABLE vendor_inventories ADD COLUMN IF NOT EXISTS assigned_units INT DEFAULT 0;
ALTER TABLE vendor_inventories ADD COLUMN IF NOT EXISTS current_bulks INT DEFAULT 0;
ALTER TABLE vendor_inventories ADD COLUMN IF NOT EXISTS current_units INT DEFAULT 0;

-- 4.6 Zonas por tienda: dia de visita para dashboard vendedor
ALTER TABLE store_zones ADD COLUMN IF NOT EXISTS visit_day VARCHAR(30) DEFAULT 'Ninguno';

-- 4.7 Arquitectura Multi-Local Organizativa
ALTER TABLE stores ADD COLUMN IF NOT EXISTS store_type VARCHAR(50) DEFAULT 'SUPERMERCADO';

-- 4.8 Caja: Denominaciones de apertura/cierre (arqueo)
ALTER TABLE cash_shifts ADD COLUMN IF NOT EXISTS opening_denominations JSONB;
ALTER TABLE cash_shifts ADD COLUMN IF NOT EXISTS closing_denominations JSONB;

-- 4.9 Productos: Precios por Bulto (niveles 1-5, espejo de price1..price5)
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price_1 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price_2 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price_3 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price_4 DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price_5 DECIMAL(12, 2) DEFAULT 0;

-- ============================================================
-- SECCIÓN 5: ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vendor_inventories_vendor ON vendor_inventories(vendor_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_store ON accounts_receivable(store_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client ON accounts_receivable(client_id);
CREATE INDEX IF NOT EXISTS idx_returns_store ON returns(store_id);
CREATE INDEX IF NOT EXISTS idx_returns_rutero ON returns(rutero_id);
CREATE INDEX IF NOT EXISTS idx_collections_rutero_date ON collections(rutero_id, created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_store ON accounts_payable(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_closings_rutero ON daily_closings(rutero_id, closing_date);
CREATE INDEX IF NOT EXISTS idx_pending_orders_store ON pending_orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_deliveries_store ON pending_deliveries(store_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_deliveries_rutero ON pending_deliveries(rutero_id);
CREATE INDEX IF NOT EXISTS idx_store_zones_store ON store_zones(store_id);
CREATE INDEX IF NOT EXISTS idx_routes_store ON routes(store_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_store_vendor ON visit_logs(store_id, vendor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_consultasql_historial_created_at ON consultasql_historial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultasql_historial_duracion ON consultasql_historial(duracion_ms DESC);
