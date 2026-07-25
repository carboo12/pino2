-- Tablas faltantes detectadas en analisis de gaps vs escenarios
-- Ver docs/GAP_ANALYSIS.md para detalle

BEGIN;

-- 1. VEHICLES / FLEET MANAGEMENT
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  plate varchar(20) NOT NULL,
  brand varchar(50) NOT NULL,
  model varchar(50),
  year integer,
  type varchar(30) NOT NULL DEFAULT 'TRUCK' CHECK (type IN ('TRUCK', 'VAN', 'MOTORCYCLE', 'PICKUP')),
  capacity_kg numeric(10,2),
  fuel_type varchar(20) DEFAULT 'DIESEL',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE')),
  last_maintenance_km integer DEFAULT 0,
  next_maintenance_km integer DEFAULT 5000,
  insurance_expiry date,
  technical_inspection_expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  maintenance_type varchar(30) NOT NULL CHECK (maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'ACCIDENT')),
  description text NOT NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  mileage_at_service integer,
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  provider varchar(100),
  invoice_ref varchar(50),
  next_maintenance_km integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_fuel_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid REFERENCES users(id),
  liters numeric(10,2) NOT NULL,
  cost_per_liter numeric(10,2) NOT NULL,
  total_cost numeric(12,2) NOT NULL,
  mileage integer,
  station varchar(100),
  fueled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_accidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_id uuid REFERENCES users(id),
  accident_date timestamptz NOT NULL DEFAULT now(),
  location text,
  description text NOT NULL,
  vehicle_damage_cost numeric(12,2) DEFAULT 0,
  cargo_damage_cost numeric(12,2) DEFAULT 0,
  third_party_damage numeric(12,2) DEFAULT 0,
  police_report_ref varchar(50),
  insurance_claim_ref varchar(50),
  status varchar(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'IN_PROCESS', 'RESOLVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. PURCHASE ORDERS (Supplier orders)
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  supplier_id uuid REFERENCES suppliers(id),
  order_number varchar(50) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED')),
  expected_date date,
  notes text,
  created_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  total_amount numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  ordered_quantity integer NOT NULL CHECK (ordered_quantity > 0),
  received_quantity integer DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL,
  total_cost numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CLIENT CONTRACTS
CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  contract_number varchar(50) NOT NULL,
  contract_type varchar(30) NOT NULL CHECK (contract_type IN ('CREDIT', 'DISTRIBUTION', 'COMMISSARY')),
  credit_limit numeric(12,2) DEFAULT 0,
  payment_terms integer DEFAULT 30,
  interest_rate numeric(5,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date,
  status varchar(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED')),
  notes text,
  signed_by_client boolean DEFAULT false,
  document_url varchar(500),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  name varchar(200) NOT NULL,
  description text,
  discount_type varchar(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'BUNDLE')),
  discount_value numeric(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status varchar(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  UNIQUE (promotion_id, product_id)
);

-- 5. SALES COMMISSIONS
CREATE TABLE IF NOT EXISTS commission_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  role varchar(30) NOT NULL,
  product_category varchar(50),
  commission_percent numeric(5,2) NOT NULL DEFAULT 0,
  min_sale_amount numeric(12,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_commissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL REFERENCES stores(id),
  user_id uuid NOT NULL REFERENCES users(id),
  sale_id uuid REFERENCES sales(id),
  order_id uuid REFERENCES orders(id),
  commission_rate_id uuid REFERENCES commission_rates(id),
  sale_amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  status varchar(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. EXPENSES INDEXES
CREATE INDEX IF NOT EXISTS idx_expenses_store_date ON expenses(store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

COMMIT;
