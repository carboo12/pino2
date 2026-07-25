

CREATE TABLE IF NOT EXISTS public.account_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid,
    amount numeric(15,2),
    payment_method character varying(50),
    notes text,
    collected_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    supplier_id uuid,
    invoice_id uuid,
    total_amount numeric(12,2) NOT NULL,
    remaining_amount numeric(12,2) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    client_id uuid,
    order_id uuid,
    total_amount numeric(15,2),
    remaining_amount numeric(15,2),
    description text,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ar_balance_valid CHECK (((total_amount >= (0)::numeric) AND (remaining_amount >= (0)::numeric) AND (remaining_amount <= total_amount)))
);
CREATE TABLE IF NOT EXISTS public.arqueos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    rutero_id uuid NOT NULL,
    realizado_por uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    efectivo_declarado numeric(12,2) DEFAULT 0 NOT NULL,
    efectivo_contado numeric(12,2) DEFAULT 0 NOT NULL,
    diferencia numeric(12,2) DEFAULT 0,
    cheques numeric(12,2) DEFAULT 0,
    depositos numeric(12,2) DEFAULT 0,
    notas text,
    status character varying(20) DEFAULT 'PENDIENTE'::character varying,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.authorizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    requester_id uuid,
    type character varying(50) NOT NULL,
    details jsonb,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.cargas_camion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    rutero_id uuid NOT NULL,
    camion_placa character varying(20),
    fecha_carga date DEFAULT CURRENT_DATE NOT NULL,
    fecha_salida timestamp without time zone,
    status character varying(20) DEFAULT 'ALISTANDO'::character varying,
    total_pedidos integer DEFAULT 0,
    total_bultos integer DEFAULT 0,
    total_unidades_sueltas integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.cash_shifts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    opened_by uuid,
    closed_by uuid,
    opened_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at timestamp without time zone,
    status character varying(20) DEFAULT 'OPEN'::character varying,
    starting_cash numeric(12,2) NOT NULL,
    expected_cash numeric(12,2),
    actual_cash numeric(12,2),
    difference numeric(12,2),
    opening_denominations jsonb,
    closing_denominations jsonb
);
CREATE TABLE IF NOT EXISTS public.chains (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    logo_url text,
    owner_name character varying(100),
    owner_email character varying(100),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    name character varying(150) NOT NULL,
    email character varying(150),
    phone character varying(20),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    grupo_economico_id uuid,
    grupo_cliente_id uuid,
    preventa_id uuid,
    zona character varying(100),
    limite_credito numeric(12,2) DEFAULT 0,
    saldo_pendiente numeric(12,2) DEFAULT 0,
    dias_credito integer DEFAULT 8,
    frecuencia_visita character varying(50) DEFAULT 'semanal'::character varying,
    dia_visita character varying(20),
    notas_entrega text,
    is_active boolean DEFAULT true,
    lat numeric(10,7),
    lng numeric(10,7),
    type character varying(50) DEFAULT 'NORMAL'::character varying,
    version bigint DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    account_id uuid,
    rutero_id uuid,
    client_id uuid,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(30) DEFAULT 'CASH'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    external_id uuid,
    cash_shift_id uuid
);
CREATE TABLE IF NOT EXISTS public.config (
    key character varying(255) NOT NULL,
    value jsonb,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.consultasql (
    id smallint DEFAULT 1 NOT NULL,
    activo boolean DEFAULT false NOT NULL,
    umbral_ms integer DEFAULT 200 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT consultasql_id_check CHECK ((id = 1)),
    CONSTRAINT consultasql_umbral_ms_check CHECK ((umbral_ms >= 0))
);
CREATE TABLE IF NOT EXISTS public.consultasql_historial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operacion character varying(20),
    origen character varying(30) DEFAULT 'pool'::character varying NOT NULL,
    duracion_ms integer NOT NULL,
    row_count integer,
    consulta text NOT NULL,
    parametros jsonb,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.daily_closings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    rutero_id uuid,
    total_sales numeric(12,2) DEFAULT 0,
    total_collections numeric(12,2) DEFAULT 0,
    total_returns numeric(12,2) DEFAULT 0,
    cash_total numeric(12,2) DEFAULT 0,
    closing_date date NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.departments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_id uuid
);
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message text,
    stack text,
    location text,
    user_id uuid,
    store_id uuid,
    additional_info jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    cash_shift_id uuid,
    amount numeric(15,2),
    description text,
    category character varying(100),
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.grupos_clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    color character varying(20) DEFAULT '#3B82F6'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.grupos_economicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    nombre character varying(200) NOT NULL,
    limite_credito_global numeric(12,2) DEFAULT 0,
    notas text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.historial_asignacion_clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    preventa_anterior_id uuid,
    preventa_nuevo_id uuid,
    motivo text,
    realizado_por uuid,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    quantity integer DEFAULT 0,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.inventory_ledger (
    id bigint NOT NULL,
    store_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    product_id uuid NOT NULL,
    location_type character varying(20) NOT NULL,
    location_id uuid NOT NULL,
    movement_type character varying(40) NOT NULL,
    quantity integer NOT NULL,
    balance_after integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT inventory_ledger_balance_after_check CHECK ((balance_after >= 0)),
    CONSTRAINT inventory_ledger_quantity_check CHECK ((quantity <> 0))
);
CREATE SEQUENCE IF NOT EXISTS public.inventory_ledger_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.inventory_ledger_id_seq OWNED BY public.inventory_ledger.id;
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_id uuid,
    product_id uuid,
    description text,
    quantity numeric(15,2),
    unit_price numeric(15,2),
    subtotal numeric(15,2)
);
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    supplier_id uuid,
    invoice_number character varying(255),
    payment_type character varying(50),
    due_date timestamp without time zone,
    total numeric(15,2),
    status character varying(50),
    cashier_name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    license_key character varying(255),
    status character varying(50) DEFAULT 'active'::character varying,
    type character varying(50),
    start_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    end_date timestamp without time zone,
    max_users integer DEFAULT 5,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.liquidaciones_ruta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    rutero_id uuid NOT NULL,
    fecha_ruta date NOT NULL,
    total_pedidos integer DEFAULT 0,
    total_entregados integer DEFAULT 0,
    total_rechazados integer DEFAULT 0,
    total_cobrado_contado numeric(12,2) DEFAULT 0,
    total_cobrado_credito numeric(12,2) DEFAULT 0,
    total_devoluciones numeric(12,2) DEFAULT 0,
    efectivo_esperado numeric(12,2) DEFAULT 0,
    efectivo_entregado numeric(12,2) DEFAULT 0,
    diferencia numeric(12,2) DEFAULT 0,
    arqueo_id uuid,
    status character varying(20) DEFAULT 'PENDIENTE'::character varying,
    liquidado_por uuid,
    notas text,
    created_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    product_id uuid,
    user_id uuid,
    type character varying(20) NOT NULL,
    quantity integer NOT NULL,
    balance integer NOT NULL,
    reference character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantity_bulks integer DEFAULT 0,
    quantity_units integer DEFAULT 0,
    balance_bulks integer DEFAULT 0,
    balance_units integer DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    user_id uuid,
    type character varying(50) DEFAULT 'info'::character varying,
    title character varying(255),
    message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    quantity numeric(15,2),
    unit_price numeric(15,2),
    subtotal numeric(15,2),
    presentation character varying(10) DEFAULT 'UNIT'::character varying,
    price_level integer DEFAULT 1,
    CONSTRAINT order_items_quantity_positive CHECK (((quantity > (0)::numeric) AND (unit_price >= (0)::numeric) AND (subtotal >= (0)::numeric)))
);
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid,
    status character varying(50) NOT NULL,
    user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    client_id uuid,
    client_name character varying(255),
    vendor_id uuid,
    sales_manager_name character varying(255),
    total numeric(15,2),
    notes text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_type character varying(20) DEFAULT 'CONTADO'::character varying,
    price_level integer DEFAULT 1,
    external_id uuid,
    tipo_pedido character varying(30) DEFAULT 'VENTA_ESTANDAR'::character varying,
    requiere_cobro boolean DEFAULT true,
    requiere_autorizacion boolean DEFAULT false,
    autorizado_por uuid,
    fecha_autorizacion timestamp without time zone,
    rutero_id uuid,
    camion_id character varying(100),
    fecha_entrega_programada date,
    grupo_carga_id uuid,
    version bigint DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT orders_payment_type_valid CHECK (((payment_type)::text = ANY ((ARRAY['CONTADO'::character varying, 'CREDITO'::character varying])::text[])))
);
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    aggregate_type character varying(50) NOT NULL,
    aggregate_id uuid NOT NULL,
    store_id uuid NOT NULL,
    event_type character varying(80) NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text
);
CREATE TABLE IF NOT EXISTS public.payable_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(30) DEFAULT 'TRANSFER'::character varying,
    notes text,
    paid_by uuid,
    paid_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.pending_deliveries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    order_id uuid,
    client_id uuid,
    address text,
    notes text,
    status character varying(50) DEFAULT 'Pendiente'::character varying,
    rutero_id uuid,
    route_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.pending_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    client_id uuid,
    client_name character varying(255),
    items jsonb,
    total numeric(15,2),
    notes text,
    payment_method character varying(50),
    status character varying(50) DEFAULT 'Pendiente'::character varying,
    dispatched_by character varying(255),
    dispatched_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.product_barcodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    store_id uuid NOT NULL,
    barcode character varying(100) NOT NULL,
    label character varying(100),
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    department_id uuid,
    barcode character varying(100),
    description text NOT NULL,
    sale_price numeric(12,2) NOT NULL,
    cost_price numeric(12,2) DEFAULT 0,
    current_stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    uses_inventory boolean DEFAULT true,
    min_stock integer DEFAULT 0,
    brand character varying(100),
    wholesale_price numeric(12,2) DEFAULT 0,
    price1 numeric(12,2) DEFAULT 0,
    price2 numeric(12,2) DEFAULT 0,
    price3 numeric(12,2) DEFAULT 0,
    price4 numeric(12,2) DEFAULT 0,
    price5 numeric(12,2) DEFAULT 0,
    supplier_id uuid,
    sub_department character varying(100),
    units_per_bulk integer DEFAULT 1,
    stock_bulks integer DEFAULT 0,
    stock_units integer DEFAULT 0,
    bulk_price_1 numeric(12,2) DEFAULT 0,
    bulk_price_2 numeric(12,2) DEFAULT 0,
    bulk_price_3 numeric(12,2) DEFAULT 0,
    bulk_price_4 numeric(12,2) DEFAULT 0,
    bulk_price_5 numeric(12,2) DEFAULT 0,
    version bigint DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT products_stock_nonnegative CHECK (((current_stock >= 0) AND (stock_bulks >= 0) AND (stock_units >= 0))),
    CONSTRAINT products_units_per_bulk_positive CHECK ((units_per_bulk > 0))
);
CREATE TABLE IF NOT EXISTS public.return_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    return_id uuid,
    product_id uuid,
    quantity_bulks integer DEFAULT 0,
    quantity_units integer DEFAULT 0,
    unit_price numeric(12,2) DEFAULT 0,
    subtotal numeric(12,2) DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.returns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    order_id uuid,
    rutero_id uuid,
    notes text,
    total numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    external_id uuid
);
CREATE TABLE IF NOT EXISTS public.routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    vendor_id uuid,
    client_ids jsonb DEFAULT '[]'::jsonb,
    route_date timestamp without time zone,
    notes text,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.sale_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sale_id uuid,
    product_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    returned_quantity integer DEFAULT 0 NOT NULL,
    CONSTRAINT sale_items_quantity_positive CHECK (((quantity > 0) AND (unit_price >= (0)::numeric) AND (subtotal >= (0)::numeric))),
    CONSTRAINT sale_items_returned_valid CHECK (((returned_quantity >= 0) AND (returned_quantity <= quantity)))
);
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    cash_shift_id uuid,
    cashier_id uuid,
    ticket_number character varying(50) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'CASH'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    external_id uuid,
    client_id uuid,
    client_name character varying(200),
    cashier_name character varying(200),
    payment_currency character varying(10) DEFAULT 'NIO'::character varying,
    amount_received numeric(12,2) DEFAULT 0,
    change_given numeric(12,2) DEFAULT 0,
    version bigint DEFAULT 1 NOT NULL,
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.store_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    visit_day character varying(30) DEFAULT 'Ninguno'::character varying
);
CREATE TABLE IF NOT EXISTS public.stores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chain_id uuid,
    name character varying(100) NOT NULL,
    address text,
    phone character varying(20),
    settings jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    store_type character varying(50) DEFAULT 'SUPERMERCADO'::character varying
);
CREATE TABLE IF NOT EXISTS public.sub_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id uuid,
    name character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chain_id uuid,
    name character varying(150) NOT NULL,
    contact_name character varying(150),
    email character varying(150),
    phone character varying(20),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.sync_cursors (
    node_id uuid NOT NULL,
    store_id uuid NOT NULL,
    stream character varying(50) NOT NULL,
    last_event_id bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.sync_idempotency_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    external_id uuid NOT NULL,
    entity_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.sync_inbox (
    id bigint NOT NULL,
    store_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    source_node_id uuid NOT NULL,
    operation_type character varying(80) NOT NULL,
    aggregate_type character varying(50) NOT NULL,
    aggregate_id uuid,
    expected_version bigint,
    payload jsonb NOT NULL,
    payload_hash character varying(64) NOT NULL,
    status character varying(20) DEFAULT 'RECEIVED'::character varying NOT NULL,
    result jsonb,
    error_code character varying(80),
    error_message text,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);
CREATE SEQUENCE IF NOT EXISTS public.sync_inbox_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.sync_inbox_id_seq OWNED BY public.sync_inbox.id;
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid,
    payload jsonb,
    status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.sync_nodes (
    id uuid NOT NULL,
    store_id uuid NOT NULL,
    node_type character varying(10) NOT NULL,
    name character varying(100) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    last_seen_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sync_nodes_node_type_check CHECK (((node_type)::text = ANY ((ARRAY['EDGE'::character varying, 'CLOUD'::character varying])::text[])))
);
CREATE TABLE IF NOT EXISTS public.sync_outbox (
    id bigint NOT NULL,
    store_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    target_node_id uuid,
    event_type character varying(80) NOT NULL,
    aggregate_type character varying(50) NOT NULL,
    aggregate_id uuid NOT NULL,
    aggregate_version bigint NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    available_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text
);
CREATE SEQUENCE IF NOT EXISTS public.sync_outbox_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.sync_outbox_id_seq OWNED BY public.sync_outbox.id;
CREATE TABLE IF NOT EXISTS public.sync_status (
    store_id uuid NOT NULL,
    last_sync timestamp with time zone DEFAULT now(),
    status character varying(20) DEFAULT 'IDLE'::character varying,
    last_error text,
    ops_count integer DEFAULT 0,
    duplicates_avoided integer DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.user_stores (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    store_id uuid
);
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    name character varying(150) NOT NULL,
    role character varying(50) NOT NULL,
    refresh_token_hash text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    permisos jsonb DEFAULT '[]'::jsonb,
    comision_porcentaje numeric(5,2) DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.vendor_inventories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    product_id uuid,
    store_id uuid,
    assigned_quantity numeric(15,2) DEFAULT 0,
    sold_quantity numeric(15,2) DEFAULT 0,
    current_quantity numeric(15,2) DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_bulks integer DEFAULT 0,
    assigned_units integer DEFAULT 0,
    current_bulks integer DEFAULT 0,
    current_units integer DEFAULT 0,
    deleted_at timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public.vendor_routes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    store_id uuid,
    vendor_id uuid,
    client_ids jsonb DEFAULT '[]'::jsonb,
    route_date date,
    status character varying(30) DEFAULT 'PLANNED'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.visit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    vendor_id uuid NOT NULL,
    client_id uuid NOT NULL,
    notes text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255),
    store_id uuid,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE ONLY public.inventory_ledger ALTER COLUMN id SET DEFAULT nextval('public.inventory_ledger_id_seq'::regclass);
ALTER TABLE ONLY public.sync_inbox ALTER COLUMN id SET DEFAULT nextval('public.sync_inbox_id_seq'::regclass);
ALTER TABLE ONLY public.sync_outbox ALTER COLUMN id SET DEFAULT nextval('public.sync_outbox_id_seq'::regclass);
ALTER TABLE ONLY public.account_payments
    ADD CONSTRAINT account_payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT accounts_receivable_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.arqueos
    ADD CONSTRAINT arqueos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.authorizations
    ADD CONSTRAINT authorizations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cargas_camion
    ADD CONSTRAINT cargas_camion_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cash_shifts
    ADD CONSTRAINT cash_shifts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chains
    ADD CONSTRAINT chains_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_external_id_key UNIQUE (external_id);
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);
ALTER TABLE ONLY public.consultasql_historial
    ADD CONSTRAINT consultasql_historial_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.consultasql
    ADD CONSTRAINT consultasql_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_closings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_token_key UNIQUE (token);
ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.grupos_clientes
    ADD CONSTRAINT grupos_clientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.grupos_economicos
    ADD CONSTRAINT grupos_economicos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.historial_asignacion_clientes
    ADD CONSTRAINT historial_asignacion_clientes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_adjustments
    ADD CONSTRAINT inventory_adjustments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_ledger
    ADD CONSTRAINT inventory_ledger_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.inventory_ledger
    ADD CONSTRAINT inventory_ledger_store_id_operation_id_product_id_location__key UNIQUE (store_id, operation_id, product_id, location_type, location_id);
ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_key UNIQUE (license_key);
ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.liquidaciones_ruta
    ADD CONSTRAINT liquidaciones_ruta_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_external_id_key UNIQUE (external_id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pending_deliveries
    ADD CONSTRAINT pending_deliveries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_external_id_key UNIQUE (external_id);
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_external_id_key UNIQUE (external_id);
ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.store_zones
    ADD CONSTRAINT store_zones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sub_zones
    ADD CONSTRAINT sub_zones_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_cursors
    ADD CONSTRAINT sync_cursors_pkey PRIMARY KEY (node_id, store_id, stream);
ALTER TABLE ONLY public.sync_idempotency_log
    ADD CONSTRAINT sync_idempotency_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_inbox
    ADD CONSTRAINT sync_inbox_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_inbox
    ADD CONSTRAINT sync_inbox_store_id_operation_id_key UNIQUE (store_id, operation_id);
ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_nodes
    ADD CONSTRAINT sync_nodes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_nodes
    ADD CONSTRAINT sync_nodes_store_id_id_key UNIQUE (store_id, id);
ALTER TABLE ONLY public.sync_outbox
    ADD CONSTRAINT sync_outbox_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sync_outbox
    ADD CONSTRAINT sync_outbox_store_id_operation_id_event_type_target_node_id_key UNIQUE (store_id, operation_id, event_type, target_node_id);
ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_pkey PRIMARY KEY (store_id);
ALTER TABLE ONLY public.sync_idempotency_log
    ADD CONSTRAINT uq_sync_idempotency_store_ext_entity UNIQUE (store_id, external_id, entity_type);
ALTER TABLE ONLY public.user_stores
    ADD CONSTRAINT user_stores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_stores
    ADD CONSTRAINT user_stores_user_id_store_id_key UNIQUE (user_id, store_id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_inventories
    ADD CONSTRAINT vendor_inventories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_routes
    ADD CONSTRAINT vendor_routes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.visit_logs
    ADD CONSTRAINT visit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (id);
CREATE INDEX IF NOT EXISTS idx_acc_pay_account ON public.account_payments USING btree (account_id);
CREATE INDEX IF NOT EXISTS idx_acc_recv_client ON public.accounts_receivable USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_acc_recv_store ON public.accounts_receivable USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_store ON public.accounts_payable USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_client ON public.accounts_receivable USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_store ON public.accounts_receivable USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_clients_grupo_cli ON public.clients USING btree (grupo_cliente_id);
CREATE INDEX IF NOT EXISTS idx_clients_grupo_eco ON public.clients USING btree (grupo_economico_id);
CREATE INDEX IF NOT EXISTS idx_clients_preventa ON public.clients USING btree (preventa_id);
CREATE INDEX IF NOT EXISTS idx_collections_rutero_date ON public.collections USING btree (rutero_id, created_at);
CREATE INDEX IF NOT EXISTS idx_consultasql_historial_created_at ON public.consultasql_historial USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultasql_historial_duracion ON public.consultasql_historial USING btree (duracion_ms DESC);
CREATE INDEX IF NOT EXISTS idx_daily_closings_rutero ON public.daily_closings USING btree (rutero_id, closing_date);
CREATE INDEX IF NOT EXISTS idx_error_logs_date ON public.error_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_auth_pending ON public.orders USING btree (requiere_autorizacion) WHERE (requiere_autorizacion = true);
CREATE INDEX IF NOT EXISTS idx_orders_carga ON public.orders USING btree (grupo_carga_id);
CREATE INDEX IF NOT EXISTS idx_orders_rutero ON public.orders USING btree (rutero_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON public.orders USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tipo ON public.orders USING btree (tipo_pedido);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.outbox_events USING btree (created_at) WHERE (published_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pb_barcode_store ON public.product_barcodes USING btree (barcode, store_id);
CREATE INDEX IF NOT EXISTS idx_pb_product ON public.product_barcodes USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_pend_del_rutero ON public.pending_deliveries USING btree (rutero_id);
CREATE INDEX IF NOT EXISTS idx_pend_del_store ON public.pending_deliveries USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_pend_ord_store ON public.pending_orders USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_pending_deliveries_rutero ON public.pending_deliveries USING btree (rutero_id);
CREATE INDEX IF NOT EXISTS idx_pending_deliveries_store ON public.pending_deliveries USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_orders_store ON public.pending_orders USING btree (store_id, status);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_barcode_lookup ON public.product_barcodes USING btree (barcode);
CREATE INDEX IF NOT EXISTS idx_product_barcodes_product ON public.product_barcodes USING btree (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_barcodes_unique_code ON public.product_barcodes USING btree (barcode, store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_barcode ON public.products USING btree (store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_returns_rutero ON public.returns USING btree (rutero_id);
CREATE INDEX IF NOT EXISTS idx_returns_store ON public.returns USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_routes_store ON public.routes USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_routes_vendor ON public.routes USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_store_zones_store ON public.store_zones USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_created ON public.sync_idempotency_log USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_entity_type ON public.sync_idempotency_log USING btree (entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_store ON public.sync_idempotency_log USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_vendor_inv_vendor ON public.vendor_inventories USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_inventories_vendor ON public.vendor_inventories USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_store ON public.visit_logs USING btree (store_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_vendor ON public.visit_logs USING btree (vendor_id);
CREATE INDEX IF NOT EXISTS sync_outbox_pending_idx ON public.sync_outbox USING btree (available_at, id) WHERE (published_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cash_shift_open_user_store ON public.cash_shifts USING btree (store_id, opened_by) WHERE ((status)::text = 'OPEN'::text);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_delivery_order ON public.pending_deliveries USING btree (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_inventory_scope ON public.vendor_inventories USING btree (store_id, vendor_id, product_id);
ALTER TABLE ONLY public.account_payments
    ADD CONSTRAINT account_payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts_receivable(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.accounts_payable
    ADD CONSTRAINT accounts_payable_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT ar_client_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT ar_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.accounts_receivable
    ADD CONSTRAINT ar_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.arqueos
    ADD CONSTRAINT arqueos_realizado_por_fkey FOREIGN KEY (realizado_por) REFERENCES public.users(id);
ALTER TABLE ONLY public.arqueos
    ADD CONSTRAINT arqueos_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.arqueos
    ADD CONSTRAINT arqueos_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.cargas_camion
    ADD CONSTRAINT cargas_camion_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.cargas_camion
    ADD CONSTRAINT cargas_camion_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.cash_shifts
    ADD CONSTRAINT cash_shifts_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.cash_shifts
    ADD CONSTRAINT cash_shifts_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.cash_shifts
    ADD CONSTRAINT cash_shifts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_grupo_cliente_id_fkey FOREIGN KEY (grupo_cliente_id) REFERENCES public.grupos_clientes(id);
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_grupo_economico_id_fkey FOREIGN KEY (grupo_economico_id) REFERENCES public.grupos_economicos(id);
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_preventa_id_fkey FOREIGN KEY (preventa_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts_receivable(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_cash_shift_id_fkey FOREIGN KEY (cash_shift_id) REFERENCES public.cash_shifts(id);
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_closings_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.daily_closings
    ADD CONSTRAINT daily_closings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.grupos_clientes
    ADD CONSTRAINT grupos_clientes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.grupos_economicos
    ADD CONSTRAINT grupos_economicos_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.historial_asignacion_clientes
    ADD CONSTRAINT historial_asignacion_clientes_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE ONLY public.historial_asignacion_clientes
    ADD CONSTRAINT historial_asignacion_clientes_preventa_anterior_id_fkey FOREIGN KEY (preventa_anterior_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.historial_asignacion_clientes
    ADD CONSTRAINT historial_asignacion_clientes_preventa_nuevo_id_fkey FOREIGN KEY (preventa_nuevo_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.historial_asignacion_clientes
    ADD CONSTRAINT historial_asignacion_clientes_realizado_por_fkey FOREIGN KEY (realizado_por) REFERENCES public.users(id);
ALTER TABLE ONLY public.inventory_ledger
    ADD CONSTRAINT inventory_ledger_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.inventory_ledger
    ADD CONSTRAINT inventory_ledger_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_supplier_fk FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
ALTER TABLE ONLY public.liquidaciones_ruta
    ADD CONSTRAINT liquidaciones_ruta_arqueo_id_fkey FOREIGN KEY (arqueo_id) REFERENCES public.arqueos(id);
ALTER TABLE ONLY public.liquidaciones_ruta
    ADD CONSTRAINT liquidaciones_ruta_liquidado_por_fkey FOREIGN KEY (liquidado_por) REFERENCES public.users(id);
ALTER TABLE ONLY public.liquidaciones_ruta
    ADD CONSTRAINT liquidaciones_ruta_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.liquidaciones_ruta
    ADD CONSTRAINT liquidaciones_ruta_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_autorizado_por_fkey FOREIGN KEY (autorizado_por) REFERENCES public.users(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts_payable(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payable_payments
    ADD CONSTRAINT payable_payments_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pending_deliveries
    ADD CONSTRAINT pd_client_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);
ALTER TABLE ONLY public.pending_deliveries
    ADD CONSTRAINT pd_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.pending_deliveries
    ADD CONSTRAINT pd_rutero_fk FOREIGN KEY (rutero_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.pending_deliveries
    ADD CONSTRAINT pd_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT return_items_return_id_fkey FOREIGN KEY (return_id) REFERENCES public.returns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_rutero_id_fkey FOREIGN KEY (rutero_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.returns
    ADD CONSTRAINT returns_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cash_shift_id_fkey FOREIGN KEY (cash_shift_id) REFERENCES public.cash_shifts(id);
ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chains(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sub_zones
    ADD CONSTRAINT sub_zones_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chains(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sync_idempotency_log
    ADD CONSTRAINT sync_idempotency_log_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sync_inbox
    ADD CONSTRAINT sync_inbox_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.sync_nodes
    ADD CONSTRAINT sync_nodes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.sync_outbox
    ADD CONSTRAINT sync_outbox_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.sync_status
    ADD CONSTRAINT sync_status_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_stores
    ADD CONSTRAINT user_stores_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_stores
    ADD CONSTRAINT user_stores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.vendor_routes
    ADD CONSTRAINT vendor_routes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.vendor_routes
    ADD CONSTRAINT vendor_routes_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.vendor_inventories
    ADD CONSTRAINT vi_product_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.vendor_inventories
    ADD CONSTRAINT vi_store_fk FOREIGN KEY (store_id) REFERENCES public.stores(id);
ALTER TABLE ONLY public.vendor_inventories
    ADD CONSTRAINT vi_vendor_fk FOREIGN KEY (vendor_id) REFERENCES public.users(id);

