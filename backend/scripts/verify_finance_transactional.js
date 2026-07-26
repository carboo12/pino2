#!/usr/bin/env node

/**
 * Validación real y reversible de CxC/CxP sobre la base activa.
 *
 * Ejecuta los servicios compilados contra PostgreSQL dentro de una única
 * transacción externa y siempre hace ROLLBACK. No deja clientes, facturas,
 * movimientos, pagos ni inventario de diagnóstico.
 *
 * Requiere ejecutar primero: npm run build
 */

const path = require("path");
const { randomUUID } = require("crypto");
const { Pool } = require("pg");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env.dev"),
});

const {
  AccountsReceivableService,
} = require("../dist/src/modules/accounts-receivable/accounts-receivable.service");
const {
  AccountsPayableService,
} = require("../dist/src/modules/accounts-payable/accounts-payable.service");
const {
  CollectionsService,
} = require("../dist/src/modules/collections/collections.service");
const {
  InvoicesService,
} = require("../dist/src/modules/invoices/invoices.service");
const {
  SupplierCreditNotesService,
} = require("../dist/src/modules/supplier-credit-notes/supplier-credit-notes.service");
const {
  SalesService,
} = require("../dist/src/modules/sales/sales.service");
const {
  InboxService,
} = require("../dist/src/modules/sync-engine/inbox.service");
const {
  SyncService,
} = require("../dist/src/modules/sync/sync.service");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function scalar(client, sql, params = []) {
  const result = await client.query(sql, params);
  return result.rows[0];
}

async function main() {
  const databaseName =
    process.env.DATABASE_NAME ||
    (() => {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) return "";
      return new URL(connectionString).pathname.replace(/^\//, "");
    })();
  if (databaseName !== "sistema_de_inventario") {
    throw new Error(
      "Validación cancelada: la configuración no apunta a sistema_de_inventario",
    );
  }

  const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
    : new Pool({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT || 5432),
        database: databaseName,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        max: 1,
      });
  const client = await pool.connect();
  const suffix = randomUUID().slice(0, 8);
  const checks = [];

  try {
    await client.query("BEGIN");

    const database = {
      query: (text, params) => client.query(text, params),
      withTransaction: (operation) => operation(client),
    };
    const eventsGateway = { emitSyncUpdate: () => undefined };
    const collections = new CollectionsService(database, eventsGateway);
    const receivables = new AccountsReceivableService(database, collections);
    const payables = new AccountsPayableService(database);
    const invoices = new InvoicesService(database);
    const creditNotes = new SupplierCreditNotesService(database);
    const promotions = { findActivePromotions: async () => [] };
    const sales = new SalesService(database, eventsGateway, promotions);
    const inbox = new InboxService(database);
    const sync = new SyncService(
      database,
      sales,
      null,
      collections,
      null,
      inbox,
    );

    const chain = await scalar(
      client,
      "INSERT INTO chains (name) VALUES ($1) RETURNING id",
      [`VERIFY-FIN-${suffix}`],
    );
    const store = await scalar(
      client,
      "INSERT INTO stores (chain_id, name) VALUES ($1, $2) RETURNING id",
      [chain.id, `VERIFY STORE ${suffix}`],
    );
    const supplier = await scalar(
      client,
      "INSERT INTO suppliers (chain_id, name) VALUES ($1, $2) RETURNING id",
      [chain.id, `VERIFY SUPPLIER ${suffix}`],
    );
    const creditClient = await scalar(
      client,
      `INSERT INTO clients (store_id, name, type, dias_credito)
       VALUES ($1, $2, 'CREDITO', 8)
       RETURNING id`,
      [store.id, `VERIFY CLIENT ${suffix}`],
    );
    const cashier = await scalar(
      client,
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, 'ROLLBACK', $2, 'store-admin')
       RETURNING id`,
      [
        `verify-${suffix}@rollback.local`,
        `VERIFY CASHIER ${suffix}`,
      ],
    );
    const shift = await scalar(
      client,
      `INSERT INTO cash_shifts (
         store_id, opened_by, starting_cash, actual_cash, status
       )
       VALUES ($1, $2, 100, 100, 'OPEN')
       RETURNING id`,
      [store.id, cashier.id],
    );
    const product = await scalar(
      client,
      `INSERT INTO products (
         store_id, description, sale_price, price1, cost_price,
         current_stock, uses_inventory, units_per_bulk, handles_bulk
       )
       VALUES ($1, $2, 10, 10, 5, 20, true, 1, false)
       RETURNING id`,
      [store.id, `VERIFY PRODUCT ${suffix}`],
    );
    const route = await scalar(
      client,
      `INSERT INTO routes (
         store_id, vendor_id, client_ids, route_date, status,
         route_type, valid_from, valid_to
       )
       VALUES (
         $1, $2, jsonb_build_array($3::text), CURRENT_DATE, 'ACTIVE',
         'SALES', CURRENT_DATE, CURRENT_DATE
       )
       RETURNING id`,
      [store.id, cashier.id, creditClient.id],
    );
    await client.query(
      `INSERT INTO route_clients (route_id, client_id, visit_order)
       VALUES ($1, $2, 1)`,
      [route.id, creditClient.id],
    );
    const bootstrap = await sync.getDeltaData(
      store.id,
      undefined,
      500,
      "sales-manager",
      cashier.id,
    );
    assert(
      bootstrap.scope === "ASSIGNED_SALES_MANAGER" &&
        bootstrap.entities.clients.items.some(
          (item) => item.id === creditClient.id,
        ) &&
        bootstrap.entities.routes.items.some((item) => item.id === route.id) &&
        bootstrap.entities.routeClients.items.some(
          (item) => item.route_id === route.id,
        ),
      "Bootstrap delta del Gestor no devolvió su ruta y cliente asignados",
    );
    checks.push("bootstrap delta limitado al Gestor asignado");

    const conflictOperationId = randomUUID();
    const conflictBatch = await sync.processBatchSync(store.id, [
      {
        type: "SALE",
        operationId: conflictOperationId,
        data: {
          cashShiftId: shift.id,
          cashierId: cashier.id,
          paymentMethod: "CASH",
          items: [{ productId: product.id, quantity: 999999 }],
        },
      },
    ]);
    assert(
      conflictBatch[0]?.status === "FAILED" &&
        conflictBatch[0]?.errorCode === "STOCK_CONFLICT" &&
        conflictBatch[0]?.recoverable === true,
      "Conflicto de stock offline no quedó marcado como recuperable",
    );
    const repeatedConflict = await sync.processBatchSync(store.id, [
      {
        type: "SALE",
        operationId: conflictOperationId,
        data: {
          cashShiftId: shift.id,
          cashierId: cashier.id,
          paymentMethod: "CASH",
          items: [{ productId: product.id, quantity: 999999 }],
        },
      },
    ]);
    assert(
      repeatedConflict[0]?.status === "FAILED" &&
        repeatedConflict[0]?.retryWithNewOperationId === true,
      "Reconsulta de conflicto offline se reportó falsamente como duplicado",
    );
    checks.push("conflicto offline recuperable y persistente");

    const cashSale = await sales.processSale(
      {
        storeId: store.id,
        cashShiftId: shift.id,
        ticketNumber: `VERIFY-CASH-SALE-${suffix}`,
        paymentMethod: "CASH",
        externalId: randomUUID(),
        items: [{ productId: product.id, quantity: 2 }],
      },
      cashier.id,
      client,
    );
    const cashSaleState = await scalar(
      client,
      `SELECT
         (SELECT count(*)::int FROM sale_items WHERE sale_id = $1) item_count,
         (SELECT current_stock FROM products WHERE id = $2) current_stock,
         (SELECT actual_cash FROM cash_shifts WHERE id = $3) actual_cash`,
      [cashSale.saleId, product.id, shift.id],
    );
    assert(cashSaleState.item_count === 1, "Venta CONTADO no creó su item");
    assert(
      Number(cashSaleState.current_stock) === 18,
      "Venta CONTADO no descontó inventario",
    );
    assert(
      money(cashSaleState.actual_cash) === money(100 + cashSale.total),
      "Venta CONTADO no actualizó el efectivo del turno",
    );
    checks.push("venta CONTADO transaccional");

    const creditSale = await sales.processSale(
      {
        storeId: store.id,
        cashShiftId: shift.id,
        ticketNumber: `VERIFY-CREDIT-SALE-${suffix}`,
        paymentMethod: "CREDITO",
        clientId: creditClient.id,
        clientName: `VERIFY CLIENT ${suffix}`,
        externalId: randomUUID(),
        items: [{ productId: product.id, quantity: 1 }],
      },
      cashier.id,
      client,
    );
    assert(
      Boolean(creditSale.accountReceivableId),
      "Venta CREDITO no creó CxC",
    );
    const receivable = await receivables.findOne(
      creditSale.accountReceivableId,
    );
    const issuedAt = new Date(receivable.issuedAt);
    const expectedDue = new Date(`${dateOnly(issuedAt)}T00:00:00.000Z`);
    expectedDue.setUTCDate(expectedDue.getUTCDate() + 8);
    assert(
      dateOnly(new Date(receivable.dueDate)) === dateOnly(expectedDue),
      "CxC no respetó los 8 días de crédito del cliente",
    );
    assert(
      money(receivable.totalAmount) === money(creditSale.total),
      "CxC no conserva el total de la venta a crédito",
    );
    checks.push("venta CREDITO crea CxC con vencimiento de 8 días");

    const partialAmount = money(receivable.totalAmount / 2);
    const finalAmount = money(receivable.totalAmount - partialAmount);
    const partialReceivable = await receivables.addPayment(receivable.id, {
      amount: partialAmount,
      paymentMethod: "CASH",
    });
    assert(
      money(partialReceivable.remainingAmount) === finalAmount,
      "Abono parcial de CxC dejó saldo incorrecto",
    );
    const paidReceivable = await receivables.addPayment(receivable.id, {
      amount: finalAmount,
      paymentMethod: "TRANSFER",
    });
    assert(
      money(paidReceivable.remainingAmount) === 0,
      "Pago total de CxC no dejó saldo cero",
    );
    const receivableRow = await scalar(
      client,
      "SELECT status, remaining_amount FROM accounts_receivable WHERE id = $1",
      [receivable.id],
    );
    assert(
      receivableRow.status === "PAID" &&
        money(receivableRow.remaining_amount) === 0,
      "CxC pagada no quedó en estado PAID",
    );
    checks.push("abono parcial y pago total de CxC");

    const stockBeforeCashInvoice = await scalar(
      client,
      "SELECT current_stock FROM products WHERE id = $1",
      [product.id],
    );
    const cashInvoice = await invoices.create({
      storeId: store.id,
      supplierId: supplier.id,
      invoiceNumber: `VERIFY-CASH-${suffix}`,
      paymentType: "CONTADO",
      cashierName: "IA-NUCLEO",
      items: [
        {
          productId: product.id,
          description: `VERIFY PRODUCT ${suffix}`,
          quantity: 10,
          unitPrice: 5,
        },
      ],
    });
    const cashPayable = await scalar(
      client,
      "SELECT count(*)::int AS count FROM accounts_payable WHERE invoice_id = $1",
      [cashInvoice.id],
    );
    assert(cashPayable.count === 0, "Factura CONTADO creó una CxP");
    checks.push("factura proveedor CONTADO sin CxP");

    const stockAfterCashInvoice = await scalar(
      client,
      "SELECT current_stock FROM products WHERE id = $1",
      [product.id],
    );
    assert(
      Number(stockAfterCashInvoice.current_stock) ===
        Number(stockBeforeCashInvoice.current_stock) + 10,
      "Factura CONTADO no ingresó inventario",
    );

    const dueDate = new Date();
    dueDate.setUTCDate(dueDate.getUTCDate() + 15);
    const creditInvoice = await invoices.create({
      storeId: store.id,
      supplierId: supplier.id,
      invoiceNumber: `VERIFY-CREDIT-${suffix}`,
      paymentType: "CREDITO",
      dueDate: dateOnly(dueDate),
      cashierName: "IA-NUCLEO",
      items: [
        {
          productId: product.id,
          description: `VERIFY PRODUCT ${suffix}`,
          quantity: 6,
          unitPrice: 5,
        },
      ],
    });
    const payable = await scalar(
      client,
      "SELECT * FROM accounts_payable WHERE invoice_id = $1",
      [creditInvoice.id],
    );
    assert(
      money(payable.total_amount) === 30 &&
        money(payable.remaining_amount) === 30,
      "Factura CREDITO no creó CxP por el total calculado",
    );
    checks.push("factura proveedor CREDITO crea CxP");

    const partialPayable = await payables.addPayment(payable.id, {
      amount: 10,
      paymentMethod: "TRANSFER",
    });
    assert(
      money(partialPayable.remainingAmount) === 20,
      "Abono de CxP no dejó saldo 20",
    );
    const paidPayable = await payables.addPayment(payable.id, {
      amount: 20,
      paymentMethod: "TRANSFER",
    });
    assert(
      money(paidPayable.remainingAmount) === 0 &&
        paidPayable.status === "PAID",
      "Pago total de CxP no dejó estado PAID",
    );
    const paidInvoice = await scalar(
      client,
      "SELECT status FROM invoices WHERE id = $1",
      [creditInvoice.id],
    );
    assert(
      paidInvoice.status === "PAGADA",
      "Pagar CxP no marcó la factura PAGADA",
    );
    checks.push("abono parcial y pago total de CxP");

    const noteInvoice = await invoices.create({
      storeId: store.id,
      supplierId: supplier.id,
      invoiceNumber: `VERIFY-NOTE-${suffix}`,
      paymentType: "CREDITO",
      dueDate: dateOnly(dueDate),
      cashierName: "IA-NUCLEO",
      items: [
        {
          productId: product.id,
          description: `VERIFY PRODUCT ${suffix}`,
          quantity: 4,
          unitPrice: 5,
        },
      ],
    });
    const notePayable = await scalar(
      client,
      "SELECT id, remaining_amount FROM accounts_payable WHERE invoice_id = $1",
      [noteInvoice.id],
    );
    const invoiceItem = await scalar(
      client,
      "SELECT id FROM invoice_items WHERE invoice_id = $1",
      [noteInvoice.id],
    );
    const stockBeforeNote = await scalar(
      client,
      "SELECT current_stock FROM products WHERE id = $1",
      [product.id],
    );

    const note = await creditNotes.create({
      storeId: store.id,
      supplierId: supplier.id,
      invoiceId: noteInvoice.id,
      accountPayableId: notePayable.id,
      creditNoteNumber: `VERIFY-NC-${suffix}`,
      issueDate: dateOnly(new Date()),
      reason: "Validación reversible",
      items: [{ invoiceItemId: invoiceItem.id, quantity: 2 }],
    });
    const stockAfterNote = await scalar(
      client,
      "SELECT current_stock FROM products WHERE id = $1",
      [product.id],
    );
    const payableAfterNote = await scalar(
      client,
      "SELECT remaining_amount, status FROM accounts_payable WHERE id = $1",
      [notePayable.id],
    );
    assert(
      money(note.totalAmount) === 10,
      "Nota de crédito no calculó el valor de los items",
    );
    assert(
      Number(stockAfterNote.current_stock) ===
        Number(stockBeforeNote.current_stock) - 2,
      "Nota de crédito no descontó inventario",
    );
    assert(
      money(payableAfterNote.remaining_amount) === 10 &&
        payableAfterNote.status === "PARTIAL",
      "Nota de crédito no redujo correctamente la CxP",
    );
    checks.push("nota de crédito reduce inventario y CxP");

    process.stdout.write(
      JSON.stringify(
        {
          database: "sistema_de_inventario",
          transaction: "ROLLBACK",
          passed: checks.length,
          checks,
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    try {
      await client.query("ROLLBACK");
    } finally {
      client.release();
      await pool.end();
    }
  }
}

main().catch((error) => {
  process.stderr.write(`FINANCE_VERIFY_FAILED: ${error.message}\n`);
  process.exitCode = 1;
});
