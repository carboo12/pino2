# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `pino2-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListStores*](#liststores)
  - [*GetProducts*](#getproducts)
  - [*GetStoreInventory*](#getstoreinventory)
  - [*ListOrdersByStore*](#listordersbystore)
- [**Mutations**](#mutations)
  - [*CreateProduct*](#createproduct)
  - [*CreateOrder*](#createorder)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `pino2-connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@pino2/dataconnect` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@pino2/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@pino2/dataconnect';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `pino2-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListStores
You can execute the `ListStores` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listStores(options?: ExecuteQueryOptions): QueryPromise<ListStoresData, undefined>;

interface ListStoresRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListStoresData, undefined>;
}
export const listStoresRef: ListStoresRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listStores(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListStoresData, undefined>;

interface ListStoresRef {
  ...
  (dc: DataConnect): QueryRef<ListStoresData, undefined>;
}
export const listStoresRef: ListStoresRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listStoresRef:
```typescript
const name = listStoresRef.operationName;
console.log(name);
```

### Variables
The `ListStores` query has no variables.
### Return Type
Recall that executing the `ListStores` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListStoresData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListStores`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listStores } from '@pino2/dataconnect';


// Call the `listStores()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listStores();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listStores(dataConnect);

console.log(data.stores);

// Or, you can use the `Promise` API.
listStores().then((response) => {
  const data = response.data;
  console.log(data.stores);
});
```

### Using `ListStores`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listStoresRef } from '@pino2/dataconnect';


// Call the `listStoresRef()` function to get a reference to the query.
const ref = listStoresRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listStoresRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.stores);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.stores);
});
```

## GetProducts
You can execute the `GetProducts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
getProducts(options?: ExecuteQueryOptions): QueryPromise<GetProductsData, undefined>;

interface GetProductsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetProductsData, undefined>;
}
export const getProductsRef: GetProductsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getProducts(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetProductsData, undefined>;

interface GetProductsRef {
  ...
  (dc: DataConnect): QueryRef<GetProductsData, undefined>;
}
export const getProductsRef: GetProductsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getProductsRef:
```typescript
const name = getProductsRef.operationName;
console.log(name);
```

### Variables
The `GetProducts` query has no variables.
### Return Type
Recall that executing the `GetProducts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetProductsData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetProducts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getProducts } from '@pino2/dataconnect';


// Call the `getProducts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getProducts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getProducts(dataConnect);

console.log(data.products);

// Or, you can use the `Promise` API.
getProducts().then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

### Using `GetProducts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getProductsRef } from '@pino2/dataconnect';


// Call the `getProductsRef()` function to get a reference to the query.
const ref = getProductsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getProductsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.products);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.products);
});
```

## GetStoreInventory
You can execute the `GetStoreInventory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
getStoreInventory(vars: GetStoreInventoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetStoreInventoryData, GetStoreInventoryVariables>;

interface GetStoreInventoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetStoreInventoryVariables): QueryRef<GetStoreInventoryData, GetStoreInventoryVariables>;
}
export const getStoreInventoryRef: GetStoreInventoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getStoreInventory(dc: DataConnect, vars: GetStoreInventoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetStoreInventoryData, GetStoreInventoryVariables>;

interface GetStoreInventoryRef {
  ...
  (dc: DataConnect, vars: GetStoreInventoryVariables): QueryRef<GetStoreInventoryData, GetStoreInventoryVariables>;
}
export const getStoreInventoryRef: GetStoreInventoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getStoreInventoryRef:
```typescript
const name = getStoreInventoryRef.operationName;
console.log(name);
```

### Variables
The `GetStoreInventory` query requires an argument of type `GetStoreInventoryVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetStoreInventoryVariables {
  storeId: string;
}
```
### Return Type
Recall that executing the `GetStoreInventory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetStoreInventoryData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetStoreInventoryData {
  inventories: ({
    storeId: string;
    productId: string;
    stock: number;
    minStock?: number | null;
    maxStock?: number | null;
  } & Inventory_Key)[];
}
```
### Using `GetStoreInventory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getStoreInventory, GetStoreInventoryVariables } from '@pino2/dataconnect';

// The `GetStoreInventory` query requires an argument of type `GetStoreInventoryVariables`:
const getStoreInventoryVars: GetStoreInventoryVariables = {
  storeId: ..., 
};

// Call the `getStoreInventory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getStoreInventory(getStoreInventoryVars);
// Variables can be defined inline as well.
const { data } = await getStoreInventory({ storeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getStoreInventory(dataConnect, getStoreInventoryVars);

console.log(data.inventories);

// Or, you can use the `Promise` API.
getStoreInventory(getStoreInventoryVars).then((response) => {
  const data = response.data;
  console.log(data.inventories);
});
```

### Using `GetStoreInventory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getStoreInventoryRef, GetStoreInventoryVariables } from '@pino2/dataconnect';

// The `GetStoreInventory` query requires an argument of type `GetStoreInventoryVariables`:
const getStoreInventoryVars: GetStoreInventoryVariables = {
  storeId: ..., 
};

// Call the `getStoreInventoryRef()` function to get a reference to the query.
const ref = getStoreInventoryRef(getStoreInventoryVars);
// Variables can be defined inline as well.
const ref = getStoreInventoryRef({ storeId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getStoreInventoryRef(dataConnect, getStoreInventoryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.inventories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.inventories);
});
```

## ListOrdersByStore
You can execute the `ListOrdersByStore` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
listOrdersByStore(vars: ListOrdersByStoreVariables, options?: ExecuteQueryOptions): QueryPromise<ListOrdersByStoreData, ListOrdersByStoreVariables>;

interface ListOrdersByStoreRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListOrdersByStoreVariables): QueryRef<ListOrdersByStoreData, ListOrdersByStoreVariables>;
}
export const listOrdersByStoreRef: ListOrdersByStoreRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listOrdersByStore(dc: DataConnect, vars: ListOrdersByStoreVariables, options?: ExecuteQueryOptions): QueryPromise<ListOrdersByStoreData, ListOrdersByStoreVariables>;

interface ListOrdersByStoreRef {
  ...
  (dc: DataConnect, vars: ListOrdersByStoreVariables): QueryRef<ListOrdersByStoreData, ListOrdersByStoreVariables>;
}
export const listOrdersByStoreRef: ListOrdersByStoreRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listOrdersByStoreRef:
```typescript
const name = listOrdersByStoreRef.operationName;
console.log(name);
```

### Variables
The `ListOrdersByStore` query requires an argument of type `ListOrdersByStoreVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListOrdersByStoreVariables {
  storeId: string;
}
```
### Return Type
Recall that executing the `ListOrdersByStore` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListOrdersByStoreData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListOrdersByStore`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listOrdersByStore, ListOrdersByStoreVariables } from '@pino2/dataconnect';

// The `ListOrdersByStore` query requires an argument of type `ListOrdersByStoreVariables`:
const listOrdersByStoreVars: ListOrdersByStoreVariables = {
  storeId: ..., 
};

// Call the `listOrdersByStore()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listOrdersByStore(listOrdersByStoreVars);
// Variables can be defined inline as well.
const { data } = await listOrdersByStore({ storeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listOrdersByStore(dataConnect, listOrdersByStoreVars);

console.log(data.orders);

// Or, you can use the `Promise` API.
listOrdersByStore(listOrdersByStoreVars).then((response) => {
  const data = response.data;
  console.log(data.orders);
});
```

### Using `ListOrdersByStore`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listOrdersByStoreRef, ListOrdersByStoreVariables } from '@pino2/dataconnect';

// The `ListOrdersByStore` query requires an argument of type `ListOrdersByStoreVariables`:
const listOrdersByStoreVars: ListOrdersByStoreVariables = {
  storeId: ..., 
};

// Call the `listOrdersByStoreRef()` function to get a reference to the query.
const ref = listOrdersByStoreRef(listOrdersByStoreVars);
// Variables can be defined inline as well.
const ref = listOrdersByStoreRef({ storeId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listOrdersByStoreRef(dataConnect, listOrdersByStoreVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.orders);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.orders);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `pino2-connector` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateProduct
You can execute the `CreateProduct` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createProduct(vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateProductRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
}
export const createProductRef: CreateProductRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createProduct(dc: DataConnect, vars: CreateProductVariables): MutationPromise<CreateProductData, CreateProductVariables>;

interface CreateProductRef {
  ...
  (dc: DataConnect, vars: CreateProductVariables): MutationRef<CreateProductData, CreateProductVariables>;
}
export const createProductRef: CreateProductRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createProductRef:
```typescript
const name = createProductRef.operationName;
console.log(name);
```

### Variables
The `CreateProduct` mutation requires an argument of type `CreateProductVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateProductVariables {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  price: number;
  unitMeasure: string;
  category?: string | null;
}
```
### Return Type
Recall that executing the `CreateProduct` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateProductData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateProductData {
  product_insert: Product_Key;
}
```
### Using `CreateProduct`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createProduct, CreateProductVariables } from '@pino2/dataconnect';

// The `CreateProduct` mutation requires an argument of type `CreateProductVariables`:
const createProductVars: CreateProductVariables = {
  id: ..., 
  code: ..., 
  barcode: ..., // optional
  name: ..., 
  price: ..., 
  unitMeasure: ..., 
  category: ..., // optional
};

// Call the `createProduct()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createProduct(createProductVars);
// Variables can be defined inline as well.
const { data } = await createProduct({ id: ..., code: ..., barcode: ..., name: ..., price: ..., unitMeasure: ..., category: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createProduct(dataConnect, createProductVars);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
createProduct(createProductVars).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

### Using `CreateProduct`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createProductRef, CreateProductVariables } from '@pino2/dataconnect';

// The `CreateProduct` mutation requires an argument of type `CreateProductVariables`:
const createProductVars: CreateProductVariables = {
  id: ..., 
  code: ..., 
  barcode: ..., // optional
  name: ..., 
  price: ..., 
  unitMeasure: ..., 
  category: ..., // optional
};

// Call the `createProductRef()` function to get a reference to the mutation.
const ref = createProductRef(createProductVars);
// Variables can be defined inline as well.
const ref = createProductRef({ id: ..., code: ..., barcode: ..., name: ..., price: ..., unitMeasure: ..., category: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createProductRef(dataConnect, createProductVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.product_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.product_insert);
});
```

## CreateOrder
You can execute the `CreateOrder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-sdk/index.d.ts](./index.d.ts):
```typescript
createOrder(vars: CreateOrderVariables): MutationPromise<CreateOrderData, CreateOrderVariables>;

interface CreateOrderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateOrderVariables): MutationRef<CreateOrderData, CreateOrderVariables>;
}
export const createOrderRef: CreateOrderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createOrder(dc: DataConnect, vars: CreateOrderVariables): MutationPromise<CreateOrderData, CreateOrderVariables>;

interface CreateOrderRef {
  ...
  (dc: DataConnect, vars: CreateOrderVariables): MutationRef<CreateOrderData, CreateOrderVariables>;
}
export const createOrderRef: CreateOrderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createOrderRef:
```typescript
const name = createOrderRef.operationName;
console.log(name);
```

### Variables
The `CreateOrder` mutation requires an argument of type `CreateOrderVariables`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
```
### Return Type
Recall that executing the `CreateOrder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateOrderData`, which is defined in [dataconnect-sdk/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateOrderData {
  order_insert: Order_Key;
}
```
### Using `CreateOrder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createOrder, CreateOrderVariables } from '@pino2/dataconnect';

// The `CreateOrder` mutation requires an argument of type `CreateOrderVariables`:
const createOrderVars: CreateOrderVariables = {
  id: ..., 
  orderNumber: ..., 
  storeId: ..., 
  userId: ..., 
  clientId: ..., // optional
  total: ..., 
  status: ..., 
  paymentMethod: ..., 
};

// Call the `createOrder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createOrder(createOrderVars);
// Variables can be defined inline as well.
const { data } = await createOrder({ id: ..., orderNumber: ..., storeId: ..., userId: ..., clientId: ..., total: ..., status: ..., paymentMethod: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createOrder(dataConnect, createOrderVars);

console.log(data.order_insert);

// Or, you can use the `Promise` API.
createOrder(createOrderVars).then((response) => {
  const data = response.data;
  console.log(data.order_insert);
});
```

### Using `CreateOrder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createOrderRef, CreateOrderVariables } from '@pino2/dataconnect';

// The `CreateOrder` mutation requires an argument of type `CreateOrderVariables`:
const createOrderVars: CreateOrderVariables = {
  id: ..., 
  orderNumber: ..., 
  storeId: ..., 
  userId: ..., 
  clientId: ..., // optional
  total: ..., 
  status: ..., 
  paymentMethod: ..., 
};

// Call the `createOrderRef()` function to get a reference to the mutation.
const ref = createOrderRef(createOrderVars);
// Variables can be defined inline as well.
const ref = createOrderRef({ id: ..., orderNumber: ..., storeId: ..., userId: ..., clientId: ..., total: ..., status: ..., paymentMethod: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createOrderRef(dataConnect, createOrderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.order_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.order_insert);
});
```

