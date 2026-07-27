import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

class CachedStores extends Table {
  TextColumn get id => text()();
  TextColumn get userId => text()();
  TextColumn get name => text()();
  TextColumn get address => text().nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get chainId => text().nullable()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, userId};
}

class CachedProducts extends Table {
  TextColumn get id => text()();
  TextColumn get storeId => text()();
  TextColumn get description => text()();
  RealColumn get salePrice => real()();
  IntColumn get currentStock => integer()();
  IntColumn get unitsPerBulk => integer()();
  IntColumn get stockBulks => integer()();
  IntColumn get stockUnits => integer()();
  TextColumn get barcode => text().nullable()();
  TextColumn get brand => text().nullable()();
  TextColumn get department => text().nullable()();
  TextColumn get subDepartment => text().nullable()();
  IntColumn get minStock => integer().withDefault(const Constant(0))();
  BoolColumn get handlesBulk => boolean().withDefault(const Constant(false))();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, storeId};
}

class CachedProductBarcodes extends Table {
  TextColumn get id => text()();
  TextColumn get productId => text()();
  TextColumn get storeId => text()();
  TextColumn get barcode => text()();
  TextColumn get label => text().nullable()();
  BoolColumn get isPrimary => boolean().withDefault(const Constant(false))();
  TextColumn get cursor => text().nullable()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class CachedClients extends Table {
  TextColumn get id => text()();
  TextColumn get storeId => text()();
  TextColumn get name => text()();
  TextColumn get email => text().nullable()();
  TextColumn get phone => text().nullable()();
  TextColumn get address => text().nullable()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, storeId};
}

class CachedReceivableAccounts extends Table {
  TextColumn get id => text()();
  TextColumn get storeId => text()();
  TextColumn get clientId => text()();
  TextColumn get clientName => text()();
  RealColumn get totalAmount => real()();
  RealColumn get remainingAmount => real()();
  RealColumn get pendingAmount => real()();
  TextColumn get status => text()();
  TextColumn get orderId => text().nullable()();
  TextColumn get description => text().nullable()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, storeId};
}

class CachedCollectionSummaries extends Table {
  TextColumn get storeId => text()();
  TextColumn get scopeKey => text()();
  IntColumn get totalCount => integer()();
  RealColumn get totalAmount => real()();
  RealColumn get cashTotal => real()();
  RealColumn get otherTotal => real()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {storeId, scopeKey};
}

class CachedRoutes extends Table {
  TextColumn get id => text()();
  TextColumn get storeId => text()();
  TextColumn get vendorId => text()();
  TextColumn get name => text().withDefault(const Constant('Ruta Fija Cobertura'))();
  IntColumn get dayOfWeek => integer().withDefault(const Constant(0))();
  TextColumn get clientIdsJson => text()();
  DateTimeColumn get routeDate => dateTime().nullable()();
  TextColumn get status => text()();
  TextColumn get notes => text().nullable()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, storeId};
}

class CachedDeliveries extends Table {
  TextColumn get id => text()();
  TextColumn get storeId => text()();
  TextColumn get orderId => text()();
  TextColumn get status => text()();
  TextColumn get itemsJson => text()();
  RealColumn get total => real()();
  TextColumn get clientId => text().nullable()();
  TextColumn get clientName => text().nullable()();
  TextColumn get clientAddress => text().nullable()();
  TextColumn get ruteroId => text().nullable()();
  TextColumn get paymentType => text().nullable()();
  TextColumn get salesManagerName => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id, storeId};
}

class RealtimeEventLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get channel => text()();
  TextColumn get eventType => text()();
  TextColumn get payloadJson => text()();
  TextColumn get storeId => text().nullable()();
  DateTimeColumn get receivedAt => dateTime()();
}

class SyncQueueEntries extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get method => text()();
  TextColumn get endpoint => text()();
  TextColumn get payloadJson => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  TextColumn get storeId => text().nullable()();
  TextColumn get operationType => text().nullable()();
  TextColumn get errorMessage => text().nullable()();
  IntColumn get attemptCount => integer().withDefault(const Constant(0))();
  BoolColumn get tombstone => boolean().withDefault(const Constant(false))();
  TextColumn get operationId => text().nullable()();
  DateTimeColumn get nextAttemptAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
}

class VisitLogs extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientId => text()();
  TextColumn get status => text()(); // 'visited', 'not_found', 'no_buy'
  TextColumn get notes => text().nullable()();
  DateTimeColumn get timestamp => dateTime()();
}

@DriftDatabase(
  tables: [
    CachedStores,
    CachedProducts,
    CachedProductBarcodes,
    CachedClients,
    CachedReceivableAccounts,
    CachedCollectionSummaries,
    CachedRoutes,
    CachedDeliveries,
    RealtimeEventLogs,
    SyncQueueEntries,
    VisitLogs,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.executor);

  @override
  int get schemaVersion => 9;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (migrator) async {
      await migrator.createAll();
      await _createBarcodeIndex();
    },
    onUpgrade: (migrator, from, to) async {
      if (from < 2) {
        await migrator.createTable(cachedProducts);
        await migrator.createTable(cachedClients);
      }
      if (from < 3) {
        await migrator.createTable(cachedReceivableAccounts);
        await migrator.createTable(cachedRoutes);
        await migrator.createTable(cachedDeliveries);
      }
      if (from < 4) {
        await migrator.createTable(cachedCollectionSummaries);
      }
      if (from < 5) {
        await migrator.createTable(visitLogs);
      }
      if (from < 6) {
        await migrator.createTable(cachedProductBarcodes);
      }
      if (from < 7) {
        await _createBarcodeIndex();
      }
      if (from < 8) {
        await customStatement('ALTER TABLE cached_stores ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_products ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_product_barcodes ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_clients ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_receivable_accounts ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_collection_summaries ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_routes ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE cached_deliveries ADD COLUMN IF NOT EXISTS cursor TEXT;');
        await customStatement('ALTER TABLE sync_queue_entries ADD COLUMN IF NOT EXISTS tombstone INTEGER DEFAULT 0;');
      }
      if (from < 9) {
        await customStatement('ALTER TABLE sync_queue_entries ADD COLUMN IF NOT EXISTS operation_id TEXT;');
        await customStatement('ALTER TABLE sync_queue_entries ADD COLUMN IF NOT EXISTS next_attempt_at INTEGER;');
      }
    },
  );

  /// Crea índice compuesto en (barcode, store_id) para búsqueda instantánea
  /// al escanear un código de barras offline.
  Future<void> _createBarcodeIndex() async {
    await customStatement(
      'CREATE INDEX IF NOT EXISTS idx_cpb_barcode_store '
      'ON cached_product_barcodes(barcode, store_id)',
    );
  }

  /// Búsqueda directa por código de barras usando JOIN.
  /// Flujo: barcode → product_barcodes → product_id → products
  /// Resuelve en <1ms gracias al índice idx_cpb_barcode_store.
  Future<CachedProduct?> findProductByBarcode(
    String storeId,
    String barcode,
  ) async {
    final results = await customSelect(
      'SELECT cp.* FROM cached_product_barcodes cpb '
      'INNER JOIN cached_products cp ON cp.id = cpb.product_id AND cp.store_id = cpb.store_id '
      'WHERE cpb.barcode = ? AND cpb.store_id = ? '
      'LIMIT 1',
      variables: [Variable.withString(barcode), Variable.withString(storeId)],
      readsFrom: {cachedProductBarcodes, cachedProducts},
    ).get();

    if (results.isEmpty) return null;

    final row = results.first;
    return CachedProduct(
      id: row.read<String>('id'),
      storeId: row.read<String>('store_id'),
      description: row.read<String>('description'),
      salePrice: row.read<double>('sale_price'),
      currentStock: row.read<int>('current_stock'),
      unitsPerBulk: row.read<int>('units_per_bulk'),
      stockBulks: row.read<int>('stock_bulks'),
      stockUnits: row.read<int>('stock_units'),
      barcode: row.readNullable<String>('barcode'),
      brand: row.readNullable<String>('brand'),
      department: row.readNullable<String>('department'),
      subDepartment: row.readNullable<String>('sub_department'),
      minStock: row.read<int>('min_stock'),
      cachedAt: row.read<DateTime>('cached_at'),
    );
  }

  Future<void> replaceAssignedStores(
    String userId,
    List<CachedStoresCompanion> stores,
  ) async {
    await transaction(() async {
      await (delete(
        cachedStores,
      )..where((table) => table.userId.equals(userId))).go();

      if (stores.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedStores,
            stores,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedStore>> getAssignedStores(String userId) {
    return (select(cachedStores)
          ..where((table) => table.userId.equals(userId))
          ..orderBy([(table) => OrderingTerm.asc(table.name)]))
        .get();
  }

  Stream<List<CachedStore>> watchAssignedStores(String userId) {
    return (select(cachedStores)
          ..where((table) => table.userId.equals(userId))
          ..orderBy([(table) => OrderingTerm.asc(table.name)]))
        .watch();
  }

  Future<void> replaceCatalogProducts(
    String storeId,
    List<CachedProductsCompanion> products,
  ) async {
    await transaction(() async {
      await (delete(
        cachedProducts,
      )..where((table) => table.storeId.equals(storeId))).go();

      if (products.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedProducts,
            products,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedProduct>> getCatalogProducts(String storeId) {
    return (select(cachedProducts)
          ..where((table) => table.storeId.equals(storeId))
          ..orderBy([(table) => OrderingTerm.asc(table.description)]))
        .get();
  }

  Future<void> replaceClients(
    String storeId,
    List<CachedClientsCompanion> clients,
  ) async {
    await transaction(() async {
      await (delete(
        cachedClients,
      )..where((table) => table.storeId.equals(storeId))).go();

      if (clients.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedClients,
            clients,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedClient>> getClients(String storeId) {
    return (select(cachedClients)
          ..where((table) => table.storeId.equals(storeId))
          ..orderBy([(table) => OrderingTerm.asc(table.name)]))
        .get();
  }

  Future<void> replaceReceivableAccounts(
    String storeId,
    List<CachedReceivableAccountsCompanion> accounts,
  ) async {
    await transaction(() async {
      await (delete(
        cachedReceivableAccounts,
      )..where((table) => table.storeId.equals(storeId))).go();

      if (accounts.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedReceivableAccounts,
            accounts,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedReceivableAccount>> getReceivableAccounts(String storeId) {
    return (select(cachedReceivableAccounts)
          ..where((table) => table.storeId.equals(storeId))
          ..orderBy([(table) => OrderingTerm.asc(table.clientName)]))
        .get();
  }

  Future<void> replaceCollectionsSummary(
    CachedCollectionSummariesCompanion summary,
  ) async {
    await into(
      cachedCollectionSummaries,
    ).insert(summary, mode: InsertMode.insertOrReplace);
  }

  Future<CachedCollectionSummary?> getCollectionsSummary(
    String storeId,
    String scopeKey,
  ) {
    return (select(cachedCollectionSummaries)
          ..where(
            (table) =>
                table.storeId.equals(storeId) & table.scopeKey.equals(scopeKey),
          )
          ..limit(1))
        .getSingleOrNull();
  }

  Future<void> replaceRoutes(
    String storeId,
    List<CachedRoutesCompanion> routes,
  ) async {
    await transaction(() async {
      await (delete(
        cachedRoutes,
      )..where((table) => table.storeId.equals(storeId))).go();

      if (routes.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedRoutes,
            routes,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedRoute>> getRoutes(String storeId) {
    return (select(cachedRoutes)
          ..where((table) => table.storeId.equals(storeId))
          ..orderBy([(table) => OrderingTerm.asc(table.status)]))
        .get();
  }

  Future<void> replaceDeliveries(
    String storeId,
    List<CachedDeliveriesCompanion> deliveries,
  ) async {
    await transaction(() async {
      await (delete(
        cachedDeliveries,
      )..where((table) => table.storeId.equals(storeId))).go();

      if (deliveries.isNotEmpty) {
        await batch((batch) {
          batch.insertAll(
            cachedDeliveries,
            deliveries,
            mode: InsertMode.insertOrReplace,
          );
        });
      }
    });
  }

  Future<List<CachedDelivery>> getDeliveries(String storeId) {
    return (select(cachedDeliveries)
          ..where((table) => table.storeId.equals(storeId))
          ..orderBy([(table) => OrderingTerm.asc(table.status)]))
        .get();
  }

  Future<int> insertRealtimeEvent(RealtimeEventLogsCompanion entry) {
    return into(realtimeEventLogs).insert(entry);
  }

  Stream<RealtimeEventLog?> watchLatestRealtimeEvent() {
    return (select(realtimeEventLogs)
          ..orderBy([(table) => OrderingTerm.desc(table.receivedAt)])
          ..limit(1))
        .watchSingleOrNull();
  }

  Future<int> enqueueSyncEntry(SyncQueueEntriesCompanion entry) {
    return into(syncQueueEntries).insert(entry);
  }

  Future<List<SyncQueueEntry>> getPendingSyncEntries({int limit = 25}) {
    return (select(syncQueueEntries)
          ..where((table) => table.status.equals('pending'))
          ..orderBy([(table) => OrderingTerm.asc(table.createdAt)])
          ..limit(limit))
        .get();
  }

  Future<void> retryFailedSyncEntries() {
    return (update(syncQueueEntries)
          ..where((table) => table.status.equals('failed')))
        .write(
          const SyncQueueEntriesCompanion(
            status: Value('pending'),
            errorMessage: Value(null),
          ),
        );
  }

  Future<void> markSyncEntryCompleted(int id) {
    return (update(syncQueueEntries)..where((table) => table.id.equals(id))).write(
      SyncQueueEntriesCompanion(
        status: const Value('completed'),
        errorMessage: const Value(null),
        lastAttemptAt: Value(DateTime.now().toUtc()),
      ),
    );
  }

  Future<void> discardSyncEntry(int id) {
    return (update(syncQueueEntries)..where((table) => table.id.equals(id))).write(
      const SyncQueueEntriesCompanion(
        status: Value('discarded'),
      ),
    );
  }

  Future<void> registerSyncAttempt(
    int id, {
    required String errorMessage,
    required bool keepPending,
  }) {
    return customStatement(
      '''
      UPDATE sync_queue_entries
      SET status = ?,
          error_message = ?,
          attempt_count = attempt_count + 1,
          last_attempt_at = ?
      WHERE id = ?
      ''',
      [
        keepPending ? 'pending' : 'failed',
        errorMessage,
        DateTime.now().toUtc(),
        id,
      ],
    );
  }

  Stream<int> watchPendingSyncCount() {
    final pendingCount = syncQueueEntries.id.count();

    return (selectOnly(syncQueueEntries)
          ..addColumns([pendingCount])
          ..where(syncQueueEntries.status.equals('pending')))
        .watchSingle()
        .map((row) => row.read(pendingCount) ?? 0);
  }

  Stream<int> watchFailedSyncCount() {
    final failedCount = syncQueueEntries.id.count();

    return (selectOnly(syncQueueEntries)
          ..addColumns([failedCount])
          ..where(syncQueueEntries.status.equals('failed')))
        .watchSingle()
        .map((row) => row.read(failedCount) ?? 0);
  }

  Stream<List<SyncQueueEntry>> watchRecentSyncEntries({int limit = 8}) {
    return (select(syncQueueEntries)
          ..orderBy([(table) => OrderingTerm.desc(table.createdAt)])
          ..limit(limit))
        .watch();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final directory = await getApplicationSupportDirectory();
    final file = File(p.join(directory.path, 'pino_mobile.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final database = AppDatabase();
  ref.onDispose(database.close);
  return database;
});
