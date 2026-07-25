# Escenarios de Precios y Promociones — Pino2 Los Pinos Central

---

## PR-001: Cambio masivo de precios por inflación
**Rol:** Administrador / Dueño
**Duración:** 2 horas
**Descripción:** El proveedor de Aceite Patrona aumentó el precio de compra en 15%. Se debe actualizar el precio de venta de todos los productos de la marca Patrona en el sistema.
**Precondiciones:** Productos de marca Patrona con precios antiguos
**Pasos:**
1. Administrador recibe noticia del aumento del proveedor
2. Calcula nuevo precio de venta: costo anterior C$65 → C$74.75, margen 30% → precio C$97
3. Selecciona todos los productos de marca Patrona en el sistema
4. Aplica aumento de precio: +15% a price1
5. Sistema muestra impacto: 12 productos afectados
6. Confirma la actualización masiva
7. Imprime reporte de precios actualizados
**Resultado esperado:** 12 productos con precio actualizado, reporte generado
**Variante:** Solo algunos productos de la marca aumentan → actualización selectiva

---

## PR-002: Promoción por temporada (Back to School)
**Rol:** Administrador
**Duración:** 1 hora
**Descripción:** Se acerca el inicio de clases. Se crea una promoción de "Vuelta a Clases" con descuento del 10% en cuadernos, lápices y mochilas por 2 semanas.
**Precondiciones:** Productos escolares en catálogo
**Pasos:**
1. Administrador selecciona 25 productos escolares
2. Crea promoción: "Vuelta a Clases - 10% descuento"
3. Configura fechas: 15 enero al 31 enero
4. Sistema aplica descuento temporal a price2 (como precio promocional)
5. Publica promoción en el sistema
6. Vendedores pueden ver el precio promocional al tomar pedidos
7. Al finalizar la promoción, los precios vuelven a price1 automáticamente
**Resultado esperado:** Promoción activa por 2 semanas, precios vuelven automáticamente
**Variante:** Cliente compra durante promoción pero pide factura después → aplica precio de la fecha de compra

---

## PR-003: Precio especial por volumen (nivel 4)
**Rol:** Administrador / Vendedor
**Duración:** 10 minutos
**Descripción:** El cliente "Distribuidora El Colono" compra 100 bultos de Arroz Faisán. Solicita precio especial nivel 4 (price4) porque es compra al por mayor. Requiere autorización del administrador.
**Precondiciones:** Cliente con compras frecuentes, volumen > 50 bultos
**Pasos:**
1. Vendedor crea pedido con 100 bultos de Arroz Faisán
2. Sistema detecta que el vendedor usó priceLevel=4
3. Sistema muestra: "Requiere autorización de precio especial"
4. Vendedor envía solicitud de autorización
5. Administrador recibe notificación
6. Revisa: margen actual 22%, precio especial 4 tiene margen 15% (aún aceptable)
7. Aprueba la autorización
8. Pedido se procesa con price4
**Resultado esperado:** Pedido aprobado con precio especial, autorización registrada
**Variante:** Administrador rechaza porque margen es demasiado bajo → se negocia un precio intermedio

---

## PR-004: Promoción de temporada navideña
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** Se acerca Navidad. Se crea un paquete promocional: "Cena Navideña" que incluye arroz, aceite, mayonesa, pasas, etc., con descuento del 12%.
**Precondiciones:** Productos navideños en inventario
**Pasos:**
1. Administrador selecciona 8 productos para el paquete
2. Crea paquete "Cena Navideña" con precio combinado C$850 (vs C$967 regular)
3. Configura vigencia: 1 diciembre al 24 diciembre
4. Activa promoción en sistema
5. Vendedores ofrecen el paquete a clientes
6. Al 24 de diciembre, la promoción expira automáticamente
**Resultado esperado:** Paquete promocional activo en diciembre
**Variante:** Quedan paquetes sin vender después del 24 → se desarma y productos vuelven a precio individual

---

## PR-005: Descuento por pronto pago
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se crea una política de descuento del 3% para clientes que paguen dentro de los primeros 10 días. La política se aplica automáticamente.
**Precondiciones:** Configuración de términos de pago
**Pasos:**
1. Administrador configura política: "3% descuento si paga en ≤10 días"
2. Sistema asigna automáticamente a todos los clientes con crédito
3. Cuando un cliente paga dentro del plazo, el sistema calcula el descuento
4. Se genera nota de crédito automática por el descuento
5. El cobrador ve el monto con descuento al momento del cobro
**Resultado esperado:** Descuento aplicado automáticamente en cada pago anticipado
**Variante:** Cliente paga parcialmente dentro del plazo → descuento aplica solo a la parte pagada

---

## PR-006: Error de precio en el sistema (precio incorrecto)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se detectó que el precio del Café Presto 200g está en C$95 en el sistema, pero el precio real es C$110. Ya se vendieron 30 unidades al precio incorrecto. Se debe corregir y ajustar.
**Precondiciones:** Precio incorrecto detectado, ventas ya realizadas
**Pasos:**
1. Administrador detecta la discrepancia
2. Verifica: precio actual C$95, precio correcto C$110
3. Corrige el precio en el sistema
4. Revisa las 30 ventas afectadas (diferencia: C$15 x 30 = C$450)
5. Decide: si los clientes ya pagaron, la diferencia se asume como pérdida
6. Genera reporte de ajuste por error de precio
7. Registra la pérdida de C$450 como "Error de precio"
**Resultado esperado:** Precio corregido, pérdida documentada
**Variante:** Los clientes aceptan pagar la diferencia → se generan notas de cobro adicionales

---

## PR-007: Precio de lanzamiento de producto nuevo
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** Llega un nuevo producto: "Galletas Amor Polvorones 200g". Se debe configurar precio de lanzamiento con descuento del 20% durante el primer mes.
**Precondiciones:** Producto nuevo en catálogo
**Pasos:**
1. Administrador crea el producto en el sistema
2. Configura price1 (precio regular): C$45
3. Configura price2 (precio lanzamiento): C$36 (20% descuento)
4. Asigna fechas de vigencia: 1 mes
5. Agrega nota: "Precio de lanzamiento - primer mes"
6. Vendedores ofrecen el producto a precio promocional
7. Al cumplirse el mes, el sistema usa price1 automáticamente
**Resultado esperado:** Producto con precio promocional por 1 mes
**Variante:** El producto tiene alta demanda → se extiende la promoción una semana más

---

## PR-008: Redondeo de precios (IVA 15%)
**Rol:** Administrador / Sistema
**Duración:** 5 minutos
**Descripción:** Nicaragua tiene IVA del 15%. Algunos totales tienen centavos que deben redondearse. El sistema debe aplicar la regla de redondeo estándar.
**Precondiciones:** Venta con IVA incluido
**Pasos:**
1. Venta de productos por subtotal de C$183.47
2. IVA 15%: C$27.52
3. Total con IVA: C$211.00 (redondeado)
4. Sistema aplica redondeo: centavos 0-49 hacia abajo, 50-99 hacia arriba
5. Ticket muestra total redondeado
6. La diferencia de redondeo se registra como "Ajuste por redondeo"
**Resultado esperado:** Total redondeado correctamente, diferencia documentada
**Variante:** Cliente paga con tarjeta → el monto debe ser exacto, sin redondeo

---

## PR-009: Competencia bajó precios (guerra de precios)
**Rol:** Dueño / Administrador
**Duración:** 1 hora
**Descripción:** La competencia "Distribuidora El Proveedor" bajó el precio del Aceite Patrona 1L a C$78. Para no perder clientes, se debe igualar o ajustar el precio estratégicamente.
**Precondiciones:** Producto con precio actual C$85, competencia a C$78
**Pasos:**
1. Vendedor reporta que clientes están comprando en la competencia
2. Administrador verifica el precio de la competencia
3. Calcula: precio costo C$65, margen actual 23.5%, margen con C$78 sería 16.6%
4. Dueño decide igualar a C$78 temporalmente
5. Administrador ajusta price1 a C$78
6. Monitorea ventas del producto por 2 semanas
7. Evalúa si recuperar el precio original después
**Resultado esperado:** Precio igualado a la competencia, ventas recuperadas
**Variante:** El margen es insostenible → se ofrece un producto sustituto con mejor margen

---

## PR-010: Promoción de fidelidad (cliente frecuente)
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Cliente "Pulpería Los Amigos" compra más de C$50,000 mensuales. Se le otorga un descuento especial de fidelidad del 5% en todos los pedidos.
**Precondiciones:** Cliente con alto volumen de compra
**Pasos:**
1. Administrador identifica clientes con compras > C$50,000/mes
2. Selecciona al cliente y aplica "Descuento por fidelidad: 5%"
3. Sistema aplica 5% de descuento automático en cada pedido
4. El vendedor ve el descuento al tomar el pedido
5. Al final del mes, se genera reporte de descuentos otorgados
**Resultado esperado:** Descuento automático aplicado a cliente frecuente
**Variante:** Cliente baja su volumen de compra → el descuento se revierte automáticamente
