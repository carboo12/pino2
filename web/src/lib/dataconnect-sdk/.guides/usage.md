# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createProduct, createOrder, listStores, getProducts, getStoreInventory, listOrdersByStore } from '@pino2/dataconnect';


// Operation CreateProduct:  For variables, look at type CreateProductVars in ../index.d.ts
const { data } = await CreateProduct(dataConnect, createProductVars);

// Operation CreateOrder:  For variables, look at type CreateOrderVars in ../index.d.ts
const { data } = await CreateOrder(dataConnect, createOrderVars);

// Operation ListStores: 
const { data } = await ListStores(dataConnect);

// Operation GetProducts: 
const { data } = await GetProducts(dataConnect);

// Operation GetStoreInventory:  For variables, look at type GetStoreInventoryVars in ../index.d.ts
const { data } = await GetStoreInventory(dataConnect, getStoreInventoryVars);

// Operation ListOrdersByStore:  For variables, look at type ListOrdersByStoreVars in ../index.d.ts
const { data } = await ListOrdersByStore(dataConnect, listOrdersByStoreVars);


```