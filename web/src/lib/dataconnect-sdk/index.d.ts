import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateOrderData {
  order_insert: Order_Key;
}

export interface CreateOrderVariables {
  id: string;
  orderNumber: string;
  storeId: string;
  userId: string;
  clientId?: string | null;
  total: number;
  status: string;
  paymentMethod: string;
}

export interface CreateProductData {
  product_insert: Product_Key;
}

export interface CreateProductVariables {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  price: number;
  unitMeasure: string;
  category?: string | null;
}

export interface GetProductsData {
  products: ({
    id: string;
    code: string;
    barcode?: string | null;
    name: string;
    price: number;
    unitMeasure: string;
    category?: string | null;
    active: boolean;
  } & Product_Key)[];
}

export interface GetStoreInventoryData {
  inventories: ({
    storeId: string;
    productId: string;
    stock: number;
    minStock?: number | null;
    maxStock?: number | null;
  } & Inventory_Key)[];
}

export interface GetStoreInventoryVariables {
  storeId: string;
}

export interface Inventory_Key {
  storeId: string;
  productId: string;
  __typename?: 'Inventory_Key';
}

export interface ListOrdersByStoreData {
  orders: ({
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  } & Order_Key)[];
}

export interface ListOrdersByStoreVariables {
  storeId: string;
}

export interface ListStoresData {
  stores: ({
    id: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    active: boolean;
  } & Store_Key)[];
}

export interface OrderItem_Key {
  id: string;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: string;
  __typename?: 'Order_Key';
}

export interface Product_Key {
  id: string;
  __typename?: 'Product_Key';
}

export interface Route_Key {
  id: string;
  __typename?: 'Route_Key';
}

export interface Store_Key {
  id: string;
  __typename?: 'Store_Key';
}

export interface Supplier_Key {
  id: string;
  __typename?: 'Supplier_Key';
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface CreateProductRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
  operationName: string;
}
export const createProductRef: CreateProductRef;

export function createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;
export function createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateOrderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateOrderVariables): MutationRef<CreateOrderData, CreateOrderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateOrderVariables): MutationRef<CreateOrderData, CreateOrderVariables>;
  operationName: string;
}
export const createOrderRef: CreateOrderRef;

export function createOrder(vars: CreateOrderVariables): MutationPromise<CreateOrderData, CreateOrderVariables>;
export function createOrder(dc: DataConnect, vars: CreateOrderVariables): MutationPromise<CreateOrderData, CreateOrderVariables>;

interface ListStoresRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListStoresData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListStoresData, undefined>;
  operationName: string;
}
export const listStoresRef: ListStoresRef;

export function listStores(options?: ExecuteQueryOptions): QueryPromise<ListStoresData, undefined>;
export function listStores(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListStoresData, undefined>;

interface GetProductsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetProductsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetProductsData, undefined>;
  operationName: string;
}
export const getProductsRef: GetProductsRef;

export function getProducts(options?: ExecuteQueryOptions): QueryPromise<GetProductsData, undefined>;
export function getProducts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetProductsData, undefined>;

interface GetStoreInventoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStoreInventoryVariables): QueryRef<GetStoreInventoryData, GetStoreInventoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetStoreInventoryVariables): QueryRef<GetStoreInventoryData, GetStoreInventoryVariables>;
  operationName: string;
}
export const getStoreInventoryRef: GetStoreInventoryRef;

export function getStoreInventory(vars: GetStoreInventoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetStoreInventoryData, GetStoreInventoryVariables>;
export function getStoreInventory(dc: DataConnect, vars: GetStoreInventoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetStoreInventoryData, GetStoreInventoryVariables>;

interface ListOrdersByStoreRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListOrdersByStoreVariables): QueryRef<ListOrdersByStoreData, ListOrdersByStoreVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListOrdersByStoreVariables): QueryRef<ListOrdersByStoreData, ListOrdersByStoreVariables>;
  operationName: string;
}
export const listOrdersByStoreRef: ListOrdersByStoreRef;

export function listOrdersByStore(vars: ListOrdersByStoreVariables, options?: ExecuteQueryOptions): QueryPromise<ListOrdersByStoreData, ListOrdersByStoreVariables>;
export function listOrdersByStore(dc: DataConnect, vars: ListOrdersByStoreVariables, options?: ExecuteQueryOptions): QueryPromise<ListOrdersByStoreData, ListOrdersByStoreVariables>;

