// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $CachedStoresTable extends CachedStores
    with TableInfo<$CachedStoresTable, CachedStore> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedStoresTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _userIdMeta = const VerificationMeta('userId');
  @override
  late final GeneratedColumn<String> userId = GeneratedColumn<String>(
    'user_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _addressMeta = const VerificationMeta(
    'address',
  );
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
    'address',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _chainIdMeta = const VerificationMeta(
    'chainId',
  );
  @override
  late final GeneratedColumn<String> chainId = GeneratedColumn<String>(
    'chain_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    userId,
    name,
    address,
    phone,
    chainId,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_stores';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedStore> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('user_id')) {
      context.handle(
        _userIdMeta,
        userId.isAcceptableOrUnknown(data['user_id']!, _userIdMeta),
      );
    } else if (isInserting) {
      context.missing(_userIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('address')) {
      context.handle(
        _addressMeta,
        address.isAcceptableOrUnknown(data['address']!, _addressMeta),
      );
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    }
    if (data.containsKey('chain_id')) {
      context.handle(
        _chainIdMeta,
        chainId.isAcceptableOrUnknown(data['chain_id']!, _chainIdMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, userId};
  @override
  CachedStore map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedStore(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      userId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}user_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      address: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}address'],
      ),
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      ),
      chainId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}chain_id'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedStoresTable createAlias(String alias) {
    return $CachedStoresTable(attachedDatabase, alias);
  }
}

class CachedStore extends DataClass implements Insertable<CachedStore> {
  final String id;
  final String userId;
  final String name;
  final String? address;
  final String? phone;
  final String? chainId;
  final DateTime cachedAt;
  const CachedStore({
    required this.id,
    required this.userId,
    required this.name,
    this.address,
    this.phone,
    this.chainId,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['user_id'] = Variable<String>(userId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || address != null) {
      map['address'] = Variable<String>(address);
    }
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || chainId != null) {
      map['chain_id'] = Variable<String>(chainId);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedStoresCompanion toCompanion(bool nullToAbsent) {
    return CachedStoresCompanion(
      id: Value(id),
      userId: Value(userId),
      name: Value(name),
      address: address == null && nullToAbsent
          ? const Value.absent()
          : Value(address),
      phone: phone == null && nullToAbsent
          ? const Value.absent()
          : Value(phone),
      chainId: chainId == null && nullToAbsent
          ? const Value.absent()
          : Value(chainId),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedStore.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedStore(
      id: serializer.fromJson<String>(json['id']),
      userId: serializer.fromJson<String>(json['userId']),
      name: serializer.fromJson<String>(json['name']),
      address: serializer.fromJson<String?>(json['address']),
      phone: serializer.fromJson<String?>(json['phone']),
      chainId: serializer.fromJson<String?>(json['chainId']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'userId': serializer.toJson<String>(userId),
      'name': serializer.toJson<String>(name),
      'address': serializer.toJson<String?>(address),
      'phone': serializer.toJson<String?>(phone),
      'chainId': serializer.toJson<String?>(chainId),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedStore copyWith({
    String? id,
    String? userId,
    String? name,
    Value<String?> address = const Value.absent(),
    Value<String?> phone = const Value.absent(),
    Value<String?> chainId = const Value.absent(),
    DateTime? cachedAt,
  }) => CachedStore(
    id: id ?? this.id,
    userId: userId ?? this.userId,
    name: name ?? this.name,
    address: address.present ? address.value : this.address,
    phone: phone.present ? phone.value : this.phone,
    chainId: chainId.present ? chainId.value : this.chainId,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedStore copyWithCompanion(CachedStoresCompanion data) {
    return CachedStore(
      id: data.id.present ? data.id.value : this.id,
      userId: data.userId.present ? data.userId.value : this.userId,
      name: data.name.present ? data.name.value : this.name,
      address: data.address.present ? data.address.value : this.address,
      phone: data.phone.present ? data.phone.value : this.phone,
      chainId: data.chainId.present ? data.chainId.value : this.chainId,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedStore(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('name: $name, ')
          ..write('address: $address, ')
          ..write('phone: $phone, ')
          ..write('chainId: $chainId, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, userId, name, address, phone, chainId, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedStore &&
          other.id == this.id &&
          other.userId == this.userId &&
          other.name == this.name &&
          other.address == this.address &&
          other.phone == this.phone &&
          other.chainId == this.chainId &&
          other.cachedAt == this.cachedAt);
}

class CachedStoresCompanion extends UpdateCompanion<CachedStore> {
  final Value<String> id;
  final Value<String> userId;
  final Value<String> name;
  final Value<String?> address;
  final Value<String?> phone;
  final Value<String?> chainId;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedStoresCompanion({
    this.id = const Value.absent(),
    this.userId = const Value.absent(),
    this.name = const Value.absent(),
    this.address = const Value.absent(),
    this.phone = const Value.absent(),
    this.chainId = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedStoresCompanion.insert({
    required String id,
    required String userId,
    required String name,
    this.address = const Value.absent(),
    this.phone = const Value.absent(),
    this.chainId = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       userId = Value(userId),
       name = Value(name),
       cachedAt = Value(cachedAt);
  static Insertable<CachedStore> custom({
    Expression<String>? id,
    Expression<String>? userId,
    Expression<String>? name,
    Expression<String>? address,
    Expression<String>? phone,
    Expression<String>? chainId,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (userId != null) 'user_id': userId,
      if (name != null) 'name': name,
      if (address != null) 'address': address,
      if (phone != null) 'phone': phone,
      if (chainId != null) 'chain_id': chainId,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedStoresCompanion copyWith({
    Value<String>? id,
    Value<String>? userId,
    Value<String>? name,
    Value<String?>? address,
    Value<String?>? phone,
    Value<String?>? chainId,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedStoresCompanion(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      chainId: chainId ?? this.chainId,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (userId.present) {
      map['user_id'] = Variable<String>(userId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (chainId.present) {
      map['chain_id'] = Variable<String>(chainId.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedStoresCompanion(')
          ..write('id: $id, ')
          ..write('userId: $userId, ')
          ..write('name: $name, ')
          ..write('address: $address, ')
          ..write('phone: $phone, ')
          ..write('chainId: $chainId, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedProductsTable extends CachedProducts
    with TableInfo<$CachedProductsTable, CachedProduct> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedProductsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _salePriceMeta = const VerificationMeta(
    'salePrice',
  );
  @override
  late final GeneratedColumn<double> salePrice = GeneratedColumn<double>(
    'sale_price',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _currentStockMeta = const VerificationMeta(
    'currentStock',
  );
  @override
  late final GeneratedColumn<int> currentStock = GeneratedColumn<int>(
    'current_stock',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _unitsPerBulkMeta = const VerificationMeta(
    'unitsPerBulk',
  );
  @override
  late final GeneratedColumn<int> unitsPerBulk = GeneratedColumn<int>(
    'units_per_bulk',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stockBulksMeta = const VerificationMeta(
    'stockBulks',
  );
  @override
  late final GeneratedColumn<int> stockBulks = GeneratedColumn<int>(
    'stock_bulks',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stockUnitsMeta = const VerificationMeta(
    'stockUnits',
  );
  @override
  late final GeneratedColumn<int> stockUnits = GeneratedColumn<int>(
    'stock_units',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _barcodeMeta = const VerificationMeta(
    'barcode',
  );
  @override
  late final GeneratedColumn<String> barcode = GeneratedColumn<String>(
    'barcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _brandMeta = const VerificationMeta('brand');
  @override
  late final GeneratedColumn<String> brand = GeneratedColumn<String>(
    'brand',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _departmentMeta = const VerificationMeta(
    'department',
  );
  @override
  late final GeneratedColumn<String> department = GeneratedColumn<String>(
    'department',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _subDepartmentMeta = const VerificationMeta(
    'subDepartment',
  );
  @override
  late final GeneratedColumn<String> subDepartment = GeneratedColumn<String>(
    'sub_department',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _minStockMeta = const VerificationMeta(
    'minStock',
  );
  @override
  late final GeneratedColumn<int> minStock = GeneratedColumn<int>(
    'min_stock',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    storeId,
    description,
    salePrice,
    currentStock,
    unitsPerBulk,
    stockBulks,
    stockUnits,
    barcode,
    brand,
    department,
    subDepartment,
    minStock,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_products';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedProduct> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_descriptionMeta);
    }
    if (data.containsKey('sale_price')) {
      context.handle(
        _salePriceMeta,
        salePrice.isAcceptableOrUnknown(data['sale_price']!, _salePriceMeta),
      );
    } else if (isInserting) {
      context.missing(_salePriceMeta);
    }
    if (data.containsKey('current_stock')) {
      context.handle(
        _currentStockMeta,
        currentStock.isAcceptableOrUnknown(
          data['current_stock']!,
          _currentStockMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_currentStockMeta);
    }
    if (data.containsKey('units_per_bulk')) {
      context.handle(
        _unitsPerBulkMeta,
        unitsPerBulk.isAcceptableOrUnknown(
          data['units_per_bulk']!,
          _unitsPerBulkMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_unitsPerBulkMeta);
    }
    if (data.containsKey('stock_bulks')) {
      context.handle(
        _stockBulksMeta,
        stockBulks.isAcceptableOrUnknown(data['stock_bulks']!, _stockBulksMeta),
      );
    } else if (isInserting) {
      context.missing(_stockBulksMeta);
    }
    if (data.containsKey('stock_units')) {
      context.handle(
        _stockUnitsMeta,
        stockUnits.isAcceptableOrUnknown(data['stock_units']!, _stockUnitsMeta),
      );
    } else if (isInserting) {
      context.missing(_stockUnitsMeta);
    }
    if (data.containsKey('barcode')) {
      context.handle(
        _barcodeMeta,
        barcode.isAcceptableOrUnknown(data['barcode']!, _barcodeMeta),
      );
    }
    if (data.containsKey('brand')) {
      context.handle(
        _brandMeta,
        brand.isAcceptableOrUnknown(data['brand']!, _brandMeta),
      );
    }
    if (data.containsKey('department')) {
      context.handle(
        _departmentMeta,
        department.isAcceptableOrUnknown(data['department']!, _departmentMeta),
      );
    }
    if (data.containsKey('sub_department')) {
      context.handle(
        _subDepartmentMeta,
        subDepartment.isAcceptableOrUnknown(
          data['sub_department']!,
          _subDepartmentMeta,
        ),
      );
    }
    if (data.containsKey('min_stock')) {
      context.handle(
        _minStockMeta,
        minStock.isAcceptableOrUnknown(data['min_stock']!, _minStockMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, storeId};
  @override
  CachedProduct map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedProduct(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      )!,
      salePrice: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}sale_price'],
      )!,
      currentStock: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}current_stock'],
      )!,
      unitsPerBulk: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}units_per_bulk'],
      )!,
      stockBulks: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stock_bulks'],
      )!,
      stockUnits: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stock_units'],
      )!,
      barcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}barcode'],
      ),
      brand: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}brand'],
      ),
      department: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}department'],
      ),
      subDepartment: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sub_department'],
      ),
      minStock: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}min_stock'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedProductsTable createAlias(String alias) {
    return $CachedProductsTable(attachedDatabase, alias);
  }
}

class CachedProduct extends DataClass implements Insertable<CachedProduct> {
  final String id;
  final String storeId;
  final String description;
  final double salePrice;
  final int currentStock;
  final int unitsPerBulk;
  final int stockBulks;
  final int stockUnits;
  final String? barcode;
  final String? brand;
  final String? department;
  final String? subDepartment;
  final int minStock;
  final DateTime cachedAt;
  const CachedProduct({
    required this.id,
    required this.storeId,
    required this.description,
    required this.salePrice,
    required this.currentStock,
    required this.unitsPerBulk,
    required this.stockBulks,
    required this.stockUnits,
    this.barcode,
    this.brand,
    this.department,
    this.subDepartment,
    required this.minStock,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['description'] = Variable<String>(description);
    map['sale_price'] = Variable<double>(salePrice);
    map['current_stock'] = Variable<int>(currentStock);
    map['units_per_bulk'] = Variable<int>(unitsPerBulk);
    map['stock_bulks'] = Variable<int>(stockBulks);
    map['stock_units'] = Variable<int>(stockUnits);
    if (!nullToAbsent || barcode != null) {
      map['barcode'] = Variable<String>(barcode);
    }
    if (!nullToAbsent || brand != null) {
      map['brand'] = Variable<String>(brand);
    }
    if (!nullToAbsent || department != null) {
      map['department'] = Variable<String>(department);
    }
    if (!nullToAbsent || subDepartment != null) {
      map['sub_department'] = Variable<String>(subDepartment);
    }
    map['min_stock'] = Variable<int>(minStock);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedProductsCompanion toCompanion(bool nullToAbsent) {
    return CachedProductsCompanion(
      id: Value(id),
      storeId: Value(storeId),
      description: Value(description),
      salePrice: Value(salePrice),
      currentStock: Value(currentStock),
      unitsPerBulk: Value(unitsPerBulk),
      stockBulks: Value(stockBulks),
      stockUnits: Value(stockUnits),
      barcode: barcode == null && nullToAbsent
          ? const Value.absent()
          : Value(barcode),
      brand: brand == null && nullToAbsent
          ? const Value.absent()
          : Value(brand),
      department: department == null && nullToAbsent
          ? const Value.absent()
          : Value(department),
      subDepartment: subDepartment == null && nullToAbsent
          ? const Value.absent()
          : Value(subDepartment),
      minStock: Value(minStock),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedProduct.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedProduct(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      description: serializer.fromJson<String>(json['description']),
      salePrice: serializer.fromJson<double>(json['salePrice']),
      currentStock: serializer.fromJson<int>(json['currentStock']),
      unitsPerBulk: serializer.fromJson<int>(json['unitsPerBulk']),
      stockBulks: serializer.fromJson<int>(json['stockBulks']),
      stockUnits: serializer.fromJson<int>(json['stockUnits']),
      barcode: serializer.fromJson<String?>(json['barcode']),
      brand: serializer.fromJson<String?>(json['brand']),
      department: serializer.fromJson<String?>(json['department']),
      subDepartment: serializer.fromJson<String?>(json['subDepartment']),
      minStock: serializer.fromJson<int>(json['minStock']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'description': serializer.toJson<String>(description),
      'salePrice': serializer.toJson<double>(salePrice),
      'currentStock': serializer.toJson<int>(currentStock),
      'unitsPerBulk': serializer.toJson<int>(unitsPerBulk),
      'stockBulks': serializer.toJson<int>(stockBulks),
      'stockUnits': serializer.toJson<int>(stockUnits),
      'barcode': serializer.toJson<String?>(barcode),
      'brand': serializer.toJson<String?>(brand),
      'department': serializer.toJson<String?>(department),
      'subDepartment': serializer.toJson<String?>(subDepartment),
      'minStock': serializer.toJson<int>(minStock),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedProduct copyWith({
    String? id,
    String? storeId,
    String? description,
    double? salePrice,
    int? currentStock,
    int? unitsPerBulk,
    int? stockBulks,
    int? stockUnits,
    Value<String?> barcode = const Value.absent(),
    Value<String?> brand = const Value.absent(),
    Value<String?> department = const Value.absent(),
    Value<String?> subDepartment = const Value.absent(),
    int? minStock,
    DateTime? cachedAt,
  }) => CachedProduct(
    id: id ?? this.id,
    storeId: storeId ?? this.storeId,
    description: description ?? this.description,
    salePrice: salePrice ?? this.salePrice,
    currentStock: currentStock ?? this.currentStock,
    unitsPerBulk: unitsPerBulk ?? this.unitsPerBulk,
    stockBulks: stockBulks ?? this.stockBulks,
    stockUnits: stockUnits ?? this.stockUnits,
    barcode: barcode.present ? barcode.value : this.barcode,
    brand: brand.present ? brand.value : this.brand,
    department: department.present ? department.value : this.department,
    subDepartment: subDepartment.present
        ? subDepartment.value
        : this.subDepartment,
    minStock: minStock ?? this.minStock,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedProduct copyWithCompanion(CachedProductsCompanion data) {
    return CachedProduct(
      id: data.id.present ? data.id.value : this.id,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      description: data.description.present
          ? data.description.value
          : this.description,
      salePrice: data.salePrice.present ? data.salePrice.value : this.salePrice,
      currentStock: data.currentStock.present
          ? data.currentStock.value
          : this.currentStock,
      unitsPerBulk: data.unitsPerBulk.present
          ? data.unitsPerBulk.value
          : this.unitsPerBulk,
      stockBulks: data.stockBulks.present
          ? data.stockBulks.value
          : this.stockBulks,
      stockUnits: data.stockUnits.present
          ? data.stockUnits.value
          : this.stockUnits,
      barcode: data.barcode.present ? data.barcode.value : this.barcode,
      brand: data.brand.present ? data.brand.value : this.brand,
      department: data.department.present
          ? data.department.value
          : this.department,
      subDepartment: data.subDepartment.present
          ? data.subDepartment.value
          : this.subDepartment,
      minStock: data.minStock.present ? data.minStock.value : this.minStock,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedProduct(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('description: $description, ')
          ..write('salePrice: $salePrice, ')
          ..write('currentStock: $currentStock, ')
          ..write('unitsPerBulk: $unitsPerBulk, ')
          ..write('stockBulks: $stockBulks, ')
          ..write('stockUnits: $stockUnits, ')
          ..write('barcode: $barcode, ')
          ..write('brand: $brand, ')
          ..write('department: $department, ')
          ..write('subDepartment: $subDepartment, ')
          ..write('minStock: $minStock, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    storeId,
    description,
    salePrice,
    currentStock,
    unitsPerBulk,
    stockBulks,
    stockUnits,
    barcode,
    brand,
    department,
    subDepartment,
    minStock,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedProduct &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.description == this.description &&
          other.salePrice == this.salePrice &&
          other.currentStock == this.currentStock &&
          other.unitsPerBulk == this.unitsPerBulk &&
          other.stockBulks == this.stockBulks &&
          other.stockUnits == this.stockUnits &&
          other.barcode == this.barcode &&
          other.brand == this.brand &&
          other.department == this.department &&
          other.subDepartment == this.subDepartment &&
          other.minStock == this.minStock &&
          other.cachedAt == this.cachedAt);
}

class CachedProductsCompanion extends UpdateCompanion<CachedProduct> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> description;
  final Value<double> salePrice;
  final Value<int> currentStock;
  final Value<int> unitsPerBulk;
  final Value<int> stockBulks;
  final Value<int> stockUnits;
  final Value<String?> barcode;
  final Value<String?> brand;
  final Value<String?> department;
  final Value<String?> subDepartment;
  final Value<int> minStock;
  final Value<bool> handlesBulk;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedProductsCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.description = const Value.absent(),
    this.salePrice = const Value.absent(),
    this.currentStock = const Value.absent(),
    this.unitsPerBulk = const Value.absent(),
    this.stockBulks = const Value.absent(),
    this.stockUnits = const Value.absent(),
    this.barcode = const Value.absent(),
    this.brand = const Value.absent(),
    this.department = const Value.absent(),
    this.subDepartment = const Value.absent(),
    this.minStock = const Value.absent(),
    this.handlesBulk = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedProductsCompanion.insert({
    required String id,
    required String storeId,
    required String description,
    required double salePrice,
    required int currentStock,
    required int unitsPerBulk,
    required int stockBulks,
    required int stockUnits,
    this.barcode = const Value.absent(),
    this.brand = const Value.absent(),
    this.department = const Value.absent(),
    this.subDepartment = const Value.absent(),
    this.minStock = const Value.absent(),
    this.handlesBulk = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       storeId = Value(storeId),
       description = Value(description),
       salePrice = Value(salePrice),
       currentStock = Value(currentStock),
       unitsPerBulk = Value(unitsPerBulk),
       stockBulks = Value(stockBulks),
       stockUnits = Value(stockUnits),
       cachedAt = Value(cachedAt);
  static Insertable<CachedProduct> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? description,
    Expression<double>? salePrice,
    Expression<int>? currentStock,
    Expression<int>? unitsPerBulk,
    Expression<int>? stockBulks,
    Expression<int>? stockUnits,
    Expression<String>? barcode,
    Expression<String>? brand,
    Expression<String>? department,
    Expression<String>? subDepartment,
    Expression<int>? minStock,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (description != null) 'description': description,
      if (salePrice != null) 'sale_price': salePrice,
      if (currentStock != null) 'current_stock': currentStock,
      if (unitsPerBulk != null) 'units_per_bulk': unitsPerBulk,
      if (stockBulks != null) 'stock_bulks': stockBulks,
      if (stockUnits != null) 'stock_units': stockUnits,
      if (barcode != null) 'barcode': barcode,
      if (brand != null) 'brand': brand,
      if (department != null) 'department': department,
      if (subDepartment != null) 'sub_department': subDepartment,
      if (minStock != null) 'min_stock': minStock,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedProductsCompanion copyWith({
    Value<String>? id,
    Value<String>? storeId,
    Value<String>? description,
    Value<double>? salePrice,
    Value<int>? currentStock,
    Value<int>? unitsPerBulk,
    Value<int>? stockBulks,
    Value<int>? stockUnits,
    Value<String?>? barcode,
    Value<String?>? brand,
    Value<String?>? department,
    Value<String?>? subDepartment,
    Value<int>? minStock,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedProductsCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      description: description ?? this.description,
      salePrice: salePrice ?? this.salePrice,
      currentStock: currentStock ?? this.currentStock,
      unitsPerBulk: unitsPerBulk ?? this.unitsPerBulk,
      stockBulks: stockBulks ?? this.stockBulks,
      stockUnits: stockUnits ?? this.stockUnits,
      barcode: barcode ?? this.barcode,
      brand: brand ?? this.brand,
      department: department ?? this.department,
      subDepartment: subDepartment ?? this.subDepartment,
      minStock: minStock ?? this.minStock,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (salePrice.present) {
      map['sale_price'] = Variable<double>(salePrice.value);
    }
    if (currentStock.present) {
      map['current_stock'] = Variable<int>(currentStock.value);
    }
    if (unitsPerBulk.present) {
      map['units_per_bulk'] = Variable<int>(unitsPerBulk.value);
    }
    if (stockBulks.present) {
      map['stock_bulks'] = Variable<int>(stockBulks.value);
    }
    if (stockUnits.present) {
      map['stock_units'] = Variable<int>(stockUnits.value);
    }
    if (barcode.present) {
      map['barcode'] = Variable<String>(barcode.value);
    }
    if (brand.present) {
      map['brand'] = Variable<String>(brand.value);
    }
    if (department.present) {
      map['department'] = Variable<String>(department.value);
    }
    if (subDepartment.present) {
      map['sub_department'] = Variable<String>(subDepartment.value);
    }
    if (minStock.present) {
      map['min_stock'] = Variable<int>(minStock.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedProductsCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('description: $description, ')
          ..write('salePrice: $salePrice, ')
          ..write('currentStock: $currentStock, ')
          ..write('unitsPerBulk: $unitsPerBulk, ')
          ..write('stockBulks: $stockBulks, ')
          ..write('stockUnits: $stockUnits, ')
          ..write('barcode: $barcode, ')
          ..write('brand: $brand, ')
          ..write('department: $department, ')
          ..write('subDepartment: $subDepartment, ')
          ..write('minStock: $minStock, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedProductBarcodesTable extends CachedProductBarcodes
    with TableInfo<$CachedProductBarcodesTable, CachedProductBarcode> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedProductBarcodesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _productIdMeta = const VerificationMeta(
    'productId',
  );
  @override
  late final GeneratedColumn<String> productId = GeneratedColumn<String>(
    'product_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _barcodeMeta = const VerificationMeta(
    'barcode',
  );
  @override
  late final GeneratedColumn<String> barcode = GeneratedColumn<String>(
    'barcode',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _labelMeta = const VerificationMeta('label');
  @override
  late final GeneratedColumn<String> label = GeneratedColumn<String>(
    'label',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isPrimaryMeta = const VerificationMeta(
    'isPrimary',
  );
  @override
  late final GeneratedColumn<bool> isPrimary = GeneratedColumn<bool>(
    'is_primary',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_primary" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    productId,
    storeId,
    barcode,
    label,
    isPrimary,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_product_barcodes';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedProductBarcode> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('product_id')) {
      context.handle(
        _productIdMeta,
        productId.isAcceptableOrUnknown(data['product_id']!, _productIdMeta),
      );
    } else if (isInserting) {
      context.missing(_productIdMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('barcode')) {
      context.handle(
        _barcodeMeta,
        barcode.isAcceptableOrUnknown(data['barcode']!, _barcodeMeta),
      );
    } else if (isInserting) {
      context.missing(_barcodeMeta);
    }
    if (data.containsKey('label')) {
      context.handle(
        _labelMeta,
        label.isAcceptableOrUnknown(data['label']!, _labelMeta),
      );
    }
    if (data.containsKey('is_primary')) {
      context.handle(
        _isPrimaryMeta,
        isPrimary.isAcceptableOrUnknown(data['is_primary']!, _isPrimaryMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedProductBarcode map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedProductBarcode(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      productId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}product_id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      barcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}barcode'],
      )!,
      label: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}label'],
      ),
      isPrimary: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_primary'],
      )!,
    );
  }

  @override
  $CachedProductBarcodesTable createAlias(String alias) {
    return $CachedProductBarcodesTable(attachedDatabase, alias);
  }
}

class CachedProductBarcode extends DataClass
    implements Insertable<CachedProductBarcode> {
  final String id;
  final String productId;
  final String storeId;
  final String barcode;
  final String? label;
  final bool isPrimary;
  const CachedProductBarcode({
    required this.id,
    required this.productId,
    required this.storeId,
    required this.barcode,
    this.label,
    required this.isPrimary,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['product_id'] = Variable<String>(productId);
    map['store_id'] = Variable<String>(storeId);
    map['barcode'] = Variable<String>(barcode);
    if (!nullToAbsent || label != null) {
      map['label'] = Variable<String>(label);
    }
    map['is_primary'] = Variable<bool>(isPrimary);
    return map;
  }

  CachedProductBarcodesCompanion toCompanion(bool nullToAbsent) {
    return CachedProductBarcodesCompanion(
      id: Value(id),
      productId: Value(productId),
      storeId: Value(storeId),
      barcode: Value(barcode),
      label: label == null && nullToAbsent
          ? const Value.absent()
          : Value(label),
      isPrimary: Value(isPrimary),
    );
  }

  factory CachedProductBarcode.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedProductBarcode(
      id: serializer.fromJson<String>(json['id']),
      productId: serializer.fromJson<String>(json['productId']),
      storeId: serializer.fromJson<String>(json['storeId']),
      barcode: serializer.fromJson<String>(json['barcode']),
      label: serializer.fromJson<String?>(json['label']),
      isPrimary: serializer.fromJson<bool>(json['isPrimary']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'productId': serializer.toJson<String>(productId),
      'storeId': serializer.toJson<String>(storeId),
      'barcode': serializer.toJson<String>(barcode),
      'label': serializer.toJson<String?>(label),
      'isPrimary': serializer.toJson<bool>(isPrimary),
    };
  }

  CachedProductBarcode copyWith({
    String? id,
    String? productId,
    String? storeId,
    String? barcode,
    Value<String?> label = const Value.absent(),
    bool? isPrimary,
  }) => CachedProductBarcode(
    id: id ?? this.id,
    productId: productId ?? this.productId,
    storeId: storeId ?? this.storeId,
    barcode: barcode ?? this.barcode,
    label: label.present ? label.value : this.label,
    isPrimary: isPrimary ?? this.isPrimary,
  );
  CachedProductBarcode copyWithCompanion(CachedProductBarcodesCompanion data) {
    return CachedProductBarcode(
      id: data.id.present ? data.id.value : this.id,
      productId: data.productId.present ? data.productId.value : this.productId,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      barcode: data.barcode.present ? data.barcode.value : this.barcode,
      label: data.label.present ? data.label.value : this.label,
      isPrimary: data.isPrimary.present ? data.isPrimary.value : this.isPrimary,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedProductBarcode(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('storeId: $storeId, ')
          ..write('barcode: $barcode, ')
          ..write('label: $label, ')
          ..write('isPrimary: $isPrimary')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, productId, storeId, barcode, label, isPrimary);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedProductBarcode &&
          other.id == this.id &&
          other.productId == this.productId &&
          other.storeId == this.storeId &&
          other.barcode == this.barcode &&
          other.label == this.label &&
          other.isPrimary == this.isPrimary);
}

class CachedProductBarcodesCompanion
    extends UpdateCompanion<CachedProductBarcode> {
  final Value<String> id;
  final Value<String> productId;
  final Value<String> storeId;
  final Value<String> barcode;
  final Value<String?> label;
  final Value<bool> isPrimary;
  final Value<int> rowid;
  const CachedProductBarcodesCompanion({
    this.id = const Value.absent(),
    this.productId = const Value.absent(),
    this.storeId = const Value.absent(),
    this.barcode = const Value.absent(),
    this.label = const Value.absent(),
    this.isPrimary = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedProductBarcodesCompanion.insert({
    required String id,
    required String productId,
    required String storeId,
    required String barcode,
    this.label = const Value.absent(),
    this.isPrimary = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       productId = Value(productId),
       storeId = Value(storeId),
       barcode = Value(barcode);
  static Insertable<CachedProductBarcode> custom({
    Expression<String>? id,
    Expression<String>? productId,
    Expression<String>? storeId,
    Expression<String>? barcode,
    Expression<String>? label,
    Expression<bool>? isPrimary,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (productId != null) 'product_id': productId,
      if (storeId != null) 'store_id': storeId,
      if (barcode != null) 'barcode': barcode,
      if (label != null) 'label': label,
      if (isPrimary != null) 'is_primary': isPrimary,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedProductBarcodesCompanion copyWith({
    Value<String>? id,
    Value<String>? productId,
    Value<String>? storeId,
    Value<String>? barcode,
    Value<String?>? label,
    Value<bool>? isPrimary,
    Value<int>? rowid,
  }) {
    return CachedProductBarcodesCompanion(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      storeId: storeId ?? this.storeId,
      barcode: barcode ?? this.barcode,
      label: label ?? this.label,
      isPrimary: isPrimary ?? this.isPrimary,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (productId.present) {
      map['product_id'] = Variable<String>(productId.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (barcode.present) {
      map['barcode'] = Variable<String>(barcode.value);
    }
    if (label.present) {
      map['label'] = Variable<String>(label.value);
    }
    if (isPrimary.present) {
      map['is_primary'] = Variable<bool>(isPrimary.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedProductBarcodesCompanion(')
          ..write('id: $id, ')
          ..write('productId: $productId, ')
          ..write('storeId: $storeId, ')
          ..write('barcode: $barcode, ')
          ..write('label: $label, ')
          ..write('isPrimary: $isPrimary, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedClientsTable extends CachedClients
    with TableInfo<$CachedClientsTable, CachedClient> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedClientsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
    'email',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _addressMeta = const VerificationMeta(
    'address',
  );
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
    'address',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    storeId,
    name,
    email,
    phone,
    address,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_clients';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedClient> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
        _emailMeta,
        email.isAcceptableOrUnknown(data['email']!, _emailMeta),
      );
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    }
    if (data.containsKey('address')) {
      context.handle(
        _addressMeta,
        address.isAcceptableOrUnknown(data['address']!, _addressMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, storeId};
  @override
  CachedClient map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedClient(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      email: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}email'],
      ),
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      ),
      address: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}address'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedClientsTable createAlias(String alias) {
    return $CachedClientsTable(attachedDatabase, alias);
  }
}

class CachedClient extends DataClass implements Insertable<CachedClient> {
  final String id;
  final String storeId;
  final String name;
  final String? email;
  final String? phone;
  final String? address;
  final DateTime cachedAt;
  const CachedClient({
    required this.id,
    required this.storeId,
    required this.name,
    this.email,
    this.phone,
    this.address,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || address != null) {
      map['address'] = Variable<String>(address);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedClientsCompanion toCompanion(bool nullToAbsent) {
    return CachedClientsCompanion(
      id: Value(id),
      storeId: Value(storeId),
      name: Value(name),
      email: email == null && nullToAbsent
          ? const Value.absent()
          : Value(email),
      phone: phone == null && nullToAbsent
          ? const Value.absent()
          : Value(phone),
      address: address == null && nullToAbsent
          ? const Value.absent()
          : Value(address),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedClient.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedClient(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      name: serializer.fromJson<String>(json['name']),
      email: serializer.fromJson<String?>(json['email']),
      phone: serializer.fromJson<String?>(json['phone']),
      address: serializer.fromJson<String?>(json['address']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'name': serializer.toJson<String>(name),
      'email': serializer.toJson<String?>(email),
      'phone': serializer.toJson<String?>(phone),
      'address': serializer.toJson<String?>(address),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedClient copyWith({
    String? id,
    String? storeId,
    String? name,
    Value<String?> email = const Value.absent(),
    Value<String?> phone = const Value.absent(),
    Value<String?> address = const Value.absent(),
    DateTime? cachedAt,
  }) => CachedClient(
    id: id ?? this.id,
    storeId: storeId ?? this.storeId,
    name: name ?? this.name,
    email: email.present ? email.value : this.email,
    phone: phone.present ? phone.value : this.phone,
    address: address.present ? address.value : this.address,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedClient copyWithCompanion(CachedClientsCompanion data) {
    return CachedClient(
      id: data.id.present ? data.id.value : this.id,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      name: data.name.present ? data.name.value : this.name,
      email: data.email.present ? data.email.value : this.email,
      phone: data.phone.present ? data.phone.value : this.phone,
      address: data.address.present ? data.address.value : this.address,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedClient(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('phone: $phone, ')
          ..write('address: $address, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, storeId, name, email, phone, address, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedClient &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.name == this.name &&
          other.email == this.email &&
          other.phone == this.phone &&
          other.address == this.address &&
          other.cachedAt == this.cachedAt);
}

class CachedClientsCompanion extends UpdateCompanion<CachedClient> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> name;
  final Value<String?> email;
  final Value<String?> phone;
  final Value<String?> address;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedClientsCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.name = const Value.absent(),
    this.email = const Value.absent(),
    this.phone = const Value.absent(),
    this.address = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedClientsCompanion.insert({
    required String id,
    required String storeId,
    required String name,
    this.email = const Value.absent(),
    this.phone = const Value.absent(),
    this.address = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       storeId = Value(storeId),
       name = Value(name),
       cachedAt = Value(cachedAt);
  static Insertable<CachedClient> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? name,
    Expression<String>? email,
    Expression<String>? phone,
    Expression<String>? address,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (name != null) 'name': name,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedClientsCompanion copyWith({
    Value<String>? id,
    Value<String>? storeId,
    Value<String>? name,
    Value<String?>? email,
    Value<String?>? phone,
    Value<String?>? address,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedClientsCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedClientsCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('name: $name, ')
          ..write('email: $email, ')
          ..write('phone: $phone, ')
          ..write('address: $address, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedReceivableAccountsTable extends CachedReceivableAccounts
    with TableInfo<$CachedReceivableAccountsTable, CachedReceivableAccount> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedReceivableAccountsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientIdMeta = const VerificationMeta(
    'clientId',
  );
  @override
  late final GeneratedColumn<String> clientId = GeneratedColumn<String>(
    'client_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientNameMeta = const VerificationMeta(
    'clientName',
  );
  @override
  late final GeneratedColumn<String> clientName = GeneratedColumn<String>(
    'client_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _totalAmountMeta = const VerificationMeta(
    'totalAmount',
  );
  @override
  late final GeneratedColumn<double> totalAmount = GeneratedColumn<double>(
    'total_amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _remainingAmountMeta = const VerificationMeta(
    'remainingAmount',
  );
  @override
  late final GeneratedColumn<double> remainingAmount = GeneratedColumn<double>(
    'remaining_amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _pendingAmountMeta = const VerificationMeta(
    'pendingAmount',
  );
  @override
  late final GeneratedColumn<double> pendingAmount = GeneratedColumn<double>(
    'pending_amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _orderIdMeta = const VerificationMeta(
    'orderId',
  );
  @override
  late final GeneratedColumn<String> orderId = GeneratedColumn<String>(
    'order_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _descriptionMeta = const VerificationMeta(
    'description',
  );
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
    'description',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    storeId,
    clientId,
    clientName,
    totalAmount,
    remainingAmount,
    pendingAmount,
    status,
    orderId,
    description,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_receivable_accounts';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedReceivableAccount> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('client_id')) {
      context.handle(
        _clientIdMeta,
        clientId.isAcceptableOrUnknown(data['client_id']!, _clientIdMeta),
      );
    } else if (isInserting) {
      context.missing(_clientIdMeta);
    }
    if (data.containsKey('client_name')) {
      context.handle(
        _clientNameMeta,
        clientName.isAcceptableOrUnknown(data['client_name']!, _clientNameMeta),
      );
    } else if (isInserting) {
      context.missing(_clientNameMeta);
    }
    if (data.containsKey('total_amount')) {
      context.handle(
        _totalAmountMeta,
        totalAmount.isAcceptableOrUnknown(
          data['total_amount']!,
          _totalAmountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_totalAmountMeta);
    }
    if (data.containsKey('remaining_amount')) {
      context.handle(
        _remainingAmountMeta,
        remainingAmount.isAcceptableOrUnknown(
          data['remaining_amount']!,
          _remainingAmountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_remainingAmountMeta);
    }
    if (data.containsKey('pending_amount')) {
      context.handle(
        _pendingAmountMeta,
        pendingAmount.isAcceptableOrUnknown(
          data['pending_amount']!,
          _pendingAmountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pendingAmountMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('order_id')) {
      context.handle(
        _orderIdMeta,
        orderId.isAcceptableOrUnknown(data['order_id']!, _orderIdMeta),
      );
    }
    if (data.containsKey('description')) {
      context.handle(
        _descriptionMeta,
        description.isAcceptableOrUnknown(
          data['description']!,
          _descriptionMeta,
        ),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, storeId};
  @override
  CachedReceivableAccount map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedReceivableAccount(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      clientId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_id'],
      )!,
      clientName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_name'],
      )!,
      totalAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}total_amount'],
      )!,
      remainingAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}remaining_amount'],
      )!,
      pendingAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}pending_amount'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      orderId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}order_id'],
      ),
      description: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}description'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedReceivableAccountsTable createAlias(String alias) {
    return $CachedReceivableAccountsTable(attachedDatabase, alias);
  }
}

class CachedReceivableAccount extends DataClass
    implements Insertable<CachedReceivableAccount> {
  final String id;
  final String storeId;
  final String clientId;
  final String clientName;
  final double totalAmount;
  final double remainingAmount;
  final double pendingAmount;
  final String status;
  final String? orderId;
  final String? description;
  final DateTime cachedAt;
  const CachedReceivableAccount({
    required this.id,
    required this.storeId,
    required this.clientId,
    required this.clientName,
    required this.totalAmount,
    required this.remainingAmount,
    required this.pendingAmount,
    required this.status,
    this.orderId,
    this.description,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['client_id'] = Variable<String>(clientId);
    map['client_name'] = Variable<String>(clientName);
    map['total_amount'] = Variable<double>(totalAmount);
    map['remaining_amount'] = Variable<double>(remainingAmount);
    map['pending_amount'] = Variable<double>(pendingAmount);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || orderId != null) {
      map['order_id'] = Variable<String>(orderId);
    }
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedReceivableAccountsCompanion toCompanion(bool nullToAbsent) {
    return CachedReceivableAccountsCompanion(
      id: Value(id),
      storeId: Value(storeId),
      clientId: Value(clientId),
      clientName: Value(clientName),
      totalAmount: Value(totalAmount),
      remainingAmount: Value(remainingAmount),
      pendingAmount: Value(pendingAmount),
      status: Value(status),
      orderId: orderId == null && nullToAbsent
          ? const Value.absent()
          : Value(orderId),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedReceivableAccount.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedReceivableAccount(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      clientId: serializer.fromJson<String>(json['clientId']),
      clientName: serializer.fromJson<String>(json['clientName']),
      totalAmount: serializer.fromJson<double>(json['totalAmount']),
      remainingAmount: serializer.fromJson<double>(json['remainingAmount']),
      pendingAmount: serializer.fromJson<double>(json['pendingAmount']),
      status: serializer.fromJson<String>(json['status']),
      orderId: serializer.fromJson<String?>(json['orderId']),
      description: serializer.fromJson<String?>(json['description']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'clientId': serializer.toJson<String>(clientId),
      'clientName': serializer.toJson<String>(clientName),
      'totalAmount': serializer.toJson<double>(totalAmount),
      'remainingAmount': serializer.toJson<double>(remainingAmount),
      'pendingAmount': serializer.toJson<double>(pendingAmount),
      'status': serializer.toJson<String>(status),
      'orderId': serializer.toJson<String?>(orderId),
      'description': serializer.toJson<String?>(description),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedReceivableAccount copyWith({
    String? id,
    String? storeId,
    String? clientId,
    String? clientName,
    double? totalAmount,
    double? remainingAmount,
    double? pendingAmount,
    String? status,
    Value<String?> orderId = const Value.absent(),
    Value<String?> description = const Value.absent(),
    DateTime? cachedAt,
  }) => CachedReceivableAccount(
    id: id ?? this.id,
    storeId: storeId ?? this.storeId,
    clientId: clientId ?? this.clientId,
    clientName: clientName ?? this.clientName,
    totalAmount: totalAmount ?? this.totalAmount,
    remainingAmount: remainingAmount ?? this.remainingAmount,
    pendingAmount: pendingAmount ?? this.pendingAmount,
    status: status ?? this.status,
    orderId: orderId.present ? orderId.value : this.orderId,
    description: description.present ? description.value : this.description,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedReceivableAccount copyWithCompanion(
    CachedReceivableAccountsCompanion data,
  ) {
    return CachedReceivableAccount(
      id: data.id.present ? data.id.value : this.id,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      clientId: data.clientId.present ? data.clientId.value : this.clientId,
      clientName: data.clientName.present
          ? data.clientName.value
          : this.clientName,
      totalAmount: data.totalAmount.present
          ? data.totalAmount.value
          : this.totalAmount,
      remainingAmount: data.remainingAmount.present
          ? data.remainingAmount.value
          : this.remainingAmount,
      pendingAmount: data.pendingAmount.present
          ? data.pendingAmount.value
          : this.pendingAmount,
      status: data.status.present ? data.status.value : this.status,
      orderId: data.orderId.present ? data.orderId.value : this.orderId,
      description: data.description.present
          ? data.description.value
          : this.description,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedReceivableAccount(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('clientId: $clientId, ')
          ..write('clientName: $clientName, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('remainingAmount: $remainingAmount, ')
          ..write('pendingAmount: $pendingAmount, ')
          ..write('status: $status, ')
          ..write('orderId: $orderId, ')
          ..write('description: $description, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    storeId,
    clientId,
    clientName,
    totalAmount,
    remainingAmount,
    pendingAmount,
    status,
    orderId,
    description,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedReceivableAccount &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.clientId == this.clientId &&
          other.clientName == this.clientName &&
          other.totalAmount == this.totalAmount &&
          other.remainingAmount == this.remainingAmount &&
          other.pendingAmount == this.pendingAmount &&
          other.status == this.status &&
          other.orderId == this.orderId &&
          other.description == this.description &&
          other.cachedAt == this.cachedAt);
}

class CachedReceivableAccountsCompanion
    extends UpdateCompanion<CachedReceivableAccount> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> clientId;
  final Value<String> clientName;
  final Value<double> totalAmount;
  final Value<double> remainingAmount;
  final Value<double> pendingAmount;
  final Value<String> status;
  final Value<String?> orderId;
  final Value<String?> description;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedReceivableAccountsCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.clientId = const Value.absent(),
    this.clientName = const Value.absent(),
    this.totalAmount = const Value.absent(),
    this.remainingAmount = const Value.absent(),
    this.pendingAmount = const Value.absent(),
    this.status = const Value.absent(),
    this.orderId = const Value.absent(),
    this.description = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedReceivableAccountsCompanion.insert({
    required String id,
    required String storeId,
    required String clientId,
    required String clientName,
    required double totalAmount,
    required double remainingAmount,
    required double pendingAmount,
    required String status,
    this.orderId = const Value.absent(),
    this.description = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       storeId = Value(storeId),
       clientId = Value(clientId),
       clientName = Value(clientName),
       totalAmount = Value(totalAmount),
       remainingAmount = Value(remainingAmount),
       pendingAmount = Value(pendingAmount),
       status = Value(status),
       cachedAt = Value(cachedAt);
  static Insertable<CachedReceivableAccount> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? clientId,
    Expression<String>? clientName,
    Expression<double>? totalAmount,
    Expression<double>? remainingAmount,
    Expression<double>? pendingAmount,
    Expression<String>? status,
    Expression<String>? orderId,
    Expression<String>? description,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (clientId != null) 'client_id': clientId,
      if (clientName != null) 'client_name': clientName,
      if (totalAmount != null) 'total_amount': totalAmount,
      if (remainingAmount != null) 'remaining_amount': remainingAmount,
      if (pendingAmount != null) 'pending_amount': pendingAmount,
      if (status != null) 'status': status,
      if (orderId != null) 'order_id': orderId,
      if (description != null) 'description': description,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedReceivableAccountsCompanion copyWith({
    Value<String>? id,
    Value<String>? storeId,
    Value<String>? clientId,
    Value<String>? clientName,
    Value<double>? totalAmount,
    Value<double>? remainingAmount,
    Value<double>? pendingAmount,
    Value<String>? status,
    Value<String?>? orderId,
    Value<String?>? description,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedReceivableAccountsCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      totalAmount: totalAmount ?? this.totalAmount,
      remainingAmount: remainingAmount ?? this.remainingAmount,
      pendingAmount: pendingAmount ?? this.pendingAmount,
      status: status ?? this.status,
      orderId: orderId ?? this.orderId,
      description: description ?? this.description,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (clientId.present) {
      map['client_id'] = Variable<String>(clientId.value);
    }
    if (clientName.present) {
      map['client_name'] = Variable<String>(clientName.value);
    }
    if (totalAmount.present) {
      map['total_amount'] = Variable<double>(totalAmount.value);
    }
    if (remainingAmount.present) {
      map['remaining_amount'] = Variable<double>(remainingAmount.value);
    }
    if (pendingAmount.present) {
      map['pending_amount'] = Variable<double>(pendingAmount.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (orderId.present) {
      map['order_id'] = Variable<String>(orderId.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedReceivableAccountsCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('clientId: $clientId, ')
          ..write('clientName: $clientName, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('remainingAmount: $remainingAmount, ')
          ..write('pendingAmount: $pendingAmount, ')
          ..write('status: $status, ')
          ..write('orderId: $orderId, ')
          ..write('description: $description, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedCollectionSummariesTable extends CachedCollectionSummaries
    with TableInfo<$CachedCollectionSummariesTable, CachedCollectionSummary> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedCollectionSummariesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _scopeKeyMeta = const VerificationMeta(
    'scopeKey',
  );
  @override
  late final GeneratedColumn<String> scopeKey = GeneratedColumn<String>(
    'scope_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _totalCountMeta = const VerificationMeta(
    'totalCount',
  );
  @override
  late final GeneratedColumn<int> totalCount = GeneratedColumn<int>(
    'total_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _totalAmountMeta = const VerificationMeta(
    'totalAmount',
  );
  @override
  late final GeneratedColumn<double> totalAmount = GeneratedColumn<double>(
    'total_amount',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cashTotalMeta = const VerificationMeta(
    'cashTotal',
  );
  @override
  late final GeneratedColumn<double> cashTotal = GeneratedColumn<double>(
    'cash_total',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _otherTotalMeta = const VerificationMeta(
    'otherTotal',
  );
  @override
  late final GeneratedColumn<double> otherTotal = GeneratedColumn<double>(
    'other_total',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    storeId,
    scopeKey,
    totalCount,
    totalAmount,
    cashTotal,
    otherTotal,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_collection_summaries';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedCollectionSummary> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('scope_key')) {
      context.handle(
        _scopeKeyMeta,
        scopeKey.isAcceptableOrUnknown(data['scope_key']!, _scopeKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_scopeKeyMeta);
    }
    if (data.containsKey('total_count')) {
      context.handle(
        _totalCountMeta,
        totalCount.isAcceptableOrUnknown(data['total_count']!, _totalCountMeta),
      );
    } else if (isInserting) {
      context.missing(_totalCountMeta);
    }
    if (data.containsKey('total_amount')) {
      context.handle(
        _totalAmountMeta,
        totalAmount.isAcceptableOrUnknown(
          data['total_amount']!,
          _totalAmountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_totalAmountMeta);
    }
    if (data.containsKey('cash_total')) {
      context.handle(
        _cashTotalMeta,
        cashTotal.isAcceptableOrUnknown(data['cash_total']!, _cashTotalMeta),
      );
    } else if (isInserting) {
      context.missing(_cashTotalMeta);
    }
    if (data.containsKey('other_total')) {
      context.handle(
        _otherTotalMeta,
        otherTotal.isAcceptableOrUnknown(data['other_total']!, _otherTotalMeta),
      );
    } else if (isInserting) {
      context.missing(_otherTotalMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {storeId, scopeKey};
  @override
  CachedCollectionSummary map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedCollectionSummary(
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      scopeKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}scope_key'],
      )!,
      totalCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}total_count'],
      )!,
      totalAmount: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}total_amount'],
      )!,
      cashTotal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}cash_total'],
      )!,
      otherTotal: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}other_total'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedCollectionSummariesTable createAlias(String alias) {
    return $CachedCollectionSummariesTable(attachedDatabase, alias);
  }
}

class CachedCollectionSummary extends DataClass
    implements Insertable<CachedCollectionSummary> {
  final String storeId;
  final String scopeKey;
  final int totalCount;
  final double totalAmount;
  final double cashTotal;
  final double otherTotal;
  final DateTime cachedAt;
  const CachedCollectionSummary({
    required this.storeId,
    required this.scopeKey,
    required this.totalCount,
    required this.totalAmount,
    required this.cashTotal,
    required this.otherTotal,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['store_id'] = Variable<String>(storeId);
    map['scope_key'] = Variable<String>(scopeKey);
    map['total_count'] = Variable<int>(totalCount);
    map['total_amount'] = Variable<double>(totalAmount);
    map['cash_total'] = Variable<double>(cashTotal);
    map['other_total'] = Variable<double>(otherTotal);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedCollectionSummariesCompanion toCompanion(bool nullToAbsent) {
    return CachedCollectionSummariesCompanion(
      storeId: Value(storeId),
      scopeKey: Value(scopeKey),
      totalCount: Value(totalCount),
      totalAmount: Value(totalAmount),
      cashTotal: Value(cashTotal),
      otherTotal: Value(otherTotal),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedCollectionSummary.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedCollectionSummary(
      storeId: serializer.fromJson<String>(json['storeId']),
      scopeKey: serializer.fromJson<String>(json['scopeKey']),
      totalCount: serializer.fromJson<int>(json['totalCount']),
      totalAmount: serializer.fromJson<double>(json['totalAmount']),
      cashTotal: serializer.fromJson<double>(json['cashTotal']),
      otherTotal: serializer.fromJson<double>(json['otherTotal']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'storeId': serializer.toJson<String>(storeId),
      'scopeKey': serializer.toJson<String>(scopeKey),
      'totalCount': serializer.toJson<int>(totalCount),
      'totalAmount': serializer.toJson<double>(totalAmount),
      'cashTotal': serializer.toJson<double>(cashTotal),
      'otherTotal': serializer.toJson<double>(otherTotal),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedCollectionSummary copyWith({
    String? storeId,
    String? scopeKey,
    int? totalCount,
    double? totalAmount,
    double? cashTotal,
    double? otherTotal,
    DateTime? cachedAt,
  }) => CachedCollectionSummary(
    storeId: storeId ?? this.storeId,
    scopeKey: scopeKey ?? this.scopeKey,
    totalCount: totalCount ?? this.totalCount,
    totalAmount: totalAmount ?? this.totalAmount,
    cashTotal: cashTotal ?? this.cashTotal,
    otherTotal: otherTotal ?? this.otherTotal,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedCollectionSummary copyWithCompanion(
    CachedCollectionSummariesCompanion data,
  ) {
    return CachedCollectionSummary(
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      scopeKey: data.scopeKey.present ? data.scopeKey.value : this.scopeKey,
      totalCount: data.totalCount.present
          ? data.totalCount.value
          : this.totalCount,
      totalAmount: data.totalAmount.present
          ? data.totalAmount.value
          : this.totalAmount,
      cashTotal: data.cashTotal.present ? data.cashTotal.value : this.cashTotal,
      otherTotal: data.otherTotal.present
          ? data.otherTotal.value
          : this.otherTotal,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedCollectionSummary(')
          ..write('storeId: $storeId, ')
          ..write('scopeKey: $scopeKey, ')
          ..write('totalCount: $totalCount, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('cashTotal: $cashTotal, ')
          ..write('otherTotal: $otherTotal, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    storeId,
    scopeKey,
    totalCount,
    totalAmount,
    cashTotal,
    otherTotal,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedCollectionSummary &&
          other.storeId == this.storeId &&
          other.scopeKey == this.scopeKey &&
          other.totalCount == this.totalCount &&
          other.totalAmount == this.totalAmount &&
          other.cashTotal == this.cashTotal &&
          other.otherTotal == this.otherTotal &&
          other.cachedAt == this.cachedAt);
}

class CachedCollectionSummariesCompanion
    extends UpdateCompanion<CachedCollectionSummary> {
  final Value<String> storeId;
  final Value<String> scopeKey;
  final Value<int> totalCount;
  final Value<double> totalAmount;
  final Value<double> cashTotal;
  final Value<double> otherTotal;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedCollectionSummariesCompanion({
    this.storeId = const Value.absent(),
    this.scopeKey = const Value.absent(),
    this.totalCount = const Value.absent(),
    this.totalAmount = const Value.absent(),
    this.cashTotal = const Value.absent(),
    this.otherTotal = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedCollectionSummariesCompanion.insert({
    required String storeId,
    required String scopeKey,
    required int totalCount,
    required double totalAmount,
    required double cashTotal,
    required double otherTotal,
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : storeId = Value(storeId),
       scopeKey = Value(scopeKey),
       totalCount = Value(totalCount),
       totalAmount = Value(totalAmount),
       cashTotal = Value(cashTotal),
       otherTotal = Value(otherTotal),
       cachedAt = Value(cachedAt);
  static Insertable<CachedCollectionSummary> custom({
    Expression<String>? storeId,
    Expression<String>? scopeKey,
    Expression<int>? totalCount,
    Expression<double>? totalAmount,
    Expression<double>? cashTotal,
    Expression<double>? otherTotal,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (storeId != null) 'store_id': storeId,
      if (scopeKey != null) 'scope_key': scopeKey,
      if (totalCount != null) 'total_count': totalCount,
      if (totalAmount != null) 'total_amount': totalAmount,
      if (cashTotal != null) 'cash_total': cashTotal,
      if (otherTotal != null) 'other_total': otherTotal,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedCollectionSummariesCompanion copyWith({
    Value<String>? storeId,
    Value<String>? scopeKey,
    Value<int>? totalCount,
    Value<double>? totalAmount,
    Value<double>? cashTotal,
    Value<double>? otherTotal,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedCollectionSummariesCompanion(
      storeId: storeId ?? this.storeId,
      scopeKey: scopeKey ?? this.scopeKey,
      totalCount: totalCount ?? this.totalCount,
      totalAmount: totalAmount ?? this.totalAmount,
      cashTotal: cashTotal ?? this.cashTotal,
      otherTotal: otherTotal ?? this.otherTotal,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (scopeKey.present) {
      map['scope_key'] = Variable<String>(scopeKey.value);
    }
    if (totalCount.present) {
      map['total_count'] = Variable<int>(totalCount.value);
    }
    if (totalAmount.present) {
      map['total_amount'] = Variable<double>(totalAmount.value);
    }
    if (cashTotal.present) {
      map['cash_total'] = Variable<double>(cashTotal.value);
    }
    if (otherTotal.present) {
      map['other_total'] = Variable<double>(otherTotal.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedCollectionSummariesCompanion(')
          ..write('storeId: $storeId, ')
          ..write('scopeKey: $scopeKey, ')
          ..write('totalCount: $totalCount, ')
          ..write('totalAmount: $totalAmount, ')
          ..write('cashTotal: $cashTotal, ')
          ..write('otherTotal: $otherTotal, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedRoutesTable extends CachedRoutes
    with TableInfo<$CachedRoutesTable, CachedRoute> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedRoutesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vendorIdMeta = const VerificationMeta(
    'vendorId',
  );
  @override
  late final GeneratedColumn<String> vendorId = GeneratedColumn<String>(
    'vendor_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientIdsJsonMeta = const VerificationMeta(
    'clientIdsJson',
  );
  @override
  late final GeneratedColumn<String> clientIdsJson = GeneratedColumn<String>(
    'client_ids_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _routeDateMeta = const VerificationMeta(
    'routeDate',
  );
  @override
  late final GeneratedColumn<DateTime> routeDate = GeneratedColumn<DateTime>(
    'route_date',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    storeId,
    vendorId,
    clientIdsJson,
    routeDate,
    status,
    notes,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_routes';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedRoute> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('vendor_id')) {
      context.handle(
        _vendorIdMeta,
        vendorId.isAcceptableOrUnknown(data['vendor_id']!, _vendorIdMeta),
      );
    } else if (isInserting) {
      context.missing(_vendorIdMeta);
    }
    if (data.containsKey('client_ids_json')) {
      context.handle(
        _clientIdsJsonMeta,
        clientIdsJson.isAcceptableOrUnknown(
          data['client_ids_json']!,
          _clientIdsJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientIdsJsonMeta);
    }
    if (data.containsKey('route_date')) {
      context.handle(
        _routeDateMeta,
        routeDate.isAcceptableOrUnknown(data['route_date']!, _routeDateMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, storeId};
  @override
  CachedRoute map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedRoute(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      vendorId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vendor_id'],
      )!,
      clientIdsJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_ids_json'],
      )!,
      routeDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}route_date'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedRoutesTable createAlias(String alias) {
    return $CachedRoutesTable(attachedDatabase, alias);
  }
}

class CachedRoute extends DataClass implements Insertable<CachedRoute> {
  final String id;
  final String storeId;
  final String vendorId;
  final String clientIdsJson;
  final DateTime? routeDate;
  final String status;
  final String? notes;
  final DateTime cachedAt;
  const CachedRoute({
    required this.id,
    required this.storeId,
    required this.vendorId,
    required this.clientIdsJson,
    this.routeDate,
    required this.status,
    this.notes,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['vendor_id'] = Variable<String>(vendorId);
    map['client_ids_json'] = Variable<String>(clientIdsJson);
    if (!nullToAbsent || routeDate != null) {
      map['route_date'] = Variable<DateTime>(routeDate);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedRoutesCompanion toCompanion(bool nullToAbsent) {
    return CachedRoutesCompanion(
      id: Value(id),
      storeId: Value(storeId),
      vendorId: Value(vendorId),
      clientIdsJson: Value(clientIdsJson),
      routeDate: routeDate == null && nullToAbsent
          ? const Value.absent()
          : Value(routeDate),
      status: Value(status),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedRoute.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedRoute(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      vendorId: serializer.fromJson<String>(json['vendorId']),
      clientIdsJson: serializer.fromJson<String>(json['clientIdsJson']),
      routeDate: serializer.fromJson<DateTime?>(json['routeDate']),
      status: serializer.fromJson<String>(json['status']),
      notes: serializer.fromJson<String?>(json['notes']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'vendorId': serializer.toJson<String>(vendorId),
      'clientIdsJson': serializer.toJson<String>(clientIdsJson),
      'routeDate': serializer.toJson<DateTime?>(routeDate),
      'status': serializer.toJson<String>(status),
      'notes': serializer.toJson<String?>(notes),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedRoute copyWith({
    String? id,
    String? storeId,
    String? vendorId,
    String? clientIdsJson,
    Value<DateTime?> routeDate = const Value.absent(),
    String? status,
    Value<String?> notes = const Value.absent(),
    DateTime? cachedAt,
  }) => CachedRoute(
    id: id ?? this.id,
    storeId: storeId ?? this.storeId,
    vendorId: vendorId ?? this.vendorId,
    clientIdsJson: clientIdsJson ?? this.clientIdsJson,
    routeDate: routeDate.present ? routeDate.value : this.routeDate,
    status: status ?? this.status,
    notes: notes.present ? notes.value : this.notes,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedRoute copyWithCompanion(CachedRoutesCompanion data) {
    return CachedRoute(
      id: data.id.present ? data.id.value : this.id,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      vendorId: data.vendorId.present ? data.vendorId.value : this.vendorId,
      clientIdsJson: data.clientIdsJson.present
          ? data.clientIdsJson.value
          : this.clientIdsJson,
      routeDate: data.routeDate.present ? data.routeDate.value : this.routeDate,
      status: data.status.present ? data.status.value : this.status,
      notes: data.notes.present ? data.notes.value : this.notes,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedRoute(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('vendorId: $vendorId, ')
          ..write('clientIdsJson: $clientIdsJson, ')
          ..write('routeDate: $routeDate, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    storeId,
    vendorId,
    clientIdsJson,
    routeDate,
    status,
    notes,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedRoute &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.vendorId == this.vendorId &&
          other.clientIdsJson == this.clientIdsJson &&
          other.routeDate == this.routeDate &&
          other.status == this.status &&
          other.notes == this.notes &&
          other.cachedAt == this.cachedAt);
}

class CachedRoutesCompanion extends UpdateCompanion<CachedRoute> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> vendorId;
  final Value<String> clientIdsJson;
  final Value<DateTime?> routeDate;
  final Value<String> status;
  final Value<String?> notes;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedRoutesCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.vendorId = const Value.absent(),
    this.clientIdsJson = const Value.absent(),
    this.routeDate = const Value.absent(),
    this.status = const Value.absent(),
    this.notes = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedRoutesCompanion.insert({
    required String id,
    required String storeId,
    required String vendorId,
    required String clientIdsJson,
    this.routeDate = const Value.absent(),
    required String status,
    this.notes = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       storeId = Value(storeId),
       vendorId = Value(vendorId),
       clientIdsJson = Value(clientIdsJson),
       status = Value(status),
       cachedAt = Value(cachedAt);
  static Insertable<CachedRoute> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? vendorId,
    Expression<String>? clientIdsJson,
    Expression<DateTime>? routeDate,
    Expression<String>? status,
    Expression<String>? notes,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (vendorId != null) 'vendor_id': vendorId,
      if (clientIdsJson != null) 'client_ids_json': clientIdsJson,
      if (routeDate != null) 'route_date': routeDate,
      if (status != null) 'status': status,
      if (notes != null) 'notes': notes,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedRoutesCompanion copyWith({
    Value<String>? id,
    Value<String>? storeId,
    Value<String>? vendorId,
    Value<String>? clientIdsJson,
    Value<DateTime?>? routeDate,
    Value<String>? status,
    Value<String?>? notes,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedRoutesCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      vendorId: vendorId ?? this.vendorId,
      clientIdsJson: clientIdsJson ?? this.clientIdsJson,
      routeDate: routeDate ?? this.routeDate,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (vendorId.present) {
      map['vendor_id'] = Variable<String>(vendorId.value);
    }
    if (clientIdsJson.present) {
      map['client_ids_json'] = Variable<String>(clientIdsJson.value);
    }
    if (routeDate.present) {
      map['route_date'] = Variable<DateTime>(routeDate.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedRoutesCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('vendorId: $vendorId, ')
          ..write('clientIdsJson: $clientIdsJson, ')
          ..write('routeDate: $routeDate, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedDeliveriesTable extends CachedDeliveries
    with TableInfo<$CachedDeliveriesTable, CachedDelivery> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedDeliveriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _orderIdMeta = const VerificationMeta(
    'orderId',
  );
  @override
  late final GeneratedColumn<String> orderId = GeneratedColumn<String>(
    'order_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _itemsJsonMeta = const VerificationMeta(
    'itemsJson',
  );
  @override
  late final GeneratedColumn<String> itemsJson = GeneratedColumn<String>(
    'items_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _totalMeta = const VerificationMeta('total');
  @override
  late final GeneratedColumn<double> total = GeneratedColumn<double>(
    'total',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientIdMeta = const VerificationMeta(
    'clientId',
  );
  @override
  late final GeneratedColumn<String> clientId = GeneratedColumn<String>(
    'client_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _clientNameMeta = const VerificationMeta(
    'clientName',
  );
  @override
  late final GeneratedColumn<String> clientName = GeneratedColumn<String>(
    'client_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _clientAddressMeta = const VerificationMeta(
    'clientAddress',
  );
  @override
  late final GeneratedColumn<String> clientAddress = GeneratedColumn<String>(
    'client_address',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ruteroIdMeta = const VerificationMeta(
    'ruteroId',
  );
  @override
  late final GeneratedColumn<String> ruteroId = GeneratedColumn<String>(
    'rutero_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _paymentTypeMeta = const VerificationMeta(
    'paymentType',
  );
  @override
  late final GeneratedColumn<String> paymentType = GeneratedColumn<String>(
    'payment_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _salesManagerNameMeta = const VerificationMeta(
    'salesManagerName',
  );
  @override
  late final GeneratedColumn<String> salesManagerName = GeneratedColumn<String>(
    'sales_manager_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    storeId,
    orderId,
    status,
    itemsJson,
    total,
    clientId,
    clientName,
    clientAddress,
    ruteroId,
    paymentType,
    salesManagerName,
    notes,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_deliveries';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedDelivery> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('order_id')) {
      context.handle(
        _orderIdMeta,
        orderId.isAcceptableOrUnknown(data['order_id']!, _orderIdMeta),
      );
    } else if (isInserting) {
      context.missing(_orderIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('items_json')) {
      context.handle(
        _itemsJsonMeta,
        itemsJson.isAcceptableOrUnknown(data['items_json']!, _itemsJsonMeta),
      );
    } else if (isInserting) {
      context.missing(_itemsJsonMeta);
    }
    if (data.containsKey('total')) {
      context.handle(
        _totalMeta,
        total.isAcceptableOrUnknown(data['total']!, _totalMeta),
      );
    } else if (isInserting) {
      context.missing(_totalMeta);
    }
    if (data.containsKey('client_id')) {
      context.handle(
        _clientIdMeta,
        clientId.isAcceptableOrUnknown(data['client_id']!, _clientIdMeta),
      );
    }
    if (data.containsKey('client_name')) {
      context.handle(
        _clientNameMeta,
        clientName.isAcceptableOrUnknown(data['client_name']!, _clientNameMeta),
      );
    }
    if (data.containsKey('client_address')) {
      context.handle(
        _clientAddressMeta,
        clientAddress.isAcceptableOrUnknown(
          data['client_address']!,
          _clientAddressMeta,
        ),
      );
    }
    if (data.containsKey('rutero_id')) {
      context.handle(
        _ruteroIdMeta,
        ruteroId.isAcceptableOrUnknown(data['rutero_id']!, _ruteroIdMeta),
      );
    }
    if (data.containsKey('payment_type')) {
      context.handle(
        _paymentTypeMeta,
        paymentType.isAcceptableOrUnknown(
          data['payment_type']!,
          _paymentTypeMeta,
        ),
      );
    }
    if (data.containsKey('sales_manager_name')) {
      context.handle(
        _salesManagerNameMeta,
        salesManagerName.isAcceptableOrUnknown(
          data['sales_manager_name']!,
          _salesManagerNameMeta,
        ),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id, storeId};
  @override
  CachedDelivery map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedDelivery(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      )!,
      orderId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}order_id'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      itemsJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}items_json'],
      )!,
      total: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}total'],
      )!,
      clientId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_id'],
      ),
      clientName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_name'],
      ),
      clientAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_address'],
      ),
      ruteroId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}rutero_id'],
      ),
      paymentType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payment_type'],
      ),
      salesManagerName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sales_manager_name'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $CachedDeliveriesTable createAlias(String alias) {
    return $CachedDeliveriesTable(attachedDatabase, alias);
  }
}

class CachedDelivery extends DataClass implements Insertable<CachedDelivery> {
  final String id;
  final String storeId;
  final String orderId;
  final String status;
  final String itemsJson;
  final double total;
  final String? clientId;
  final String? clientName;
  final String? clientAddress;
  final String? ruteroId;
  final String? paymentType;
  final String? salesManagerName;
  final String? notes;
  final DateTime cachedAt;
  const CachedDelivery({
    required this.id,
    required this.storeId,
    required this.orderId,
    required this.status,
    required this.itemsJson,
    required this.total,
    this.clientId,
    this.clientName,
    this.clientAddress,
    this.ruteroId,
    this.paymentType,
    this.salesManagerName,
    this.notes,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['order_id'] = Variable<String>(orderId);
    map['status'] = Variable<String>(status);
    map['items_json'] = Variable<String>(itemsJson);
    map['total'] = Variable<double>(total);
    if (!nullToAbsent || clientId != null) {
      map['client_id'] = Variable<String>(clientId);
    }
    if (!nullToAbsent || clientName != null) {
      map['client_name'] = Variable<String>(clientName);
    }
    if (!nullToAbsent || clientAddress != null) {
      map['client_address'] = Variable<String>(clientAddress);
    }
    if (!nullToAbsent || ruteroId != null) {
      map['rutero_id'] = Variable<String>(ruteroId);
    }
    if (!nullToAbsent || paymentType != null) {
      map['payment_type'] = Variable<String>(paymentType);
    }
    if (!nullToAbsent || salesManagerName != null) {
      map['sales_manager_name'] = Variable<String>(salesManagerName);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedDeliveriesCompanion toCompanion(bool nullToAbsent) {
    return CachedDeliveriesCompanion(
      id: Value(id),
      storeId: Value(storeId),
      orderId: Value(orderId),
      status: Value(status),
      itemsJson: Value(itemsJson),
      total: Value(total),
      clientId: clientId == null && nullToAbsent
          ? const Value.absent()
          : Value(clientId),
      clientName: clientName == null && nullToAbsent
          ? const Value.absent()
          : Value(clientName),
      clientAddress: clientAddress == null && nullToAbsent
          ? const Value.absent()
          : Value(clientAddress),
      ruteroId: ruteroId == null && nullToAbsent
          ? const Value.absent()
          : Value(ruteroId),
      paymentType: paymentType == null && nullToAbsent
          ? const Value.absent()
          : Value(paymentType),
      salesManagerName: salesManagerName == null && nullToAbsent
          ? const Value.absent()
          : Value(salesManagerName),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedDelivery.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedDelivery(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      orderId: serializer.fromJson<String>(json['orderId']),
      status: serializer.fromJson<String>(json['status']),
      itemsJson: serializer.fromJson<String>(json['itemsJson']),
      total: serializer.fromJson<double>(json['total']),
      clientId: serializer.fromJson<String?>(json['clientId']),
      clientName: serializer.fromJson<String?>(json['clientName']),
      clientAddress: serializer.fromJson<String?>(json['clientAddress']),
      ruteroId: serializer.fromJson<String?>(json['ruteroId']),
      paymentType: serializer.fromJson<String?>(json['paymentType']),
      salesManagerName: serializer.fromJson<String?>(json['salesManagerName']),
      notes: serializer.fromJson<String?>(json['notes']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'orderId': serializer.toJson<String>(orderId),
      'status': serializer.toJson<String>(status),
      'itemsJson': serializer.toJson<String>(itemsJson),
      'total': serializer.toJson<double>(total),
      'clientId': serializer.toJson<String?>(clientId),
      'clientName': serializer.toJson<String?>(clientName),
      'clientAddress': serializer.toJson<String?>(clientAddress),
      'ruteroId': serializer.toJson<String?>(ruteroId),
      'paymentType': serializer.toJson<String?>(paymentType),
      'salesManagerName': serializer.toJson<String?>(salesManagerName),
      'notes': serializer.toJson<String?>(notes),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedDelivery copyWith({
    String? id,
    String? storeId,
    String? orderId,
    String? status,
    String? itemsJson,
    double? total,
    Value<String?> clientId = const Value.absent(),
    Value<String?> clientName = const Value.absent(),
    Value<String?> clientAddress = const Value.absent(),
    Value<String?> ruteroId = const Value.absent(),
    Value<String?> paymentType = const Value.absent(),
    Value<String?> salesManagerName = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    DateTime? cachedAt,
  }) => CachedDelivery(
    id: id ?? this.id,
    storeId: storeId ?? this.storeId,
    orderId: orderId ?? this.orderId,
    status: status ?? this.status,
    itemsJson: itemsJson ?? this.itemsJson,
    total: total ?? this.total,
    clientId: clientId.present ? clientId.value : this.clientId,
    clientName: clientName.present ? clientName.value : this.clientName,
    clientAddress: clientAddress.present
        ? clientAddress.value
        : this.clientAddress,
    ruteroId: ruteroId.present ? ruteroId.value : this.ruteroId,
    paymentType: paymentType.present ? paymentType.value : this.paymentType,
    salesManagerName: salesManagerName.present
        ? salesManagerName.value
        : this.salesManagerName,
    notes: notes.present ? notes.value : this.notes,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  CachedDelivery copyWithCompanion(CachedDeliveriesCompanion data) {
    return CachedDelivery(
      id: data.id.present ? data.id.value : this.id,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      orderId: data.orderId.present ? data.orderId.value : this.orderId,
      status: data.status.present ? data.status.value : this.status,
      itemsJson: data.itemsJson.present ? data.itemsJson.value : this.itemsJson,
      total: data.total.present ? data.total.value : this.total,
      clientId: data.clientId.present ? data.clientId.value : this.clientId,
      clientName: data.clientName.present
          ? data.clientName.value
          : this.clientName,
      clientAddress: data.clientAddress.present
          ? data.clientAddress.value
          : this.clientAddress,
      ruteroId: data.ruteroId.present ? data.ruteroId.value : this.ruteroId,
      paymentType: data.paymentType.present
          ? data.paymentType.value
          : this.paymentType,
      salesManagerName: data.salesManagerName.present
          ? data.salesManagerName.value
          : this.salesManagerName,
      notes: data.notes.present ? data.notes.value : this.notes,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedDelivery(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('orderId: $orderId, ')
          ..write('status: $status, ')
          ..write('itemsJson: $itemsJson, ')
          ..write('total: $total, ')
          ..write('clientId: $clientId, ')
          ..write('clientName: $clientName, ')
          ..write('clientAddress: $clientAddress, ')
          ..write('ruteroId: $ruteroId, ')
          ..write('paymentType: $paymentType, ')
          ..write('salesManagerName: $salesManagerName, ')
          ..write('notes: $notes, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    storeId,
    orderId,
    status,
    itemsJson,
    total,
    clientId,
    clientName,
    clientAddress,
    ruteroId,
    paymentType,
    salesManagerName,
    notes,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedDelivery &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.orderId == this.orderId &&
          other.status == this.status &&
          other.itemsJson == this.itemsJson &&
          other.total == this.total &&
          other.clientId == this.clientId &&
          other.clientName == this.clientName &&
          other.clientAddress == this.clientAddress &&
          other.ruteroId == this.ruteroId &&
          other.paymentType == this.paymentType &&
          other.salesManagerName == this.salesManagerName &&
          other.notes == this.notes &&
          other.cachedAt == this.cachedAt);
}

class CachedDeliveriesCompanion extends UpdateCompanion<CachedDelivery> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> orderId;
  final Value<String> status;
  final Value<String> itemsJson;
  final Value<double> total;
  final Value<String?> clientId;
  final Value<String?> clientName;
  final Value<String?> clientAddress;
  final Value<String?> ruteroId;
  final Value<String?> paymentType;
  final Value<String?> salesManagerName;
  final Value<String?> notes;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedDeliveriesCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.orderId = const Value.absent(),
    this.status = const Value.absent(),
    this.itemsJson = const Value.absent(),
    this.total = const Value.absent(),
    this.clientId = const Value.absent(),
    this.clientName = const Value.absent(),
    this.clientAddress = const Value.absent(),
    this.ruteroId = const Value.absent(),
    this.paymentType = const Value.absent(),
    this.salesManagerName = const Value.absent(),
    this.notes = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedDeliveriesCompanion.insert({
    required String id,
    required String storeId,
    required String orderId,
    required String status,
    required String itemsJson,
    required double total,
    this.clientId = const Value.absent(),
    this.clientName = const Value.absent(),
    this.clientAddress = const Value.absent(),
    this.ruteroId = const Value.absent(),
    this.paymentType = const Value.absent(),
    this.salesManagerName = const Value.absent(),
    this.notes = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       storeId = Value(storeId),
       orderId = Value(orderId),
       status = Value(status),
       itemsJson = Value(itemsJson),
       total = Value(total),
       cachedAt = Value(cachedAt);
  static Insertable<CachedDelivery> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? orderId,
    Expression<String>? status,
    Expression<String>? itemsJson,
    Expression<double>? total,
    Expression<String>? clientId,
    Expression<String>? clientName,
    Expression<String>? clientAddress,
    Expression<String>? ruteroId,
    Expression<String>? paymentType,
    Expression<String>? salesManagerName,
    Expression<String>? notes,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (orderId != null) 'order_id': orderId,
      if (status != null) 'status': status,
      if (itemsJson != null) 'items_json': itemsJson,
      if (total != null) 'total': total,
      if (clientId != null) 'client_id': clientId,
      if (clientName != null) 'client_name': clientName,
      if (clientAddress != null) 'client_address': clientAddress,
      if (ruteroId != null) 'rutero_id': ruteroId,
      if (paymentType != null) 'payment_type': paymentType,
      if (salesManagerName != null) 'sales_manager_name': salesManagerName,
      if (notes != null) 'notes': notes,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedDeliveriesCompanion copyWith({
    Value<String>? id,
    Value<String>? storeId,
    Value<String>? orderId,
    Value<String>? status,
    Value<String>? itemsJson,
    Value<double>? total,
    Value<String?>? clientId,
    Value<String?>? clientName,
    Value<String?>? clientAddress,
    Value<String?>? ruteroId,
    Value<String?>? paymentType,
    Value<String?>? salesManagerName,
    Value<String?>? notes,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return CachedDeliveriesCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      orderId: orderId ?? this.orderId,
      status: status ?? this.status,
      itemsJson: itemsJson ?? this.itemsJson,
      total: total ?? this.total,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      clientAddress: clientAddress ?? this.clientAddress,
      ruteroId: ruteroId ?? this.ruteroId,
      paymentType: paymentType ?? this.paymentType,
      salesManagerName: salesManagerName ?? this.salesManagerName,
      notes: notes ?? this.notes,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (orderId.present) {
      map['order_id'] = Variable<String>(orderId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (itemsJson.present) {
      map['items_json'] = Variable<String>(itemsJson.value);
    }
    if (total.present) {
      map['total'] = Variable<double>(total.value);
    }
    if (clientId.present) {
      map['client_id'] = Variable<String>(clientId.value);
    }
    if (clientName.present) {
      map['client_name'] = Variable<String>(clientName.value);
    }
    if (clientAddress.present) {
      map['client_address'] = Variable<String>(clientAddress.value);
    }
    if (ruteroId.present) {
      map['rutero_id'] = Variable<String>(ruteroId.value);
    }
    if (paymentType.present) {
      map['payment_type'] = Variable<String>(paymentType.value);
    }
    if (salesManagerName.present) {
      map['sales_manager_name'] = Variable<String>(salesManagerName.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedDeliveriesCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('orderId: $orderId, ')
          ..write('status: $status, ')
          ..write('itemsJson: $itemsJson, ')
          ..write('total: $total, ')
          ..write('clientId: $clientId, ')
          ..write('clientName: $clientName, ')
          ..write('clientAddress: $clientAddress, ')
          ..write('ruteroId: $ruteroId, ')
          ..write('paymentType: $paymentType, ')
          ..write('salesManagerName: $salesManagerName, ')
          ..write('notes: $notes, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $RealtimeEventLogsTable extends RealtimeEventLogs
    with TableInfo<$RealtimeEventLogsTable, RealtimeEventLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $RealtimeEventLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _channelMeta = const VerificationMeta(
    'channel',
  );
  @override
  late final GeneratedColumn<String> channel = GeneratedColumn<String>(
    'channel',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _eventTypeMeta = const VerificationMeta(
    'eventType',
  );
  @override
  late final GeneratedColumn<String> eventType = GeneratedColumn<String>(
    'event_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadJsonMeta = const VerificationMeta(
    'payloadJson',
  );
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
    'payload_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _receivedAtMeta = const VerificationMeta(
    'receivedAt',
  );
  @override
  late final GeneratedColumn<DateTime> receivedAt = GeneratedColumn<DateTime>(
    'received_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    channel,
    eventType,
    payloadJson,
    storeId,
    receivedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'realtime_event_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<RealtimeEventLog> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('channel')) {
      context.handle(
        _channelMeta,
        channel.isAcceptableOrUnknown(data['channel']!, _channelMeta),
      );
    } else if (isInserting) {
      context.missing(_channelMeta);
    }
    if (data.containsKey('event_type')) {
      context.handle(
        _eventTypeMeta,
        eventType.isAcceptableOrUnknown(data['event_type']!, _eventTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_eventTypeMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
        _payloadJsonMeta,
        payloadJson.isAcceptableOrUnknown(
          data['payload_json']!,
          _payloadJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    }
    if (data.containsKey('received_at')) {
      context.handle(
        _receivedAtMeta,
        receivedAt.isAcceptableOrUnknown(data['received_at']!, _receivedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_receivedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  RealtimeEventLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return RealtimeEventLog(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      channel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}channel'],
      )!,
      eventType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_type'],
      )!,
      payloadJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload_json'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      ),
      receivedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}received_at'],
      )!,
    );
  }

  @override
  $RealtimeEventLogsTable createAlias(String alias) {
    return $RealtimeEventLogsTable(attachedDatabase, alias);
  }
}

class RealtimeEventLog extends DataClass
    implements Insertable<RealtimeEventLog> {
  final int id;
  final String channel;
  final String eventType;
  final String payloadJson;
  final String? storeId;
  final DateTime receivedAt;
  const RealtimeEventLog({
    required this.id,
    required this.channel,
    required this.eventType,
    required this.payloadJson,
    this.storeId,
    required this.receivedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['channel'] = Variable<String>(channel);
    map['event_type'] = Variable<String>(eventType);
    map['payload_json'] = Variable<String>(payloadJson);
    if (!nullToAbsent || storeId != null) {
      map['store_id'] = Variable<String>(storeId);
    }
    map['received_at'] = Variable<DateTime>(receivedAt);
    return map;
  }

  RealtimeEventLogsCompanion toCompanion(bool nullToAbsent) {
    return RealtimeEventLogsCompanion(
      id: Value(id),
      channel: Value(channel),
      eventType: Value(eventType),
      payloadJson: Value(payloadJson),
      storeId: storeId == null && nullToAbsent
          ? const Value.absent()
          : Value(storeId),
      receivedAt: Value(receivedAt),
    );
  }

  factory RealtimeEventLog.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return RealtimeEventLog(
      id: serializer.fromJson<int>(json['id']),
      channel: serializer.fromJson<String>(json['channel']),
      eventType: serializer.fromJson<String>(json['eventType']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      storeId: serializer.fromJson<String?>(json['storeId']),
      receivedAt: serializer.fromJson<DateTime>(json['receivedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'channel': serializer.toJson<String>(channel),
      'eventType': serializer.toJson<String>(eventType),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'storeId': serializer.toJson<String?>(storeId),
      'receivedAt': serializer.toJson<DateTime>(receivedAt),
    };
  }

  RealtimeEventLog copyWith({
    int? id,
    String? channel,
    String? eventType,
    String? payloadJson,
    Value<String?> storeId = const Value.absent(),
    DateTime? receivedAt,
  }) => RealtimeEventLog(
    id: id ?? this.id,
    channel: channel ?? this.channel,
    eventType: eventType ?? this.eventType,
    payloadJson: payloadJson ?? this.payloadJson,
    storeId: storeId.present ? storeId.value : this.storeId,
    receivedAt: receivedAt ?? this.receivedAt,
  );
  RealtimeEventLog copyWithCompanion(RealtimeEventLogsCompanion data) {
    return RealtimeEventLog(
      id: data.id.present ? data.id.value : this.id,
      channel: data.channel.present ? data.channel.value : this.channel,
      eventType: data.eventType.present ? data.eventType.value : this.eventType,
      payloadJson: data.payloadJson.present
          ? data.payloadJson.value
          : this.payloadJson,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      receivedAt: data.receivedAt.present
          ? data.receivedAt.value
          : this.receivedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('RealtimeEventLog(')
          ..write('id: $id, ')
          ..write('channel: $channel, ')
          ..write('eventType: $eventType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('storeId: $storeId, ')
          ..write('receivedAt: $receivedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, channel, eventType, payloadJson, storeId, receivedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is RealtimeEventLog &&
          other.id == this.id &&
          other.channel == this.channel &&
          other.eventType == this.eventType &&
          other.payloadJson == this.payloadJson &&
          other.storeId == this.storeId &&
          other.receivedAt == this.receivedAt);
}

class RealtimeEventLogsCompanion extends UpdateCompanion<RealtimeEventLog> {
  final Value<int> id;
  final Value<String> channel;
  final Value<String> eventType;
  final Value<String> payloadJson;
  final Value<String?> storeId;
  final Value<DateTime> receivedAt;
  const RealtimeEventLogsCompanion({
    this.id = const Value.absent(),
    this.channel = const Value.absent(),
    this.eventType = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.storeId = const Value.absent(),
    this.receivedAt = const Value.absent(),
  });
  RealtimeEventLogsCompanion.insert({
    this.id = const Value.absent(),
    required String channel,
    required String eventType,
    required String payloadJson,
    this.storeId = const Value.absent(),
    required DateTime receivedAt,
  }) : channel = Value(channel),
       eventType = Value(eventType),
       payloadJson = Value(payloadJson),
       receivedAt = Value(receivedAt);
  static Insertable<RealtimeEventLog> custom({
    Expression<int>? id,
    Expression<String>? channel,
    Expression<String>? eventType,
    Expression<String>? payloadJson,
    Expression<String>? storeId,
    Expression<DateTime>? receivedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (channel != null) 'channel': channel,
      if (eventType != null) 'event_type': eventType,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (storeId != null) 'store_id': storeId,
      if (receivedAt != null) 'received_at': receivedAt,
    });
  }

  RealtimeEventLogsCompanion copyWith({
    Value<int>? id,
    Value<String>? channel,
    Value<String>? eventType,
    Value<String>? payloadJson,
    Value<String?>? storeId,
    Value<DateTime>? receivedAt,
  }) {
    return RealtimeEventLogsCompanion(
      id: id ?? this.id,
      channel: channel ?? this.channel,
      eventType: eventType ?? this.eventType,
      payloadJson: payloadJson ?? this.payloadJson,
      storeId: storeId ?? this.storeId,
      receivedAt: receivedAt ?? this.receivedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (channel.present) {
      map['channel'] = Variable<String>(channel.value);
    }
    if (eventType.present) {
      map['event_type'] = Variable<String>(eventType.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (receivedAt.present) {
      map['received_at'] = Variable<DateTime>(receivedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('RealtimeEventLogsCompanion(')
          ..write('id: $id, ')
          ..write('channel: $channel, ')
          ..write('eventType: $eventType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('storeId: $storeId, ')
          ..write('receivedAt: $receivedAt')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueEntriesTable extends SyncQueueEntries
    with TableInfo<$SyncQueueEntriesTable, SyncQueueEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _methodMeta = const VerificationMeta('method');
  @override
  late final GeneratedColumn<String> method = GeneratedColumn<String>(
    'method',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _endpointMeta = const VerificationMeta(
    'endpoint',
  );
  @override
  late final GeneratedColumn<String> endpoint = GeneratedColumn<String>(
    'endpoint',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadJsonMeta = const VerificationMeta(
    'payloadJson',
  );
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
    'payload_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _storeIdMeta = const VerificationMeta(
    'storeId',
  );
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
    'store_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _operationTypeMeta = const VerificationMeta(
    'operationType',
  );
  @override
  late final GeneratedColumn<String> operationType = GeneratedColumn<String>(
    'operation_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _errorMessageMeta = const VerificationMeta(
    'errorMessage',
  );
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
    'error_message',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _attemptCountMeta = const VerificationMeta(
    'attemptCount',
  );
  @override
  late final GeneratedColumn<int> attemptCount = GeneratedColumn<int>(
    'attempt_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastAttemptAtMeta = const VerificationMeta(
    'lastAttemptAt',
  );
  @override
  late final GeneratedColumn<DateTime> lastAttemptAt =
      GeneratedColumn<DateTime>(
        'last_attempt_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    method,
    endpoint,
    payloadJson,
    status,
    storeId,
    operationType,
    errorMessage,
    attemptCount,
    createdAt,
    lastAttemptAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue_entries';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('method')) {
      context.handle(
        _methodMeta,
        method.isAcceptableOrUnknown(data['method']!, _methodMeta),
      );
    } else if (isInserting) {
      context.missing(_methodMeta);
    }
    if (data.containsKey('endpoint')) {
      context.handle(
        _endpointMeta,
        endpoint.isAcceptableOrUnknown(data['endpoint']!, _endpointMeta),
      );
    } else if (isInserting) {
      context.missing(_endpointMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
        _payloadJsonMeta,
        payloadJson.isAcceptableOrUnknown(
          data['payload_json']!,
          _payloadJsonMeta,
        ),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('store_id')) {
      context.handle(
        _storeIdMeta,
        storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta),
      );
    }
    if (data.containsKey('operation_type')) {
      context.handle(
        _operationTypeMeta,
        operationType.isAcceptableOrUnknown(
          data['operation_type']!,
          _operationTypeMeta,
        ),
      );
    }
    if (data.containsKey('error_message')) {
      context.handle(
        _errorMessageMeta,
        errorMessage.isAcceptableOrUnknown(
          data['error_message']!,
          _errorMessageMeta,
        ),
      );
    }
    if (data.containsKey('attempt_count')) {
      context.handle(
        _attemptCountMeta,
        attemptCount.isAcceptableOrUnknown(
          data['attempt_count']!,
          _attemptCountMeta,
        ),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('last_attempt_at')) {
      context.handle(
        _lastAttemptAtMeta,
        lastAttemptAt.isAcceptableOrUnknown(
          data['last_attempt_at']!,
          _lastAttemptAtMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueEntry(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      method: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}method'],
      )!,
      endpoint: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}endpoint'],
      )!,
      payloadJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload_json'],
      ),
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      storeId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}store_id'],
      ),
      operationType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}operation_type'],
      ),
      errorMessage: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}error_message'],
      ),
      attemptCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}attempt_count'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      lastAttemptAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_attempt_at'],
      ),
    );
  }

  @override
  $SyncQueueEntriesTable createAlias(String alias) {
    return $SyncQueueEntriesTable(attachedDatabase, alias);
  }
}

class SyncQueueEntry extends DataClass implements Insertable<SyncQueueEntry> {
  final int id;
  final String method;
  final String endpoint;
  final String? payloadJson;
  final String status;
  final String? storeId;
  final String? operationType;
  final String? errorMessage;
  final int attemptCount;
  final DateTime createdAt;
  final DateTime? lastAttemptAt;
  const SyncQueueEntry({
    required this.id,
    required this.method,
    required this.endpoint,
    this.payloadJson,
    required this.status,
    this.storeId,
    this.operationType,
    this.errorMessage,
    required this.attemptCount,
    required this.createdAt,
    this.lastAttemptAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['method'] = Variable<String>(method);
    map['endpoint'] = Variable<String>(endpoint);
    if (!nullToAbsent || payloadJson != null) {
      map['payload_json'] = Variable<String>(payloadJson);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || storeId != null) {
      map['store_id'] = Variable<String>(storeId);
    }
    if (!nullToAbsent || operationType != null) {
      map['operation_type'] = Variable<String>(operationType);
    }
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    map['attempt_count'] = Variable<int>(attemptCount);
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || lastAttemptAt != null) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt);
    }
    return map;
  }

  SyncQueueEntriesCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueEntriesCompanion(
      id: Value(id),
      method: Value(method),
      endpoint: Value(endpoint),
      payloadJson: payloadJson == null && nullToAbsent
          ? const Value.absent()
          : Value(payloadJson),
      status: Value(status),
      storeId: storeId == null && nullToAbsent
          ? const Value.absent()
          : Value(storeId),
      operationType: operationType == null && nullToAbsent
          ? const Value.absent()
          : Value(operationType),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
      attemptCount: Value(attemptCount),
      createdAt: Value(createdAt),
      lastAttemptAt: lastAttemptAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastAttemptAt),
    );
  }

  factory SyncQueueEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueEntry(
      id: serializer.fromJson<int>(json['id']),
      method: serializer.fromJson<String>(json['method']),
      endpoint: serializer.fromJson<String>(json['endpoint']),
      payloadJson: serializer.fromJson<String?>(json['payloadJson']),
      status: serializer.fromJson<String>(json['status']),
      storeId: serializer.fromJson<String?>(json['storeId']),
      operationType: serializer.fromJson<String?>(json['operationType']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
      attemptCount: serializer.fromJson<int>(json['attemptCount']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      lastAttemptAt: serializer.fromJson<DateTime?>(json['lastAttemptAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'method': serializer.toJson<String>(method),
      'endpoint': serializer.toJson<String>(endpoint),
      'payloadJson': serializer.toJson<String?>(payloadJson),
      'status': serializer.toJson<String>(status),
      'storeId': serializer.toJson<String?>(storeId),
      'operationType': serializer.toJson<String?>(operationType),
      'errorMessage': serializer.toJson<String?>(errorMessage),
      'attemptCount': serializer.toJson<int>(attemptCount),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'lastAttemptAt': serializer.toJson<DateTime?>(lastAttemptAt),
    };
  }

  SyncQueueEntry copyWith({
    int? id,
    String? method,
    String? endpoint,
    Value<String?> payloadJson = const Value.absent(),
    String? status,
    Value<String?> storeId = const Value.absent(),
    Value<String?> operationType = const Value.absent(),
    Value<String?> errorMessage = const Value.absent(),
    int? attemptCount,
    DateTime? createdAt,
    Value<DateTime?> lastAttemptAt = const Value.absent(),
  }) => SyncQueueEntry(
    id: id ?? this.id,
    method: method ?? this.method,
    endpoint: endpoint ?? this.endpoint,
    payloadJson: payloadJson.present ? payloadJson.value : this.payloadJson,
    status: status ?? this.status,
    storeId: storeId.present ? storeId.value : this.storeId,
    operationType: operationType.present
        ? operationType.value
        : this.operationType,
    errorMessage: errorMessage.present ? errorMessage.value : this.errorMessage,
    attemptCount: attemptCount ?? this.attemptCount,
    createdAt: createdAt ?? this.createdAt,
    lastAttemptAt: lastAttemptAt.present
        ? lastAttemptAt.value
        : this.lastAttemptAt,
  );
  SyncQueueEntry copyWithCompanion(SyncQueueEntriesCompanion data) {
    return SyncQueueEntry(
      id: data.id.present ? data.id.value : this.id,
      method: data.method.present ? data.method.value : this.method,
      endpoint: data.endpoint.present ? data.endpoint.value : this.endpoint,
      payloadJson: data.payloadJson.present
          ? data.payloadJson.value
          : this.payloadJson,
      status: data.status.present ? data.status.value : this.status,
      storeId: data.storeId.present ? data.storeId.value : this.storeId,
      operationType: data.operationType.present
          ? data.operationType.value
          : this.operationType,
      errorMessage: data.errorMessage.present
          ? data.errorMessage.value
          : this.errorMessage,
      attemptCount: data.attemptCount.present
          ? data.attemptCount.value
          : this.attemptCount,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      lastAttemptAt: data.lastAttemptAt.present
          ? data.lastAttemptAt.value
          : this.lastAttemptAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueEntry(')
          ..write('id: $id, ')
          ..write('method: $method, ')
          ..write('endpoint: $endpoint, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('status: $status, ')
          ..write('storeId: $storeId, ')
          ..write('operationType: $operationType, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastAttemptAt: $lastAttemptAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    method,
    endpoint,
    payloadJson,
    status,
    storeId,
    operationType,
    errorMessage,
    attemptCount,
    createdAt,
    lastAttemptAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueEntry &&
          other.id == this.id &&
          other.method == this.method &&
          other.endpoint == this.endpoint &&
          other.payloadJson == this.payloadJson &&
          other.status == this.status &&
          other.storeId == this.storeId &&
          other.operationType == this.operationType &&
          other.errorMessage == this.errorMessage &&
          other.attemptCount == this.attemptCount &&
          other.createdAt == this.createdAt &&
          other.lastAttemptAt == this.lastAttemptAt);
}

class SyncQueueEntriesCompanion extends UpdateCompanion<SyncQueueEntry> {
  final Value<int> id;
  final Value<String> method;
  final Value<String> endpoint;
  final Value<String?> payloadJson;
  final Value<String> status;
  final Value<String?> storeId;
  final Value<String?> operationType;
  final Value<String?> errorMessage;
  final Value<int> attemptCount;
  final Value<DateTime> createdAt;
  final Value<DateTime?> lastAttemptAt;
  const SyncQueueEntriesCompanion({
    this.id = const Value.absent(),
    this.method = const Value.absent(),
    this.endpoint = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.status = const Value.absent(),
    this.storeId = const Value.absent(),
    this.operationType = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.attemptCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.lastAttemptAt = const Value.absent(),
  });
  SyncQueueEntriesCompanion.insert({
    this.id = const Value.absent(),
    required String method,
    required String endpoint,
    this.payloadJson = const Value.absent(),
    this.status = const Value.absent(),
    this.storeId = const Value.absent(),
    this.operationType = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.attemptCount = const Value.absent(),
    required DateTime createdAt,
    this.lastAttemptAt = const Value.absent(),
  }) : method = Value(method),
       endpoint = Value(endpoint),
       createdAt = Value(createdAt);
  static Insertable<SyncQueueEntry> custom({
    Expression<int>? id,
    Expression<String>? method,
    Expression<String>? endpoint,
    Expression<String>? payloadJson,
    Expression<String>? status,
    Expression<String>? storeId,
    Expression<String>? operationType,
    Expression<String>? errorMessage,
    Expression<int>? attemptCount,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? lastAttemptAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (method != null) 'method': method,
      if (endpoint != null) 'endpoint': endpoint,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (status != null) 'status': status,
      if (storeId != null) 'store_id': storeId,
      if (operationType != null) 'operation_type': operationType,
      if (errorMessage != null) 'error_message': errorMessage,
      if (attemptCount != null) 'attempt_count': attemptCount,
      if (createdAt != null) 'created_at': createdAt,
      if (lastAttemptAt != null) 'last_attempt_at': lastAttemptAt,
    });
  }

  SyncQueueEntriesCompanion copyWith({
    Value<int>? id,
    Value<String>? method,
    Value<String>? endpoint,
    Value<String?>? payloadJson,
    Value<String>? status,
    Value<String?>? storeId,
    Value<String?>? operationType,
    Value<String?>? errorMessage,
    Value<int>? attemptCount,
    Value<DateTime>? createdAt,
    Value<DateTime?>? lastAttemptAt,
  }) {
    return SyncQueueEntriesCompanion(
      id: id ?? this.id,
      method: method ?? this.method,
      endpoint: endpoint ?? this.endpoint,
      payloadJson: payloadJson ?? this.payloadJson,
      status: status ?? this.status,
      storeId: storeId ?? this.storeId,
      operationType: operationType ?? this.operationType,
      errorMessage: errorMessage ?? this.errorMessage,
      attemptCount: attemptCount ?? this.attemptCount,
      createdAt: createdAt ?? this.createdAt,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (method.present) {
      map['method'] = Variable<String>(method.value);
    }
    if (endpoint.present) {
      map['endpoint'] = Variable<String>(endpoint.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (operationType.present) {
      map['operation_type'] = Variable<String>(operationType.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (attemptCount.present) {
      map['attempt_count'] = Variable<int>(attemptCount.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (lastAttemptAt.present) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueEntriesCompanion(')
          ..write('id: $id, ')
          ..write('method: $method, ')
          ..write('endpoint: $endpoint, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('status: $status, ')
          ..write('storeId: $storeId, ')
          ..write('operationType: $operationType, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('attemptCount: $attemptCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastAttemptAt: $lastAttemptAt')
          ..write(')'))
        .toString();
  }
}

class $VisitLogsTable extends VisitLogs
    with TableInfo<$VisitLogsTable, VisitLog> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VisitLogsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _clientIdMeta = const VerificationMeta(
    'clientId',
  );
  @override
  late final GeneratedColumn<String> clientId = GeneratedColumn<String>(
    'client_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _timestampMeta = const VerificationMeta(
    'timestamp',
  );
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
    'timestamp',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    clientId,
    status,
    notes,
    timestamp,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'visit_logs';
  @override
  VerificationContext validateIntegrity(
    Insertable<VisitLog> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('client_id')) {
      context.handle(
        _clientIdMeta,
        clientId.isAcceptableOrUnknown(data['client_id']!, _clientIdMeta),
      );
    } else if (isInserting) {
      context.missing(_clientIdMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('timestamp')) {
      context.handle(
        _timestampMeta,
        timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta),
      );
    } else if (isInserting) {
      context.missing(_timestampMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VisitLog map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VisitLog(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      clientId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}client_id'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      timestamp: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp'],
      )!,
    );
  }

  @override
  $VisitLogsTable createAlias(String alias) {
    return $VisitLogsTable(attachedDatabase, alias);
  }
}

class VisitLog extends DataClass implements Insertable<VisitLog> {
  final int id;
  final String clientId;
  final String status;
  final String? notes;
  final DateTime timestamp;
  const VisitLog({
    required this.id,
    required this.clientId,
    required this.status,
    this.notes,
    required this.timestamp,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['client_id'] = Variable<String>(clientId);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['timestamp'] = Variable<DateTime>(timestamp);
    return map;
  }

  VisitLogsCompanion toCompanion(bool nullToAbsent) {
    return VisitLogsCompanion(
      id: Value(id),
      clientId: Value(clientId),
      status: Value(status),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      timestamp: Value(timestamp),
    );
  }

  factory VisitLog.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VisitLog(
      id: serializer.fromJson<int>(json['id']),
      clientId: serializer.fromJson<String>(json['clientId']),
      status: serializer.fromJson<String>(json['status']),
      notes: serializer.fromJson<String?>(json['notes']),
      timestamp: serializer.fromJson<DateTime>(json['timestamp']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'clientId': serializer.toJson<String>(clientId),
      'status': serializer.toJson<String>(status),
      'notes': serializer.toJson<String?>(notes),
      'timestamp': serializer.toJson<DateTime>(timestamp),
    };
  }

  VisitLog copyWith({
    int? id,
    String? clientId,
    String? status,
    Value<String?> notes = const Value.absent(),
    DateTime? timestamp,
  }) => VisitLog(
    id: id ?? this.id,
    clientId: clientId ?? this.clientId,
    status: status ?? this.status,
    notes: notes.present ? notes.value : this.notes,
    timestamp: timestamp ?? this.timestamp,
  );
  VisitLog copyWithCompanion(VisitLogsCompanion data) {
    return VisitLog(
      id: data.id.present ? data.id.value : this.id,
      clientId: data.clientId.present ? data.clientId.value : this.clientId,
      status: data.status.present ? data.status.value : this.status,
      notes: data.notes.present ? data.notes.value : this.notes,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VisitLog(')
          ..write('id: $id, ')
          ..write('clientId: $clientId, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('timestamp: $timestamp')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, clientId, status, notes, timestamp);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VisitLog &&
          other.id == this.id &&
          other.clientId == this.clientId &&
          other.status == this.status &&
          other.notes == this.notes &&
          other.timestamp == this.timestamp);
}

class VisitLogsCompanion extends UpdateCompanion<VisitLog> {
  final Value<int> id;
  final Value<String> clientId;
  final Value<String> status;
  final Value<String?> notes;
  final Value<DateTime> timestamp;
  const VisitLogsCompanion({
    this.id = const Value.absent(),
    this.clientId = const Value.absent(),
    this.status = const Value.absent(),
    this.notes = const Value.absent(),
    this.timestamp = const Value.absent(),
  });
  VisitLogsCompanion.insert({
    this.id = const Value.absent(),
    required String clientId,
    required String status,
    this.notes = const Value.absent(),
    required DateTime timestamp,
  }) : clientId = Value(clientId),
       status = Value(status),
       timestamp = Value(timestamp);
  static Insertable<VisitLog> custom({
    Expression<int>? id,
    Expression<String>? clientId,
    Expression<String>? status,
    Expression<String>? notes,
    Expression<DateTime>? timestamp,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (clientId != null) 'client_id': clientId,
      if (status != null) 'status': status,
      if (notes != null) 'notes': notes,
      if (timestamp != null) 'timestamp': timestamp,
    });
  }

  VisitLogsCompanion copyWith({
    Value<int>? id,
    Value<String>? clientId,
    Value<String>? status,
    Value<String?>? notes,
    Value<DateTime>? timestamp,
  }) {
    return VisitLogsCompanion(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (clientId.present) {
      map['client_id'] = Variable<String>(clientId.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VisitLogsCompanion(')
          ..write('id: $id, ')
          ..write('clientId: $clientId, ')
          ..write('status: $status, ')
          ..write('notes: $notes, ')
          ..write('timestamp: $timestamp')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedStoresTable cachedStores = $CachedStoresTable(this);
  late final $CachedProductsTable cachedProducts = $CachedProductsTable(this);
  late final $CachedProductBarcodesTable cachedProductBarcodes =
      $CachedProductBarcodesTable(this);
  late final $CachedClientsTable cachedClients = $CachedClientsTable(this);
  late final $CachedReceivableAccountsTable cachedReceivableAccounts =
      $CachedReceivableAccountsTable(this);
  late final $CachedCollectionSummariesTable cachedCollectionSummaries =
      $CachedCollectionSummariesTable(this);
  late final $CachedRoutesTable cachedRoutes = $CachedRoutesTable(this);
  late final $CachedDeliveriesTable cachedDeliveries = $CachedDeliveriesTable(
    this,
  );
  late final $RealtimeEventLogsTable realtimeEventLogs =
      $RealtimeEventLogsTable(this);
  late final $SyncQueueEntriesTable syncQueueEntries = $SyncQueueEntriesTable(
    this,
  );
  late final $VisitLogsTable visitLogs = $VisitLogsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    cachedStores,
    cachedProducts,
    cachedProductBarcodes,
    cachedClients,
    cachedReceivableAccounts,
    cachedCollectionSummaries,
    cachedRoutes,
    cachedDeliveries,
    realtimeEventLogs,
    syncQueueEntries,
    visitLogs,
  ];
}

typedef $$CachedStoresTableCreateCompanionBuilder =
    CachedStoresCompanion Function({
      required String id,
      required String userId,
      required String name,
      Value<String?> address,
      Value<String?> phone,
      Value<String?> chainId,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedStoresTableUpdateCompanionBuilder =
    CachedStoresCompanion Function({
      Value<String> id,
      Value<String> userId,
      Value<String> name,
      Value<String?> address,
      Value<String?> phone,
      Value<String?> chainId,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedStoresTableFilterComposer
    extends Composer<_$AppDatabase, $CachedStoresTable> {
  $$CachedStoresTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get chainId => $composableBuilder(
    column: $table.chainId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedStoresTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedStoresTable> {
  $$CachedStoresTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get userId => $composableBuilder(
    column: $table.userId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get chainId => $composableBuilder(
    column: $table.chainId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedStoresTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedStoresTable> {
  $$CachedStoresTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get userId =>
      $composableBuilder(column: $table.userId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get address =>
      $composableBuilder(column: $table.address, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get chainId =>
      $composableBuilder(column: $table.chainId, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedStoresTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedStoresTable,
          CachedStore,
          $$CachedStoresTableFilterComposer,
          $$CachedStoresTableOrderingComposer,
          $$CachedStoresTableAnnotationComposer,
          $$CachedStoresTableCreateCompanionBuilder,
          $$CachedStoresTableUpdateCompanionBuilder,
          (
            CachedStore,
            BaseReferences<_$AppDatabase, $CachedStoresTable, CachedStore>,
          ),
          CachedStore,
          PrefetchHooks Function()
        > {
  $$CachedStoresTableTableManager(_$AppDatabase db, $CachedStoresTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedStoresTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedStoresTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedStoresTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> userId = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> address = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> chainId = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedStoresCompanion(
                id: id,
                userId: userId,
                name: name,
                address: address,
                phone: phone,
                chainId: chainId,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String userId,
                required String name,
                Value<String?> address = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> chainId = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedStoresCompanion.insert(
                id: id,
                userId: userId,
                name: name,
                address: address,
                phone: phone,
                chainId: chainId,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedStoresTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedStoresTable,
      CachedStore,
      $$CachedStoresTableFilterComposer,
      $$CachedStoresTableOrderingComposer,
      $$CachedStoresTableAnnotationComposer,
      $$CachedStoresTableCreateCompanionBuilder,
      $$CachedStoresTableUpdateCompanionBuilder,
      (
        CachedStore,
        BaseReferences<_$AppDatabase, $CachedStoresTable, CachedStore>,
      ),
      CachedStore,
      PrefetchHooks Function()
    >;
typedef $$CachedProductsTableCreateCompanionBuilder =
    CachedProductsCompanion Function({
      required String id,
      required String storeId,
      required String description,
      required double salePrice,
      required int currentStock,
      required int unitsPerBulk,
      required int stockBulks,
      required int stockUnits,
      Value<String?> barcode,
      Value<String?> brand,
      Value<String?> department,
      Value<String?> subDepartment,
      Value<int> minStock,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedProductsTableUpdateCompanionBuilder =
    CachedProductsCompanion Function({
      Value<String> id,
      Value<String> storeId,
      Value<String> description,
      Value<double> salePrice,
      Value<int> currentStock,
      Value<int> unitsPerBulk,
      Value<int> stockBulks,
      Value<int> stockUnits,
      Value<String?> barcode,
      Value<String?> brand,
      Value<String?> department,
      Value<String?> subDepartment,
      Value<int> minStock,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedProductsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedProductsTable> {
  $$CachedProductsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get salePrice => $composableBuilder(
    column: $table.salePrice,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get currentStock => $composableBuilder(
    column: $table.currentStock,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get unitsPerBulk => $composableBuilder(
    column: $table.unitsPerBulk,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get stockBulks => $composableBuilder(
    column: $table.stockBulks,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get stockUnits => $composableBuilder(
    column: $table.stockUnits,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get brand => $composableBuilder(
    column: $table.brand,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get department => $composableBuilder(
    column: $table.department,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get subDepartment => $composableBuilder(
    column: $table.subDepartment,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get minStock => $composableBuilder(
    column: $table.minStock,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedProductsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedProductsTable> {
  $$CachedProductsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get salePrice => $composableBuilder(
    column: $table.salePrice,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get currentStock => $composableBuilder(
    column: $table.currentStock,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get unitsPerBulk => $composableBuilder(
    column: $table.unitsPerBulk,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get stockBulks => $composableBuilder(
    column: $table.stockBulks,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get stockUnits => $composableBuilder(
    column: $table.stockUnits,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get brand => $composableBuilder(
    column: $table.brand,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get department => $composableBuilder(
    column: $table.department,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get subDepartment => $composableBuilder(
    column: $table.subDepartment,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get minStock => $composableBuilder(
    column: $table.minStock,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedProductsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedProductsTable> {
  $$CachedProductsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<double> get salePrice =>
      $composableBuilder(column: $table.salePrice, builder: (column) => column);

  GeneratedColumn<int> get currentStock => $composableBuilder(
    column: $table.currentStock,
    builder: (column) => column,
  );

  GeneratedColumn<int> get unitsPerBulk => $composableBuilder(
    column: $table.unitsPerBulk,
    builder: (column) => column,
  );

  GeneratedColumn<int> get stockBulks => $composableBuilder(
    column: $table.stockBulks,
    builder: (column) => column,
  );

  GeneratedColumn<int> get stockUnits => $composableBuilder(
    column: $table.stockUnits,
    builder: (column) => column,
  );

  GeneratedColumn<String> get barcode =>
      $composableBuilder(column: $table.barcode, builder: (column) => column);

  GeneratedColumn<String> get brand =>
      $composableBuilder(column: $table.brand, builder: (column) => column);

  GeneratedColumn<String> get department => $composableBuilder(
    column: $table.department,
    builder: (column) => column,
  );

  GeneratedColumn<String> get subDepartment => $composableBuilder(
    column: $table.subDepartment,
    builder: (column) => column,
  );

  GeneratedColumn<int> get minStock =>
      $composableBuilder(column: $table.minStock, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedProductsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedProductsTable,
          CachedProduct,
          $$CachedProductsTableFilterComposer,
          $$CachedProductsTableOrderingComposer,
          $$CachedProductsTableAnnotationComposer,
          $$CachedProductsTableCreateCompanionBuilder,
          $$CachedProductsTableUpdateCompanionBuilder,
          (
            CachedProduct,
            BaseReferences<_$AppDatabase, $CachedProductsTable, CachedProduct>,
          ),
          CachedProduct,
          PrefetchHooks Function()
        > {
  $$CachedProductsTableTableManager(
    _$AppDatabase db,
    $CachedProductsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedProductsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedProductsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedProductsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> description = const Value.absent(),
                Value<double> salePrice = const Value.absent(),
                Value<int> currentStock = const Value.absent(),
                Value<int> unitsPerBulk = const Value.absent(),
                Value<int> stockBulks = const Value.absent(),
                Value<int> stockUnits = const Value.absent(),
                Value<String?> barcode = const Value.absent(),
                Value<String?> brand = const Value.absent(),
                Value<String?> department = const Value.absent(),
                Value<String?> subDepartment = const Value.absent(),
                Value<int> minStock = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedProductsCompanion(
                id: id,
                storeId: storeId,
                description: description,
                salePrice: salePrice,
                currentStock: currentStock,
                unitsPerBulk: unitsPerBulk,
                stockBulks: stockBulks,
                stockUnits: stockUnits,
                barcode: barcode,
                brand: brand,
                department: department,
                subDepartment: subDepartment,
                minStock: minStock,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String storeId,
                required String description,
                required double salePrice,
                required int currentStock,
                required int unitsPerBulk,
                required int stockBulks,
                required int stockUnits,
                Value<String?> barcode = const Value.absent(),
                Value<String?> brand = const Value.absent(),
                Value<String?> department = const Value.absent(),
                Value<String?> subDepartment = const Value.absent(),
                Value<int> minStock = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedProductsCompanion.insert(
                id: id,
                storeId: storeId,
                description: description,
                salePrice: salePrice,
                currentStock: currentStock,
                unitsPerBulk: unitsPerBulk,
                stockBulks: stockBulks,
                stockUnits: stockUnits,
                barcode: barcode,
                brand: brand,
                department: department,
                subDepartment: subDepartment,
                minStock: minStock,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedProductsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedProductsTable,
      CachedProduct,
      $$CachedProductsTableFilterComposer,
      $$CachedProductsTableOrderingComposer,
      $$CachedProductsTableAnnotationComposer,
      $$CachedProductsTableCreateCompanionBuilder,
      $$CachedProductsTableUpdateCompanionBuilder,
      (
        CachedProduct,
        BaseReferences<_$AppDatabase, $CachedProductsTable, CachedProduct>,
      ),
      CachedProduct,
      PrefetchHooks Function()
    >;
typedef $$CachedProductBarcodesTableCreateCompanionBuilder =
    CachedProductBarcodesCompanion Function({
      required String id,
      required String productId,
      required String storeId,
      required String barcode,
      Value<String?> label,
      Value<bool> isPrimary,
      Value<int> rowid,
    });
typedef $$CachedProductBarcodesTableUpdateCompanionBuilder =
    CachedProductBarcodesCompanion Function({
      Value<String> id,
      Value<String> productId,
      Value<String> storeId,
      Value<String> barcode,
      Value<String?> label,
      Value<bool> isPrimary,
      Value<int> rowid,
    });

class $$CachedProductBarcodesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedProductBarcodesTable> {
  $$CachedProductBarcodesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get productId => $composableBuilder(
    column: $table.productId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get label => $composableBuilder(
    column: $table.label,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isPrimary => $composableBuilder(
    column: $table.isPrimary,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedProductBarcodesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedProductBarcodesTable> {
  $$CachedProductBarcodesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get productId => $composableBuilder(
    column: $table.productId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get barcode => $composableBuilder(
    column: $table.barcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get label => $composableBuilder(
    column: $table.label,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isPrimary => $composableBuilder(
    column: $table.isPrimary,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedProductBarcodesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedProductBarcodesTable> {
  $$CachedProductBarcodesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get productId =>
      $composableBuilder(column: $table.productId, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get barcode =>
      $composableBuilder(column: $table.barcode, builder: (column) => column);

  GeneratedColumn<String> get label =>
      $composableBuilder(column: $table.label, builder: (column) => column);

  GeneratedColumn<bool> get isPrimary =>
      $composableBuilder(column: $table.isPrimary, builder: (column) => column);
}

class $$CachedProductBarcodesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedProductBarcodesTable,
          CachedProductBarcode,
          $$CachedProductBarcodesTableFilterComposer,
          $$CachedProductBarcodesTableOrderingComposer,
          $$CachedProductBarcodesTableAnnotationComposer,
          $$CachedProductBarcodesTableCreateCompanionBuilder,
          $$CachedProductBarcodesTableUpdateCompanionBuilder,
          (
            CachedProductBarcode,
            BaseReferences<
              _$AppDatabase,
              $CachedProductBarcodesTable,
              CachedProductBarcode
            >,
          ),
          CachedProductBarcode,
          PrefetchHooks Function()
        > {
  $$CachedProductBarcodesTableTableManager(
    _$AppDatabase db,
    $CachedProductBarcodesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedProductBarcodesTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$CachedProductBarcodesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CachedProductBarcodesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> productId = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> barcode = const Value.absent(),
                Value<String?> label = const Value.absent(),
                Value<bool> isPrimary = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedProductBarcodesCompanion(
                id: id,
                productId: productId,
                storeId: storeId,
                barcode: barcode,
                label: label,
                isPrimary: isPrimary,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String productId,
                required String storeId,
                required String barcode,
                Value<String?> label = const Value.absent(),
                Value<bool> isPrimary = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedProductBarcodesCompanion.insert(
                id: id,
                productId: productId,
                storeId: storeId,
                barcode: barcode,
                label: label,
                isPrimary: isPrimary,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedProductBarcodesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedProductBarcodesTable,
      CachedProductBarcode,
      $$CachedProductBarcodesTableFilterComposer,
      $$CachedProductBarcodesTableOrderingComposer,
      $$CachedProductBarcodesTableAnnotationComposer,
      $$CachedProductBarcodesTableCreateCompanionBuilder,
      $$CachedProductBarcodesTableUpdateCompanionBuilder,
      (
        CachedProductBarcode,
        BaseReferences<
          _$AppDatabase,
          $CachedProductBarcodesTable,
          CachedProductBarcode
        >,
      ),
      CachedProductBarcode,
      PrefetchHooks Function()
    >;
typedef $$CachedClientsTableCreateCompanionBuilder =
    CachedClientsCompanion Function({
      required String id,
      required String storeId,
      required String name,
      Value<String?> email,
      Value<String?> phone,
      Value<String?> address,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedClientsTableUpdateCompanionBuilder =
    CachedClientsCompanion Function({
      Value<String> id,
      Value<String> storeId,
      Value<String> name,
      Value<String?> email,
      Value<String?> phone,
      Value<String?> address,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedClientsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedClientsTable> {
  $$CachedClientsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedClientsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedClientsTable> {
  $$CachedClientsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get email => $composableBuilder(
    column: $table.email,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get address => $composableBuilder(
    column: $table.address,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedClientsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedClientsTable> {
  $$CachedClientsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get email =>
      $composableBuilder(column: $table.email, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<String> get address =>
      $composableBuilder(column: $table.address, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedClientsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedClientsTable,
          CachedClient,
          $$CachedClientsTableFilterComposer,
          $$CachedClientsTableOrderingComposer,
          $$CachedClientsTableAnnotationComposer,
          $$CachedClientsTableCreateCompanionBuilder,
          $$CachedClientsTableUpdateCompanionBuilder,
          (
            CachedClient,
            BaseReferences<_$AppDatabase, $CachedClientsTable, CachedClient>,
          ),
          CachedClient,
          PrefetchHooks Function()
        > {
  $$CachedClientsTableTableManager(_$AppDatabase db, $CachedClientsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedClientsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedClientsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedClientsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String?> email = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> address = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedClientsCompanion(
                id: id,
                storeId: storeId,
                name: name,
                email: email,
                phone: phone,
                address: address,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String storeId,
                required String name,
                Value<String?> email = const Value.absent(),
                Value<String?> phone = const Value.absent(),
                Value<String?> address = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedClientsCompanion.insert(
                id: id,
                storeId: storeId,
                name: name,
                email: email,
                phone: phone,
                address: address,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedClientsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedClientsTable,
      CachedClient,
      $$CachedClientsTableFilterComposer,
      $$CachedClientsTableOrderingComposer,
      $$CachedClientsTableAnnotationComposer,
      $$CachedClientsTableCreateCompanionBuilder,
      $$CachedClientsTableUpdateCompanionBuilder,
      (
        CachedClient,
        BaseReferences<_$AppDatabase, $CachedClientsTable, CachedClient>,
      ),
      CachedClient,
      PrefetchHooks Function()
    >;
typedef $$CachedReceivableAccountsTableCreateCompanionBuilder =
    CachedReceivableAccountsCompanion Function({
      required String id,
      required String storeId,
      required String clientId,
      required String clientName,
      required double totalAmount,
      required double remainingAmount,
      required double pendingAmount,
      required String status,
      Value<String?> orderId,
      Value<String?> description,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedReceivableAccountsTableUpdateCompanionBuilder =
    CachedReceivableAccountsCompanion Function({
      Value<String> id,
      Value<String> storeId,
      Value<String> clientId,
      Value<String> clientName,
      Value<double> totalAmount,
      Value<double> remainingAmount,
      Value<double> pendingAmount,
      Value<String> status,
      Value<String?> orderId,
      Value<String?> description,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedReceivableAccountsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedReceivableAccountsTable> {
  $$CachedReceivableAccountsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get remainingAmount => $composableBuilder(
    column: $table.remainingAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pendingAmount => $composableBuilder(
    column: $table.pendingAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get orderId => $composableBuilder(
    column: $table.orderId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedReceivableAccountsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedReceivableAccountsTable> {
  $$CachedReceivableAccountsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get remainingAmount => $composableBuilder(
    column: $table.remainingAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pendingAmount => $composableBuilder(
    column: $table.pendingAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get orderId => $composableBuilder(
    column: $table.orderId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedReceivableAccountsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedReceivableAccountsTable> {
  $$CachedReceivableAccountsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get clientId =>
      $composableBuilder(column: $table.clientId, builder: (column) => column);

  GeneratedColumn<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => column,
  );

  GeneratedColumn<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => column,
  );

  GeneratedColumn<double> get remainingAmount => $composableBuilder(
    column: $table.remainingAmount,
    builder: (column) => column,
  );

  GeneratedColumn<double> get pendingAmount => $composableBuilder(
    column: $table.pendingAmount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get orderId =>
      $composableBuilder(column: $table.orderId, builder: (column) => column);

  GeneratedColumn<String> get description => $composableBuilder(
    column: $table.description,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedReceivableAccountsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedReceivableAccountsTable,
          CachedReceivableAccount,
          $$CachedReceivableAccountsTableFilterComposer,
          $$CachedReceivableAccountsTableOrderingComposer,
          $$CachedReceivableAccountsTableAnnotationComposer,
          $$CachedReceivableAccountsTableCreateCompanionBuilder,
          $$CachedReceivableAccountsTableUpdateCompanionBuilder,
          (
            CachedReceivableAccount,
            BaseReferences<
              _$AppDatabase,
              $CachedReceivableAccountsTable,
              CachedReceivableAccount
            >,
          ),
          CachedReceivableAccount,
          PrefetchHooks Function()
        > {
  $$CachedReceivableAccountsTableTableManager(
    _$AppDatabase db,
    $CachedReceivableAccountsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedReceivableAccountsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$CachedReceivableAccountsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CachedReceivableAccountsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> clientId = const Value.absent(),
                Value<String> clientName = const Value.absent(),
                Value<double> totalAmount = const Value.absent(),
                Value<double> remainingAmount = const Value.absent(),
                Value<double> pendingAmount = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> orderId = const Value.absent(),
                Value<String?> description = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedReceivableAccountsCompanion(
                id: id,
                storeId: storeId,
                clientId: clientId,
                clientName: clientName,
                totalAmount: totalAmount,
                remainingAmount: remainingAmount,
                pendingAmount: pendingAmount,
                status: status,
                orderId: orderId,
                description: description,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String storeId,
                required String clientId,
                required String clientName,
                required double totalAmount,
                required double remainingAmount,
                required double pendingAmount,
                required String status,
                Value<String?> orderId = const Value.absent(),
                Value<String?> description = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedReceivableAccountsCompanion.insert(
                id: id,
                storeId: storeId,
                clientId: clientId,
                clientName: clientName,
                totalAmount: totalAmount,
                remainingAmount: remainingAmount,
                pendingAmount: pendingAmount,
                status: status,
                orderId: orderId,
                description: description,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedReceivableAccountsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedReceivableAccountsTable,
      CachedReceivableAccount,
      $$CachedReceivableAccountsTableFilterComposer,
      $$CachedReceivableAccountsTableOrderingComposer,
      $$CachedReceivableAccountsTableAnnotationComposer,
      $$CachedReceivableAccountsTableCreateCompanionBuilder,
      $$CachedReceivableAccountsTableUpdateCompanionBuilder,
      (
        CachedReceivableAccount,
        BaseReferences<
          _$AppDatabase,
          $CachedReceivableAccountsTable,
          CachedReceivableAccount
        >,
      ),
      CachedReceivableAccount,
      PrefetchHooks Function()
    >;
typedef $$CachedCollectionSummariesTableCreateCompanionBuilder =
    CachedCollectionSummariesCompanion Function({
      required String storeId,
      required String scopeKey,
      required int totalCount,
      required double totalAmount,
      required double cashTotal,
      required double otherTotal,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedCollectionSummariesTableUpdateCompanionBuilder =
    CachedCollectionSummariesCompanion Function({
      Value<String> storeId,
      Value<String> scopeKey,
      Value<int> totalCount,
      Value<double> totalAmount,
      Value<double> cashTotal,
      Value<double> otherTotal,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedCollectionSummariesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedCollectionSummariesTable> {
  $$CachedCollectionSummariesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get scopeKey => $composableBuilder(
    column: $table.scopeKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get totalCount => $composableBuilder(
    column: $table.totalCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get cashTotal => $composableBuilder(
    column: $table.cashTotal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get otherTotal => $composableBuilder(
    column: $table.otherTotal,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedCollectionSummariesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedCollectionSummariesTable> {
  $$CachedCollectionSummariesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get scopeKey => $composableBuilder(
    column: $table.scopeKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get totalCount => $composableBuilder(
    column: $table.totalCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get cashTotal => $composableBuilder(
    column: $table.cashTotal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get otherTotal => $composableBuilder(
    column: $table.otherTotal,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedCollectionSummariesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedCollectionSummariesTable> {
  $$CachedCollectionSummariesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get scopeKey =>
      $composableBuilder(column: $table.scopeKey, builder: (column) => column);

  GeneratedColumn<int> get totalCount => $composableBuilder(
    column: $table.totalCount,
    builder: (column) => column,
  );

  GeneratedColumn<double> get totalAmount => $composableBuilder(
    column: $table.totalAmount,
    builder: (column) => column,
  );

  GeneratedColumn<double> get cashTotal =>
      $composableBuilder(column: $table.cashTotal, builder: (column) => column);

  GeneratedColumn<double> get otherTotal => $composableBuilder(
    column: $table.otherTotal,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedCollectionSummariesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedCollectionSummariesTable,
          CachedCollectionSummary,
          $$CachedCollectionSummariesTableFilterComposer,
          $$CachedCollectionSummariesTableOrderingComposer,
          $$CachedCollectionSummariesTableAnnotationComposer,
          $$CachedCollectionSummariesTableCreateCompanionBuilder,
          $$CachedCollectionSummariesTableUpdateCompanionBuilder,
          (
            CachedCollectionSummary,
            BaseReferences<
              _$AppDatabase,
              $CachedCollectionSummariesTable,
              CachedCollectionSummary
            >,
          ),
          CachedCollectionSummary,
          PrefetchHooks Function()
        > {
  $$CachedCollectionSummariesTableTableManager(
    _$AppDatabase db,
    $CachedCollectionSummariesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedCollectionSummariesTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$CachedCollectionSummariesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$CachedCollectionSummariesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> storeId = const Value.absent(),
                Value<String> scopeKey = const Value.absent(),
                Value<int> totalCount = const Value.absent(),
                Value<double> totalAmount = const Value.absent(),
                Value<double> cashTotal = const Value.absent(),
                Value<double> otherTotal = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedCollectionSummariesCompanion(
                storeId: storeId,
                scopeKey: scopeKey,
                totalCount: totalCount,
                totalAmount: totalAmount,
                cashTotal: cashTotal,
                otherTotal: otherTotal,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String storeId,
                required String scopeKey,
                required int totalCount,
                required double totalAmount,
                required double cashTotal,
                required double otherTotal,
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedCollectionSummariesCompanion.insert(
                storeId: storeId,
                scopeKey: scopeKey,
                totalCount: totalCount,
                totalAmount: totalAmount,
                cashTotal: cashTotal,
                otherTotal: otherTotal,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedCollectionSummariesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedCollectionSummariesTable,
      CachedCollectionSummary,
      $$CachedCollectionSummariesTableFilterComposer,
      $$CachedCollectionSummariesTableOrderingComposer,
      $$CachedCollectionSummariesTableAnnotationComposer,
      $$CachedCollectionSummariesTableCreateCompanionBuilder,
      $$CachedCollectionSummariesTableUpdateCompanionBuilder,
      (
        CachedCollectionSummary,
        BaseReferences<
          _$AppDatabase,
          $CachedCollectionSummariesTable,
          CachedCollectionSummary
        >,
      ),
      CachedCollectionSummary,
      PrefetchHooks Function()
    >;
typedef $$CachedRoutesTableCreateCompanionBuilder =
    CachedRoutesCompanion Function({
      required String id,
      required String storeId,
      required String vendorId,
      required String clientIdsJson,
      Value<DateTime?> routeDate,
      required String status,
      Value<String?> notes,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedRoutesTableUpdateCompanionBuilder =
    CachedRoutesCompanion Function({
      Value<String> id,
      Value<String> storeId,
      Value<String> vendorId,
      Value<String> clientIdsJson,
      Value<DateTime?> routeDate,
      Value<String> status,
      Value<String?> notes,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedRoutesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vendorId => $composableBuilder(
    column: $table.vendorId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientIdsJson => $composableBuilder(
    column: $table.clientIdsJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get routeDate => $composableBuilder(
    column: $table.routeDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedRoutesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vendorId => $composableBuilder(
    column: $table.vendorId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientIdsJson => $composableBuilder(
    column: $table.clientIdsJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get routeDate => $composableBuilder(
    column: $table.routeDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedRoutesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedRoutesTable> {
  $$CachedRoutesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get vendorId =>
      $composableBuilder(column: $table.vendorId, builder: (column) => column);

  GeneratedColumn<String> get clientIdsJson => $composableBuilder(
    column: $table.clientIdsJson,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get routeDate =>
      $composableBuilder(column: $table.routeDate, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedRoutesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedRoutesTable,
          CachedRoute,
          $$CachedRoutesTableFilterComposer,
          $$CachedRoutesTableOrderingComposer,
          $$CachedRoutesTableAnnotationComposer,
          $$CachedRoutesTableCreateCompanionBuilder,
          $$CachedRoutesTableUpdateCompanionBuilder,
          (
            CachedRoute,
            BaseReferences<_$AppDatabase, $CachedRoutesTable, CachedRoute>,
          ),
          CachedRoute,
          PrefetchHooks Function()
        > {
  $$CachedRoutesTableTableManager(_$AppDatabase db, $CachedRoutesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedRoutesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedRoutesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedRoutesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> vendorId = const Value.absent(),
                Value<String> clientIdsJson = const Value.absent(),
                Value<DateTime?> routeDate = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedRoutesCompanion(
                id: id,
                storeId: storeId,
                vendorId: vendorId,
                clientIdsJson: clientIdsJson,
                routeDate: routeDate,
                status: status,
                notes: notes,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String storeId,
                required String vendorId,
                required String clientIdsJson,
                Value<DateTime?> routeDate = const Value.absent(),
                required String status,
                Value<String?> notes = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedRoutesCompanion.insert(
                id: id,
                storeId: storeId,
                vendorId: vendorId,
                clientIdsJson: clientIdsJson,
                routeDate: routeDate,
                status: status,
                notes: notes,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedRoutesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedRoutesTable,
      CachedRoute,
      $$CachedRoutesTableFilterComposer,
      $$CachedRoutesTableOrderingComposer,
      $$CachedRoutesTableAnnotationComposer,
      $$CachedRoutesTableCreateCompanionBuilder,
      $$CachedRoutesTableUpdateCompanionBuilder,
      (
        CachedRoute,
        BaseReferences<_$AppDatabase, $CachedRoutesTable, CachedRoute>,
      ),
      CachedRoute,
      PrefetchHooks Function()
    >;
typedef $$CachedDeliveriesTableCreateCompanionBuilder =
    CachedDeliveriesCompanion Function({
      required String id,
      required String storeId,
      required String orderId,
      required String status,
      required String itemsJson,
      required double total,
      Value<String?> clientId,
      Value<String?> clientName,
      Value<String?> clientAddress,
      Value<String?> ruteroId,
      Value<String?> paymentType,
      Value<String?> salesManagerName,
      Value<String?> notes,
      required DateTime cachedAt,
      Value<int> rowid,
    });
typedef $$CachedDeliveriesTableUpdateCompanionBuilder =
    CachedDeliveriesCompanion Function({
      Value<String> id,
      Value<String> storeId,
      Value<String> orderId,
      Value<String> status,
      Value<String> itemsJson,
      Value<double> total,
      Value<String?> clientId,
      Value<String?> clientName,
      Value<String?> clientAddress,
      Value<String?> ruteroId,
      Value<String?> paymentType,
      Value<String?> salesManagerName,
      Value<String?> notes,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$CachedDeliveriesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get orderId => $composableBuilder(
    column: $table.orderId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get itemsJson => $composableBuilder(
    column: $table.itemsJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get total => $composableBuilder(
    column: $table.total,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientAddress => $composableBuilder(
    column: $table.clientAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ruteroId => $composableBuilder(
    column: $table.ruteroId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get paymentType => $composableBuilder(
    column: $table.paymentType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get salesManagerName => $composableBuilder(
    column: $table.salesManagerName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$CachedDeliveriesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get orderId => $composableBuilder(
    column: $table.orderId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get itemsJson => $composableBuilder(
    column: $table.itemsJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get total => $composableBuilder(
    column: $table.total,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientAddress => $composableBuilder(
    column: $table.clientAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ruteroId => $composableBuilder(
    column: $table.ruteroId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get paymentType => $composableBuilder(
    column: $table.paymentType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get salesManagerName => $composableBuilder(
    column: $table.salesManagerName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedDeliveriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedDeliveriesTable> {
  $$CachedDeliveriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get orderId =>
      $composableBuilder(column: $table.orderId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get itemsJson =>
      $composableBuilder(column: $table.itemsJson, builder: (column) => column);

  GeneratedColumn<double> get total =>
      $composableBuilder(column: $table.total, builder: (column) => column);

  GeneratedColumn<String> get clientId =>
      $composableBuilder(column: $table.clientId, builder: (column) => column);

  GeneratedColumn<String> get clientName => $composableBuilder(
    column: $table.clientName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get clientAddress => $composableBuilder(
    column: $table.clientAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get ruteroId =>
      $composableBuilder(column: $table.ruteroId, builder: (column) => column);

  GeneratedColumn<String> get paymentType => $composableBuilder(
    column: $table.paymentType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get salesManagerName => $composableBuilder(
    column: $table.salesManagerName,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedDeliveriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedDeliveriesTable,
          CachedDelivery,
          $$CachedDeliveriesTableFilterComposer,
          $$CachedDeliveriesTableOrderingComposer,
          $$CachedDeliveriesTableAnnotationComposer,
          $$CachedDeliveriesTableCreateCompanionBuilder,
          $$CachedDeliveriesTableUpdateCompanionBuilder,
          (
            CachedDelivery,
            BaseReferences<
              _$AppDatabase,
              $CachedDeliveriesTable,
              CachedDelivery
            >,
          ),
          CachedDelivery,
          PrefetchHooks Function()
        > {
  $$CachedDeliveriesTableTableManager(
    _$AppDatabase db,
    $CachedDeliveriesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedDeliveriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedDeliveriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedDeliveriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> storeId = const Value.absent(),
                Value<String> orderId = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> itemsJson = const Value.absent(),
                Value<double> total = const Value.absent(),
                Value<String?> clientId = const Value.absent(),
                Value<String?> clientName = const Value.absent(),
                Value<String?> clientAddress = const Value.absent(),
                Value<String?> ruteroId = const Value.absent(),
                Value<String?> paymentType = const Value.absent(),
                Value<String?> salesManagerName = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedDeliveriesCompanion(
                id: id,
                storeId: storeId,
                orderId: orderId,
                status: status,
                itemsJson: itemsJson,
                total: total,
                clientId: clientId,
                clientName: clientName,
                clientAddress: clientAddress,
                ruteroId: ruteroId,
                paymentType: paymentType,
                salesManagerName: salesManagerName,
                notes: notes,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String storeId,
                required String orderId,
                required String status,
                required String itemsJson,
                required double total,
                Value<String?> clientId = const Value.absent(),
                Value<String?> clientName = const Value.absent(),
                Value<String?> clientAddress = const Value.absent(),
                Value<String?> ruteroId = const Value.absent(),
                Value<String?> paymentType = const Value.absent(),
                Value<String?> salesManagerName = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                required DateTime cachedAt,
                Value<int> rowid = const Value.absent(),
              }) => CachedDeliveriesCompanion.insert(
                id: id,
                storeId: storeId,
                orderId: orderId,
                status: status,
                itemsJson: itemsJson,
                total: total,
                clientId: clientId,
                clientName: clientName,
                clientAddress: clientAddress,
                ruteroId: ruteroId,
                paymentType: paymentType,
                salesManagerName: salesManagerName,
                notes: notes,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$CachedDeliveriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedDeliveriesTable,
      CachedDelivery,
      $$CachedDeliveriesTableFilterComposer,
      $$CachedDeliveriesTableOrderingComposer,
      $$CachedDeliveriesTableAnnotationComposer,
      $$CachedDeliveriesTableCreateCompanionBuilder,
      $$CachedDeliveriesTableUpdateCompanionBuilder,
      (
        CachedDelivery,
        BaseReferences<_$AppDatabase, $CachedDeliveriesTable, CachedDelivery>,
      ),
      CachedDelivery,
      PrefetchHooks Function()
    >;
typedef $$RealtimeEventLogsTableCreateCompanionBuilder =
    RealtimeEventLogsCompanion Function({
      Value<int> id,
      required String channel,
      required String eventType,
      required String payloadJson,
      Value<String?> storeId,
      required DateTime receivedAt,
    });
typedef $$RealtimeEventLogsTableUpdateCompanionBuilder =
    RealtimeEventLogsCompanion Function({
      Value<int> id,
      Value<String> channel,
      Value<String> eventType,
      Value<String> payloadJson,
      Value<String?> storeId,
      Value<DateTime> receivedAt,
    });

class $$RealtimeEventLogsTableFilterComposer
    extends Composer<_$AppDatabase, $RealtimeEventLogsTable> {
  $$RealtimeEventLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get channel => $composableBuilder(
    column: $table.channel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventType => $composableBuilder(
    column: $table.eventType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get receivedAt => $composableBuilder(
    column: $table.receivedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$RealtimeEventLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $RealtimeEventLogsTable> {
  $$RealtimeEventLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get channel => $composableBuilder(
    column: $table.channel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventType => $composableBuilder(
    column: $table.eventType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get receivedAt => $composableBuilder(
    column: $table.receivedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$RealtimeEventLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $RealtimeEventLogsTable> {
  $$RealtimeEventLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get channel =>
      $composableBuilder(column: $table.channel, builder: (column) => column);

  GeneratedColumn<String> get eventType =>
      $composableBuilder(column: $table.eventType, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<DateTime> get receivedAt => $composableBuilder(
    column: $table.receivedAt,
    builder: (column) => column,
  );
}

class $$RealtimeEventLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $RealtimeEventLogsTable,
          RealtimeEventLog,
          $$RealtimeEventLogsTableFilterComposer,
          $$RealtimeEventLogsTableOrderingComposer,
          $$RealtimeEventLogsTableAnnotationComposer,
          $$RealtimeEventLogsTableCreateCompanionBuilder,
          $$RealtimeEventLogsTableUpdateCompanionBuilder,
          (
            RealtimeEventLog,
            BaseReferences<
              _$AppDatabase,
              $RealtimeEventLogsTable,
              RealtimeEventLog
            >,
          ),
          RealtimeEventLog,
          PrefetchHooks Function()
        > {
  $$RealtimeEventLogsTableTableManager(
    _$AppDatabase db,
    $RealtimeEventLogsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$RealtimeEventLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$RealtimeEventLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$RealtimeEventLogsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> channel = const Value.absent(),
                Value<String> eventType = const Value.absent(),
                Value<String> payloadJson = const Value.absent(),
                Value<String?> storeId = const Value.absent(),
                Value<DateTime> receivedAt = const Value.absent(),
              }) => RealtimeEventLogsCompanion(
                id: id,
                channel: channel,
                eventType: eventType,
                payloadJson: payloadJson,
                storeId: storeId,
                receivedAt: receivedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String channel,
                required String eventType,
                required String payloadJson,
                Value<String?> storeId = const Value.absent(),
                required DateTime receivedAt,
              }) => RealtimeEventLogsCompanion.insert(
                id: id,
                channel: channel,
                eventType: eventType,
                payloadJson: payloadJson,
                storeId: storeId,
                receivedAt: receivedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$RealtimeEventLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $RealtimeEventLogsTable,
      RealtimeEventLog,
      $$RealtimeEventLogsTableFilterComposer,
      $$RealtimeEventLogsTableOrderingComposer,
      $$RealtimeEventLogsTableAnnotationComposer,
      $$RealtimeEventLogsTableCreateCompanionBuilder,
      $$RealtimeEventLogsTableUpdateCompanionBuilder,
      (
        RealtimeEventLog,
        BaseReferences<
          _$AppDatabase,
          $RealtimeEventLogsTable,
          RealtimeEventLog
        >,
      ),
      RealtimeEventLog,
      PrefetchHooks Function()
    >;
typedef $$SyncQueueEntriesTableCreateCompanionBuilder =
    SyncQueueEntriesCompanion Function({
      Value<int> id,
      required String method,
      required String endpoint,
      Value<String?> payloadJson,
      Value<String> status,
      Value<String?> storeId,
      Value<String?> operationType,
      Value<String?> errorMessage,
      Value<int> attemptCount,
      required DateTime createdAt,
      Value<DateTime?> lastAttemptAt,
    });
typedef $$SyncQueueEntriesTableUpdateCompanionBuilder =
    SyncQueueEntriesCompanion Function({
      Value<int> id,
      Value<String> method,
      Value<String> endpoint,
      Value<String?> payloadJson,
      Value<String> status,
      Value<String?> storeId,
      Value<String?> operationType,
      Value<String?> errorMessage,
      Value<int> attemptCount,
      Value<DateTime> createdAt,
      Value<DateTime?> lastAttemptAt,
    });

class $$SyncQueueEntriesTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get method => $composableBuilder(
    column: $table.method,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get endpoint => $composableBuilder(
    column: $table.endpoint,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get operationType => $composableBuilder(
    column: $table.operationType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncQueueEntriesTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get method => $composableBuilder(
    column: $table.method,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get endpoint => $composableBuilder(
    column: $table.endpoint,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get storeId => $composableBuilder(
    column: $table.storeId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get operationType => $composableBuilder(
    column: $table.operationType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueEntriesTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueEntriesTable> {
  $$SyncQueueEntriesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get method =>
      $composableBuilder(column: $table.method, builder: (column) => column);

  GeneratedColumn<String> get endpoint =>
      $composableBuilder(column: $table.endpoint, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get storeId =>
      $composableBuilder(column: $table.storeId, builder: (column) => column);

  GeneratedColumn<String> get operationType => $composableBuilder(
    column: $table.operationType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get errorMessage => $composableBuilder(
    column: $table.errorMessage,
    builder: (column) => column,
  );

  GeneratedColumn<int> get attemptCount => $composableBuilder(
    column: $table.attemptCount,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get lastAttemptAt => $composableBuilder(
    column: $table.lastAttemptAt,
    builder: (column) => column,
  );
}

class $$SyncQueueEntriesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueEntriesTable,
          SyncQueueEntry,
          $$SyncQueueEntriesTableFilterComposer,
          $$SyncQueueEntriesTableOrderingComposer,
          $$SyncQueueEntriesTableAnnotationComposer,
          $$SyncQueueEntriesTableCreateCompanionBuilder,
          $$SyncQueueEntriesTableUpdateCompanionBuilder,
          (
            SyncQueueEntry,
            BaseReferences<
              _$AppDatabase,
              $SyncQueueEntriesTable,
              SyncQueueEntry
            >,
          ),
          SyncQueueEntry,
          PrefetchHooks Function()
        > {
  $$SyncQueueEntriesTableTableManager(
    _$AppDatabase db,
    $SyncQueueEntriesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueEntriesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueEntriesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueEntriesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> method = const Value.absent(),
                Value<String> endpoint = const Value.absent(),
                Value<String?> payloadJson = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> storeId = const Value.absent(),
                Value<String?> operationType = const Value.absent(),
                Value<String?> errorMessage = const Value.absent(),
                Value<int> attemptCount = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime?> lastAttemptAt = const Value.absent(),
              }) => SyncQueueEntriesCompanion(
                id: id,
                method: method,
                endpoint: endpoint,
                payloadJson: payloadJson,
                status: status,
                storeId: storeId,
                operationType: operationType,
                errorMessage: errorMessage,
                attemptCount: attemptCount,
                createdAt: createdAt,
                lastAttemptAt: lastAttemptAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String method,
                required String endpoint,
                Value<String?> payloadJson = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> storeId = const Value.absent(),
                Value<String?> operationType = const Value.absent(),
                Value<String?> errorMessage = const Value.absent(),
                Value<int> attemptCount = const Value.absent(),
                required DateTime createdAt,
                Value<DateTime?> lastAttemptAt = const Value.absent(),
              }) => SyncQueueEntriesCompanion.insert(
                id: id,
                method: method,
                endpoint: endpoint,
                payloadJson: payloadJson,
                status: status,
                storeId: storeId,
                operationType: operationType,
                errorMessage: errorMessage,
                attemptCount: attemptCount,
                createdAt: createdAt,
                lastAttemptAt: lastAttemptAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueEntriesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueEntriesTable,
      SyncQueueEntry,
      $$SyncQueueEntriesTableFilterComposer,
      $$SyncQueueEntriesTableOrderingComposer,
      $$SyncQueueEntriesTableAnnotationComposer,
      $$SyncQueueEntriesTableCreateCompanionBuilder,
      $$SyncQueueEntriesTableUpdateCompanionBuilder,
      (
        SyncQueueEntry,
        BaseReferences<_$AppDatabase, $SyncQueueEntriesTable, SyncQueueEntry>,
      ),
      SyncQueueEntry,
      PrefetchHooks Function()
    >;
typedef $$VisitLogsTableCreateCompanionBuilder =
    VisitLogsCompanion Function({
      Value<int> id,
      required String clientId,
      required String status,
      Value<String?> notes,
      required DateTime timestamp,
    });
typedef $$VisitLogsTableUpdateCompanionBuilder =
    VisitLogsCompanion Function({
      Value<int> id,
      Value<String> clientId,
      Value<String> status,
      Value<String?> notes,
      Value<DateTime> timestamp,
    });

class $$VisitLogsTableFilterComposer
    extends Composer<_$AppDatabase, $VisitLogsTable> {
  $$VisitLogsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VisitLogsTableOrderingComposer
    extends Composer<_$AppDatabase, $VisitLogsTable> {
  $$VisitLogsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get clientId => $composableBuilder(
    column: $table.clientId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VisitLogsTableAnnotationComposer
    extends Composer<_$AppDatabase, $VisitLogsTable> {
  $$VisitLogsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get clientId =>
      $composableBuilder(column: $table.clientId, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);
}

class $$VisitLogsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VisitLogsTable,
          VisitLog,
          $$VisitLogsTableFilterComposer,
          $$VisitLogsTableOrderingComposer,
          $$VisitLogsTableAnnotationComposer,
          $$VisitLogsTableCreateCompanionBuilder,
          $$VisitLogsTableUpdateCompanionBuilder,
          (VisitLog, BaseReferences<_$AppDatabase, $VisitLogsTable, VisitLog>),
          VisitLog,
          PrefetchHooks Function()
        > {
  $$VisitLogsTableTableManager(_$AppDatabase db, $VisitLogsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VisitLogsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VisitLogsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VisitLogsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> clientId = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<DateTime> timestamp = const Value.absent(),
              }) => VisitLogsCompanion(
                id: id,
                clientId: clientId,
                status: status,
                notes: notes,
                timestamp: timestamp,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String clientId,
                required String status,
                Value<String?> notes = const Value.absent(),
                required DateTime timestamp,
              }) => VisitLogsCompanion.insert(
                id: id,
                clientId: clientId,
                status: status,
                notes: notes,
                timestamp: timestamp,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VisitLogsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VisitLogsTable,
      VisitLog,
      $$VisitLogsTableFilterComposer,
      $$VisitLogsTableOrderingComposer,
      $$VisitLogsTableAnnotationComposer,
      $$VisitLogsTableCreateCompanionBuilder,
      $$VisitLogsTableUpdateCompanionBuilder,
      (VisitLog, BaseReferences<_$AppDatabase, $VisitLogsTable, VisitLog>),
      VisitLog,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedStoresTableTableManager get cachedStores =>
      $$CachedStoresTableTableManager(_db, _db.cachedStores);
  $$CachedProductsTableTableManager get cachedProducts =>
      $$CachedProductsTableTableManager(_db, _db.cachedProducts);
  $$CachedProductBarcodesTableTableManager get cachedProductBarcodes =>
      $$CachedProductBarcodesTableTableManager(_db, _db.cachedProductBarcodes);
  $$CachedClientsTableTableManager get cachedClients =>
      $$CachedClientsTableTableManager(_db, _db.cachedClients);
  $$CachedReceivableAccountsTableTableManager get cachedReceivableAccounts =>
      $$CachedReceivableAccountsTableTableManager(
        _db,
        _db.cachedReceivableAccounts,
      );
  $$CachedCollectionSummariesTableTableManager get cachedCollectionSummaries =>
      $$CachedCollectionSummariesTableTableManager(
        _db,
        _db.cachedCollectionSummaries,
      );
  $$CachedRoutesTableTableManager get cachedRoutes =>
      $$CachedRoutesTableTableManager(_db, _db.cachedRoutes);
  $$CachedDeliveriesTableTableManager get cachedDeliveries =>
      $$CachedDeliveriesTableTableManager(_db, _db.cachedDeliveries);
  $$RealtimeEventLogsTableTableManager get realtimeEventLogs =>
      $$RealtimeEventLogsTableTableManager(_db, _db.realtimeEventLogs);
  $$SyncQueueEntriesTableTableManager get syncQueueEntries =>
      $$SyncQueueEntriesTableTableManager(_db, _db.syncQueueEntries);
  $$VisitLogsTableTableManager get visitLogs =>
      $$VisitLogsTableTableManager(_db, _db.visitLogs);
}
