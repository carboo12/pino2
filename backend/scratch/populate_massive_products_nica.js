const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: "postgresql://alacaja:__DB_PASSWORD_PLACEHOLDER__@190.56.16.85:5432/multitienda_db",
});

const stores = [
  '9321856d-19ba-42b8-ba47-cf35c0d133dd', // Los Pinos - Central
  '4e2d3397-c839-493a-b908-88251ae05924'  // Los Pinos - Sur
];

const productsNica = [
  { barcode: '74120001', desc: 'Arroz Faisán Faisanito 1 Lb', cost: 18.00, sale: 22.00, brand: 'Faisán', upb: 25 },
  { barcode: '74120002', desc: 'Arroz Faisán 80/20 1 Lb', cost: 15.00, sale: 19.00, brand: 'Faisán', upb: 25 },
  { barcode: '74120003', desc: 'Frijol Rojo Seda Blandito 1 Lb', cost: 26.00, sale: 32.00, brand: 'Blandito', upb: 24 },
  { barcode: '74120004', desc: 'Frijol Negro Blandito 1 Lb', cost: 22.00, sale: 28.00, brand: 'Blandito', upb: 24 },
  { barcode: '74120005', desc: 'Azúcar Sulí Blanca 1 Kg', cost: 38.00, sale: 44.00, brand: 'Sulí', upb: 25 },
  { barcode: '74120006', desc: 'Aceite Ideal Botella 750ml', cost: 55.00, sale: 68.00, brand: 'Ideal', upb: 12 },
  { barcode: '74120007', desc: 'Aceite Clover Bolsa 500ml', cost: 35.00, sale: 42.00, brand: 'Clover', upb: 24 },
  { barcode: '74120008', desc: 'Café Presto Soluble 200g', cost: 140.00, sale: 165.00, brand: 'Presto', upb: 12 },
  { barcode: '74120009', desc: 'Café Toro Molido 400g', cost: 65.00, sale: 80.00, brand: 'Toro', upb: 24 },
  { barcode: '74120010', desc: 'Leche Parmalat Entera 1L', cost: 38.00, sale: 44.00, brand: 'Parmalat', upb: 12 },
  { barcode: '74120011', desc: 'Leche Dos Pinos Descremada 1L', cost: 42.00, sale: 50.00, brand: 'Dos Pinos', upb: 12 },
  { barcode: '74120012', desc: 'Avena Quaker En Hojuelas 400g', cost: 35.00, sale: 42.00, brand: 'Quaker', upb: 24 },
  { barcode: '74120013', desc: 'Cereal Froot Loops Kellogg’s 250g', cost: 85.00, sale: 105.00, brand: 'Kellogg’s', upb: 12 },
  { barcode: '74120014', desc: 'Coca-Cola Desechable 3 Litros', cost: 55.00, sale: 70.00, brand: 'Coca-Cola', upb: 6 },
  { barcode: '74120015', desc: 'Rojita (Fresa) Retornable 1 Litro', cost: 18.00, sale: 22.00, brand: 'Rojita', upb: 12 },
  { barcode: '74120016', desc: 'Gatorade Naranja 500ml', cost: 35.00, sale: 45.00, brand: 'Gatorade', upb: 12 },
  { barcode: '74120017', desc: 'Jugo del Valle Naranja 1L', cost: 38.00, sale: 48.00, brand: 'Del Valle', upb: 12 },
  { barcode: '74120018', desc: 'Agua Alpina 500ml', cost: 12.00, sale: 15.00, brand: 'Alpina', upb: 24 },
  { barcode: '74120019', desc: 'Toña Lata 355ml', cost: 42.00, sale: 55.00, brand: 'Toña', upb: 24 },
  { barcode: '74120020', desc: 'Victoria Clásica 12 Oz Retornable', cost: 38.00, sale: 45.00, brand: 'Victoria', upb: 24 },
  { barcode: '74120021', desc: 'Flor de Caña 7 Años Gran Reserva 750ml', cost: 480.00, sale: 590.00, brand: 'Flor de Caña', upb: 12 },
  { barcode: '74120022', desc: 'Ron Plata 1L', cost: 190.00, sale: 240.00, brand: 'Ron Plata', upb: 12 },
  { barcode: '74120023', desc: 'Galletas Chiky Chocolate 6 Und', cost: 15.00, sale: 20.00, brand: 'Chiky', upb: 24 },
  { barcode: '74120024', desc: 'Galletas Club Max 12 Und', cost: 25.00, sale: 32.00, brand: 'Club Max', upb: 24 },
  { barcode: '74120025', desc: 'Pinguino Marinela 2 Und', cost: 22.00, sale: 28.00, brand: 'Marinela', upb: 16 },
  { barcode: '74120026', desc: 'Tortrix Limón 25g', cost: 8.00, sale: 12.00, brand: 'Tortrix', upb: 40 },
  { barcode: '74120027', desc: 'Doritos Queso Atrevido 45g', cost: 22.00, sale: 28.00, brand: 'Frito Lay', upb: 36 },
  { barcode: '74120028', desc: 'Detergente Omo Extra Concentrado 1Kg', cost: 85.00, sale: 110.00, brand: 'Omo', upb: 12 },
  { barcode: '74120029', desc: 'Sabón Xtra Limón 400g', cost: 22.00, sale: 28.00, brand: 'Xtra', upb: 24 },
  { barcode: '74120030', desc: 'Cloro Magia Blanca 1 Litro', cost: 26.00, sale: 35.00, brand: 'Magia Blanca', upb: 15 },
  { barcode: '74120031', desc: 'Suavitel Aroma de Sol 850ml', cost: 75.00, sale: 95.00, brand: 'Suavitel', upb: 12 },
  { barcode: '74120032', desc: 'Jabón Protex Avena 3x110g', cost: 65.00, sale: 85.00, brand: 'Protex', upb: 12 },
  { barcode: '74120033', desc: 'Shampoo Head & Shoulders Clásico 400ml', cost: 180.00, sale: 230.00, brand: 'Head & Shoulders', upb: 12 },
  { barcode: '74120034', desc: 'Pasta Dental Colgate Triple Acción 75ml', cost: 45.00, sale: 60.00, brand: 'Colgate', upb: 24 },
  { barcode: '74120035', desc: 'Desodorante Rexona Clinical Men 48g', cost: 150.00, sale: 185.00, brand: 'Rexona', upb: 12 },
  { barcode: '74120036', desc: 'Papel Higiénico Scott Rinde Max 4 Rollos', cost: 85.00, sale: 115.00, brand: 'Scott', upb: 12 },
  { barcode: '74120037', desc: 'Toallas Sanitarias Saba Buenas Noches 8 Und', cost: 65.00, sale: 85.00, brand: 'Saba', upb: 24 },
  { barcode: '74120038', desc: 'Fósforos El Relámpago Pqt 10 cajas', cost: 20.00, sale: 26.00, brand: 'Relámpago', upb: 50 },
  { barcode: '74120039', desc: 'Bombillo LED Philips 9W', cost: 35.00, sale: 45.00, brand: 'Philips', upb: 12 },
  { barcode: '74120040', desc: 'Pilas Energizer AA 2 Und', cost: 55.00, sale: 70.00, brand: 'Energizer', upb: 24 },
  { barcode: '74120041', desc: 'Salsa de Tomate Natura’s 400g (Bolso)', cost: 32.00, sale: 42.00, brand: 'Natura’s', upb: 24 },
  { barcode: '74120042', desc: 'Mayonesa Lizano 200g (Bolso)', cost: 45.00, sale: 55.00, brand: 'Lizano', upb: 24 },
  { barcode: '74120043', desc: 'Salsa Lizano 280ml', cost: 65.00, sale: 82.00, brand: 'Lizano', upb: 12 },
  { barcode: '74120044', desc: 'Consomé Maggi Pollo 10 Cubitos', cost: 22.00, sale: 28.00, brand: 'Maggi', upb: 24 },
  { barcode: '74120045', desc: 'Sopa Laky Pollo Fideos 60g', cost: 10.00, sale: 15.00, brand: 'Laky', upb: 24 },
  { barcode: '74120046', desc: 'Fideos Laky Chow Mein 200g', cost: 18.00, sale: 25.00, brand: 'Laky', upb: 24 },
  { barcode: '74120047', desc: 'Manteca Clover Lb', cost: 25.00, sale: 32.00, brand: 'Clover', upb: 25 },
  { barcode: '74120048', desc: 'Aromatizante Glade Limón 400ml', cost: 95.00, sale: 120.00, brand: 'Glade', upb: 12 },
  { barcode: '74120049', desc: 'Raid Mata Mosquitos y Moscas 400ml', cost: 135.00, sale: 165.00, brand: 'Raid', upb: 12 },
  { barcode: '74120050', desc: 'Papel Toalla Nevax 2 Rollos', cost: 55.00, sale: 72.00, brand: 'Nevax', upb: 12 }
];

async function populateMassiveProducts() {
  try {
    await client.connect();

    // Re-use first department we can find, or create a generic one
    let depRes = await client.query('SELECT id FROM departments LIMIT 1');
    let defDeptId = depRes.rows.length > 0 ? depRes.rows[0].id : uuidv4();
    if (depRes.rows.length === 0) {
      await client.query('INSERT INTO departments (id, name, is_active) VALUES ($1, $2, true)', [defDeptId, 'Abarrotes']);
    }

    let inserted = 0;
    
    for (const storeId of stores) {
      console.log(`[Store: ${storeId}] Inyectando ${productsNica.length} productos...`);
      for (const p of productsNica) {
        const pId = uuidv4();
        // Generate random initial stock up to 500
        const randomStock = Math.floor(Math.random() * 401) + 100;
        
        await client.query(`
          INSERT INTO products (
            id, store_id, department_id, barcode, description, 
            cost_price, sale_price, price1, price2, price3, price4, price5,
            current_stock, min_stock, brand, uses_inventory, units_per_bulk, stock_bulks, stock_units, is_active
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, true, $16, $17, $18, true
          )
        `, [
          pId, storeId, defDeptId, p.barcode, p.desc, 
          p.cost, p.sale, 
          (p.sale * 0.95).toFixed(2), // price1 - slightly cheaper
          (p.sale * 0.92).toFixed(2), // price2
          (p.sale * 0.90).toFixed(2), // price3
          (p.sale * 0.88).toFixed(2), // price4
          (p.sale * 0.85).toFixed(2), // price5 - wholesale
          randomStock, 50, p.brand, p.upb, 
          Math.floor(randomStock / p.upb), randomStock % p.upb
        ]);
        inserted++;
      }
    }
    console.log(`==========================================`);
    console.log(`¡Éxito! Se insertaron ${inserted} productos masivos en total en 2 tiendas.`);
    
  } catch (err) {
    console.error('Error insertando productos:', err);
  } finally {
    await client.end();
  }
}

populateMassiveProducts();
