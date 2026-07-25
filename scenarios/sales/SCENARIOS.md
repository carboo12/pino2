# Escenarios de Ventas — Pino2 Los Pinos Central

---

## V-001: Venta normal al contado
**Rol:** Cajero
**Duración:** 2-3 minutos
**Descripción:** Doña María entra a la tienda a comprar su despensa semanal. Paga en efectivo con Córdobas. Es la transacción más común del día.
**Precondiciones:** Productos con stock suficiente, caja aperturada con fondo inicial de C$5,000
**Pasos:**
1. Cajero inicia sesión en Pino2 POS
2. Escanea códigos de barras: Argo Faisán 1lb (C$32), Aceite Patrona 1L (C$85), Frijoles Rojos Seda 1lb (C$28), Azúcar Sulí 1kg (C$38)
3. Sistema muestra subtotal de C$183
4. Cajero indica "Efectivo", ingresa monto recibido C$500
5. Sistema calcula vuelto: C$317
6. Se imprime ticket térmico
7. Se entrega producto y vuelto al cliente
**Resultado esperado:** Transacción completada, stock descuenta 1 de cada producto, caja registra ingreso de C$183
**Variante:** Cajero ingresa C$400 en vez de C$500, el vuelto calculado sería incorrecto si el cliente realmente pagó con billete de C$500

---

## V-002: Venta con mezcla de bultos y unidades
**Rol:** Cajero
**Duración:** 4 minutos
**Descripción:** Don Carlos, dueño de una pulpería en el Mercado Oriental, compra 5 bultos de Aceite Patrona 1L (6 unidades por bulto) más 3 unidades sueltas.
**Precondiciones:** Existen al menos 5 bultos y 3 unidades en inventario, precio de bulto C$480, precio unitario C$85
**Pasos:**
1. Cajero busca producto "Aceite Patrona 1L" en el catálogo
2. Selecciona modo "Venta por bulto" y cantidad 5
3. Sistema agrega 5 bultos = 30 unidades, subtotal C$2,400
4. Cajero cambia a modo "Unidad suelta" y agrega 3 unidades
5. Total: C$2,400 + C$255 = C$2,655
6. Cajero procesa pago en efectivo
**Resultado esperado:** Sistema descuenta 33 unidades (5 bultos = 30 + 3) del inventario, ticket refleja mezcla de presentaciones
**Variante:** Cajero equivoca el multiplicador y registra 5 bultos como 5 unidades, causando descuadre de inventario

---

## V-003: Venta a crédito a cliente conocido
**Rol:** Cajero / Administrador
**Duración:** 5 minutos
**Descripción:** Don Miguel, dueño del Comedor Santa Ana en Managua, compra mercadería a crédito como todas las semanas. Tiene un límite de C$50,000 y un saldo actual de C$12,000.
**Precondiciones:** Cliente registrado con crédito aprobado, saldo disponible C$38,000, plazo 30 días
**Pasos:**
1. Cajero inicia venta, selecciona tipo "Crédito"
2. Busca al cliente por cédula: "001-010590-1234X"
3. Sistema muestra datos: nombre, límite, saldo actual, días de mora (0)
4. Cajero agrega productos comprados: 10 bultos de Arroz Faisán 1lb, 5 cajas de Aceite Patrona 1L, 3 bultos de Azúcar Sulí
5. Total: C$14,350
6. Sistema verifica que C$12,000 + C$14,350 = C$26,350 no excede límite de C$50,000
7. Se genera factura a crédito con fecha de vencimiento en 30 días
8. Cliente firma factura digitalmente en pantalla
**Resultado esperado:** Venta registrada en cuentas por cobrar, saldo actualizado a C$26,350, fecha de corte en 30 días
**Variante:** Si el saldo actual + nueva venta excede el límite, el sistema debe rechazar y solicitar autorización del administrador

---

## V-004: Venta con precio especial nivel 4 (requiere autorización)
**Rol:** Cajero + Administrador
**Duración:** 6 minutos
**Descripción:** La Cooperativa San Miguel solicita 50 bultos de Arroz Faisán a un precio especial de C$420 por bulto (precio normal C$480). Esto requiere autorización de nivel 4 (solo dueño o administrador general).
**Precondiciones:** Precio especial configurado para el cliente, producto tiene precio lista de C$480
**Pasos:**
1. Cajero inicia venta, selecciona cliente Cooperativa San Miguel
2. Agrega 50 bultos de Arroz Faisán
3. Sistema aplica precio automático de lista: 50 x C$480 = C$24,000
4. Cajero intenta modificar precio a C$420 por bulto
5. Sistema muestra alerta: "Este cambio requiere autorización nivel 4"
6. Cajero llama al administrador
7. Administrador ingresa su PIN de autorización: ****
8. Sistema registra: precio modificado, autorizado por [admin], motivo registrado en auditoría
9. Total ajustado: 50 x C$420 = C$21,000
**Resultado esperado:** Precio modificado con autorización, transacción auditada con usuario y motivo
**Variante:** Administrador ingresa PIN incorrecto 3 veces, sistema bloquea cambio y registra intento no autorizado

---

## V-005: Devolución parcial de productos dañados
**Rol:** Cajero
**Duración:** 7 minutos
**Descripción:** Doña Rosa compró 3 bolsas de Arroz Faisán y al llegar a su casa en el Barrio San Judas descubre que una bolsa está rota y derramando arroz.
**Precondiciones:** Venta original existe en el historial (menos de 7 días), producto no es perecedero dañado
**Pasos:**
1. Cliente regresa con el producto dañado y el ticket original
2. Cajero busca venta por número de ticket o cédula
3. Sistema muestra detalle de la transacción
4. Cajero selecciona la línea del producto a devolver
5. Selecciona motivo: "Producto dañado - empaque roto"
6. Sistema calcula monto a reembolsar: C$32 (precio de 1 unidad)
7. Cajero procesa devolución: efectivo C$32
8. Se imprime nota de crédito / ticket de devolución
9. Producto dañado se marca como "Merma - dañado" en inventario
**Resultado esperado:** Inventario aumenta 1 unidad de Arroz Faisán (como dañado/merma), caja registra -C$32, cliente recibe su dinero
**Variante:** Cliente perdió el ticket, cajero debe verificar con cédula o número de factura electrónica

---

## V-006: Devolución total por cliente insatisfecho
**Rol:** Cajero + Administrador
**Duración:** 8 minutos
**Descripción:** Doña Esperanza compró una caja de Detergente Ariel 500g pero dice que "no limpia bien" y quiere devolver toda la caja completa (24 unidades), de las cuales ya usó 2.
**Precondiciones:** Venta original existe, producto se puede devolver (política de devolución de la tienda)
**Pasos:**
1. Cajero busca venta original (2 días antes)
2. Sistema muestra: 24 Detergente Ariel 500g x C$40 = C$960
3. Cajero reporta que el cliente usó 2 unidades
4. Administrador es llamado para autorizar devolución parcial
5. Se devuelven 22 unidades sin abrir, las 2 usadas no son reembolsables
6. Reembolso: 22 x C$40 = C$880
7. Productos devueltos pasan a inventario como "revisar calidad"
8. Se genera nota de crédito
**Resultado esperado:** Cliente recibe C$880 o nota de crédito, inventario aumenta 22 unidades como "cuarentena"
**Variante:** Cliente no trajo producto, solo el ticket; no se puede procesar devolución sin el producto físico

---

## V-007: Cliente que paga con dólares
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Don Francisco paga su compra de C$1,200 con un billete de USD $20. El tipo de cambio del día es C$36.50 por USD.
**Precondiciones:** Tipo de cambio configurado en el sistema (C$36.50), billete USD $20 auténtico
**Pasos:**
1. Cajero totaliza compra: C$1,200
2. Cliente entrega USD $20
3. Cajero selecciona método "Dólares" en POS
4. Sistema muestra tipo de cambio vigente: C$36.50/USD
5. Sistema calcula: USD $20 x C$36.50 = C$730
6. Sistema indica que faltan C$470
7. Cliente paga los C$470 restantes en efectivo
8. Cajero recibe USD $20 + C$470
9. Sistema calcula vuelto: C$0
**Resultado esperado:** Transacción completa, caja registra C$1,200 con split de pago USD y Córdobas
**Variante:** Cajero ingresa tipo de cambio incorrecto (C$35.00 en vez de C$36.50), causando diferencia en cierre de caja

---

## V-008: Venta con descuento por volumen
**Rol:** Cajero
**Duración:** 4 minutos
**Descripción:** La Licorería El Chele compra 100 botellas de rón (simulado como "Aceite Patrona 1L" para el ejemplo del sistema) y recibe 10% de descuento por volumen de compra.
**Precondiciones:** Regla de descuento configurada: 10% para compras mayores a 50 unidades de ciertos productos
**Pasos:**
1. Cajero agrega 100 unidades de Aceite Patrona 1L (C$85 c/u)
2. Subtotal: C$8,500
3. Sistema detecta que aplica descuento por volumen
4. Sistema aplica 10%: -C$850
5. Total: C$7,650
6. Cajero procesa pago en efectivo
**Resultado esperado:** Descuento automático aplicado, ticket muestra descuento por volumen, total C$7,650
**Variante:** Cajero aplica descuento manual adicional de 5%, el sistema debe rechazar porque los descuentos no son acumulables

---

## V-009: Venta de productos sin inventario (solo exhibición)
**Rol:** Cajero
**Duración:** 2 minutos
**Descripción:** Un cliente quiere comprar un producto que está en exhibición en la góndola pero no tiene inventario disponible en el sistema (se vendió todo pero no se ha repuesto).
**Precondiciones:** Producto visible en góndola (de exhibición), stock en sistema = 0
**Pasos:**
1. Cajero escanea producto: Jabón Rey Lavandería
2. Sistema muestra: "Stock insuficiente. Disponible: 0"
3. Cajero verifica físicamente y confirma que es el último de exhibición
4. Cajero marca producto como "Venta de exhibición" con autorización
5. Administrador autoriza venta del producto de exhibición
6. Stock queda en -1 (se regularizará con próxima recepción)
7. Venta se procesa normalmente
**Resultado esperado:** Venta realizada con nota de "exhibición", inventario queda negativo para regularizar
**Variante:** Producto es parte de un display promocional que no puede desarmarse; se rechaza la venta

---

## V-010: Venta rápida en horas pico (7am-9am)
**Rol:** Cajero
**Duración:** 1 minuto por transacción
**Descripción:** Son las 7:15 AM, hora pico en Los Pinos Central. Hay fila de 12 personas. La mayoría compra productos básicos para el desayuno: pan, café, leche, azúcar, huevos.
**Precondiciones:** Sistema operativo, caja aperturada, hay 4 cajas habilitadas pero solo 2 cajeros
**Pasos:**
1. Cajero atiende rápido, escanea productos sin pausa
2. Cliente 1: Café Presto 200g (C$120) + Leche Klim 400g (C$95) + Azúcar Sulí 1kg (C$38) = C$253
3. Cliente 2: Huevos San Felipe x30 (C$105) + Arroz Faisán 1lb (C$32) = C$137
4. Cliente 3: Aceite Patrona 1L (C$85) + Frijoles Rojos Seda 1lb (C$28) + Jabón Rey Lavandería (C$25) = C$138
5. Entre cada cliente: Cajero usa método "Efectivo exacto" para agilizar
6. Cajero no imprime ticket a menos que el cliente lo solicite
**Resultado esperado:** 12 transacciones en 20 minutos, caja acumula aproximadamente C$3,500 en ingresos
**Variante:** Sistema se vuelve lento a las 7:30 AM por alta concurrencia, cada transacción tarda 30 segundos más

---

## V-011: Venta a una cooperativa
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** La Cooperativa Agropecuaria "San Miguel de Masaya" llega con su lista de compra mensual: 200 bultos de Arroz Faisán, 100 bultos de Frijoles Rojos Seda, 50 cajas de Aceite Patrona y 30 bultos de Azúcar Sulí.
**Precondiciones:** Cooperativa tiene crédito aprobado por C$200,000, lista de precios especial para cooperativas
**Pasos:**
1. Cajero selecciona cliente "Cooperativa San Miguel"
2. Sistema aplica precios especiales de cooperativa automáticamente
3. Cajero ingresa productos:
   - 200 bultos Arroz Faisán x C$450 = C$90,000
   - 100 bultos Frijoles Seda x C$380 = C$38,000
   - 50 cajas Aceite Patrona x C$460 = C$23,000
   - 30 bultos Azúcar Sulí x C$400 = C$12,000
4. Total: C$163,000
5. Sistema verifica límite de crédito: C$200,000 disponible
6. Se genera factura con datos fiscales de la cooperativa (RUC)
7. Cliente paga con cheque de gerencia
**Resultado esperado:** Venta registrada en cuentas por cobrar, inventario descuenta los bultos completos
**Variante:** La cooperativa usa una exención de IVA (productos agropecuarios), el sistema debe calcular sin IVA

---

## V-012: Venta a una escuela / comedor infantil
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** La Escuela Rubén Darío de Managua compra alimentos para su comedor infantil. Es una compra institucional con fondos del MINED.
**Precondiciones:** Escuela registrada como cliente institucional, requieren factura fiscal con datos específicos del MINED
**Pasos:**
1. Cajero selecciona cliente "Escuela Rubén Darío"
2. Agrega: 10 bultos Arroz Faisán, 5 bultos Frijoles Rojos, 3 bultos Azúcar, 2 cajas Leche Klim, 5 cajas Huevos San Felipe
3. Subtotal: C$14,250
4. Sistema aplica descuento institucional del 5%: -C$712.50
5. Total: C$13,537.50
6. Cajero selecciona "Factura Fiscal" e ingresa datos del MINED
7. Sistema emite factura electrónica con timbrado fiscal
8. Pago: Transferencia bancaria (se registra comprobante)
**Resultado esperado:** Factura fiscal emitida, pago registrado como transferencia, descuento institucional aplicado
**Variante:** El MINED cambió los datos fiscales de la escuela y no se actualizaron en el sistema; la factura se rechaza en la validación del SAT

---

## V-013: Venta con factura fiscal
**Rol:** Cajero
**Duración:** 6 minutos
**Descripción:** Un cliente (Comercial Gómez, S.A.) exige factura fiscal con su RUC para deducir el IVA. La venta es de C$45,000.
**Precondiciones:** Cliente registrado con RUC, empresa configurada para facturación electrónica, sistema conectado al SAT
**Pasos:**
1. Cajero selecciona cliente "Comercial Gómez, S.A."
2. Agrega productos al carrito
3. Sistema verifica que el cliente tiene RUC válido
4. Cajero selecciona "Factura Fiscal" como tipo de documento
5. Sistema genera CFDI (Comprobante Fiscal Digital)
6. Sistema envía factura al SAT para timbrado
7. SAT responde con UUID y CBB (código de barras bidimensional)
8. Se imprime factura fiscal con código QR
9. Se envía copia al correo del cliente
**Resultado esperado:** Factura timbrada por el SAT, UUID asignado, cliente recibe su CFDI
**Variante:** SAT está fuera de servicio; sistema genera factura con estatus "Pendiente de timbrar" y la timbra cuando el servicio se restablezca

---

## V-014: Cliente que regresa producto porque "no le gustó"
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Un señor compró Jabón Rey Lavandería y regresa diciendo que "no le gustó el olor". Quiere cambiarlo por Detergente Ariel 500g. La diferencia de precio es de C$15 a favor de la tienda.
**Precondiciones:** Producto sin abrir, ticket de compra (1 día antes), política de cambios vigente
**Pasos:**
1. Cajero recibe ticket y producto sin abrir
2. Busca la venta original en el sistema
3. Selecciona opción "Cambio de producto"
4. Sistema revende Jabón Rey Lavandería (C$25)
5. Cajero agrega Detergente Ariel 500g (C$40)
6. Diferencia a pagar: C$15
7. Cliente paga C$15
8. Sistema ajusta inventario: +1 Jabón Rey, -1 Ariel
9. Se imprime ticket de cambio
**Resultado esperado:** Cambio procesado, cliente paga diferencia, inventario actualizado
**Variante:** Producto ya estaba abierto; el cajero rechaza el cambio según política de la tienda

---

## V-015: Producto caducado al momento de la venta
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Cajero escanea un producto y el sistema alerta que el lote está vencido. Ocurrió porque el bodeguero no rotó el inventario correctamente.
**Precondiciones:** Producto con lote vencido en góndola, sistema tiene control de lote y fecha de vencimiento
**Pasos:**
1. Cajero escanea Leche Klim 400g
2. Sistema muestra alerta roja: "Lote L2305 vencido el 15/06/2026"
3. Cajero no puede proceder con la venta
4. Cajero retira el producto de la góndola
5. Cajero registra el producto como "No apto para venta"
6. Producto pasa a cuarentena para devolución a proveedor
7. Cajero ofrece al cliente un lote válido del mismo producto
**Resultado esperado:** Venta bloqueada para lote vencido, producto marcado para devolución, cliente atendido con lote fresco
**Variante:** Cliente insiste en comprar el lote vencido (para consumo inmediato); el sistema debe rechazar por cumplimiento normativo Minsa

---

## V-016: Venta nocturna después del cierre de caja
**Rol:** Cajero
**Duración:** 4 minutos
**Descripción:** Son las 7:30 PM, la tienda cerró a las 7:00 PM pero un cliente toca la puerta pidiendo que le vendan porque es una emergencia. El cajero ya había hecho el corte de caja.
**Precondiciones:** Corte de caja ya realizado, sistema en modo "cerrado"
**Pasos:**
1. Cajero llama al administrador
2. Administrador abre una "Caja extraordinaria post-cierre"
3. Sistema registra la apertura como "fuera de horario"
4. Se procesa la venta normalmente: Arroz Faisán 1lb, Aceite Patrona 1L, Huevos San Felipe
5. Total: C$222
6. Pago en efectivo
7. Se genera ticket con marca "Post-cierre - Venta fuera de horario"
8. Esta venta irá en el corte del día siguiente
**Resultado esperado:** Venta registrada con marca de horario extendido, no afecta el corte ya cerrado
**Variante:** Cliente quiere factura fiscal pero el sistema no permite timbrar fuera del horario del SAT; se queda como pre-factura

---

## V-017: Dos clientes comprando el último producto al mismo tiempo
**Rol:** Cajero (dos cajeros involucrados)
**Duración:** 3 minutos
**Descripción:** Dos clientes llegan a dos cajas diferentes al mismo tiempo. Solo queda 1 bulto de Azúcar Sulí 1kg. Ambos lo quieren.
**Precondiciones:** Stock de Azúcar Sulí = 1, dos cajas activas
**Pasos:**
1. Cajero 1 (Caja 1): Escanea Azúcar Sulí, stock resta a 0
2. Cajero 2 (Caja 2): Escanea Azúcar Sulí, sistema muestra "Stock insuficiente"
3. Cajero 2 informa al cliente que el producto se agotó
4. Cliente 2 se queja porque "yo llegué primero"
5. Cajero 2 ofrece alternativa: Azúcar Fantur 1kg u otro sustituto
6. Cajero 1 procesa su venta
**Resultado esperado:** Primer cajero completa la venta, segundo cajero maneja la situación con el cliente ofreciendo alternativas
**Variante:** Ambos cajeros escanean simultáneamente antes de que el stock se actualice; sistema debe manejar el bloqueo optimista y rechazar la segunda transacción

---

## V-018: Venta con pago parcial (apartado)
**Rol:** Cajero
**Duración:** 6 minutos
**Descripción:** Doña Juana quiere comprar un bulto de Arroz Faisán y una caja de Aceite Patrona pero solo trajo C$500. Pide apartar los productos y pagar el resto mañana.
**Precondiciones:** Productos disponibles, política de apartados activa
**Pasos:**
1. Cajero inicia venta con modalidad "Apartado"
2. Agrega productos: Bulto Arroz Faisán (C$480) + Caja Aceite Patrona (C$510) = C$990
3. Sistema calcula pago mínimo de apartado: 50% = C$495
4. Cliente paga C$500 (adelanta C$5)
5. Sistema registra apartado con saldo pendiente de C$490
6. Productos se reservan en inventario (no disponibles para otros)
7. Se imprime recibo de apartado con fecha límite (7 días)
8. Cuando el cliente regrese, se busca por cédula y se completa la venta
**Resultado esperado:** Venta en estado "apartado", productos reservados, saldo pendiente C$490
**Variante:** Cliente no regresa en 7 días; sistema libera los productos automáticamente y el abono se convierte en nota de crédito

---

## V-019: Venta con tarjeta cuando el datáfono falla
**Rol:** Cajero
**Duración:** 8 minutos
**Descripción:** Cliente quiere pagar con tarjeta de crédito pero el datáfono (POS bancario) no tiene señal. El sistema Pino2 tiene un módulo de pago integrado.
**Precondiciones:** Ventas normales funcionando, datáfono Bac/Credomatic sin señal
**Pasos:**
1. Cajero totaliza venta: C$1,500
2. Cliente dice "con tarjeta"
3. Cajero intenta pasar tarjeta en datáfono — no hay señal
4. Cajero intenta el módulo de pago integrado de Pino2
5. Módulo intenta conexión: falla también
6. Cajero sugiere al cliente: pagar en efectivo, esperar señal, o ir a un cajero
7. Cajero ofrece: "Podemos procesar el pago manual e ingresar el voucher después"
8. Cajero procesa venta como "Efectivo" y registra el voucher manual
9. Cuando la señal regresa, se captura el pago con tarjeta como transacción separada
**Resultado esperado:** Venta procesada con voucher manual, dinero se concilia al final del día
**Variante:** Cajero procesa como efectivo sin registrar voucher; fin del día falta dinero en caja

---

## V-020: Venta a un menor de edad
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Un niño de 12 años entra a comprar una bolsa de Café Presto 200g para su mamá. Paga con un billete de C$200.
**Precondiciones:** Producto no restringido (no alcohol, no cigarros), menor de edad
**Pasos:**
1. Niño pide Café Presto 200g
2. Cajero verifica que el producto no está restringido
3. Cajero procesa venta normalmente: C$120
4. Recibe C$200, vuelto C$80
5. Entrega producto y vuelto al menor
6. No requiere identificación ni autorización
**Resultado esperado:** Venta normal procesada sin restricciones
**Variante:** Producto restringido (cerveza, cigarros); cajero debe rechazar la venta y explicar que es mayor de 18 años

---

## V-021: Cliente habitual que paga después (fía)
**Rol:** Cajero
**Duración:** 2 minutos
**Descripción:** Doña Lola, vecina de Los Pinos, compra cada día y paga a fin de semana. Pide fiar C$350.
**Precondiciones:** Cliente registrado en sistema como "fiable", tiene historial de pago, crédito pequeño no formal
**Pasos:**
1. Cajero inicia venta
2. Agrega productos: Leche Klim 400g (C$95), Huevos San Felipe x30 (C$105), Jabón Rey (C$25), Arroz Faisán (C$32), Frijoles Seda (C$28), Aceite Patrona (C$85) = C$370
3. Cajero selecciona tipo "Fía" (no crédito formal)
4. Sistema registra deuda pendiente en cuenta informal del cliente
5. Se imprime nota de fía
6. Cajero anota en libreta de fiar
**Resultado esperado:** Deuda registrada, productos entregados, cuenta informal del cliente aumenta C$370
**Variante:** Doña Lola ya debe C$2,000 y el sistema tiene un tope de C$1,500 para fiado; la transacción es rechazada

---

## V-022: Venta de productos en promoción
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Detergente Ariel 500g está en promoción "2x1" esta semana. Cliente lleva 4 unidades y espera pagar solo 2.
**Precondiciones:** Promoción 2x1 activa en el sistema para el producto, fechas de vigencia correctas
**Pasos:**
1. Cliente trae 4 Detergente Ariel 500g
2. Cajero escanea los 4 productos
3. Sistema detecta promoción 2x1
4. Sistema aplica: 2 unidades gratis (o 50% de descuento sobre 4)
5. Subtotal normal: 4 x C$40 = C$160
6. Total con promoción: C$80
7. Cajero procesa pago
8. Ticket muestra descuento por promoción: "-C$80"
**Resultado esperado:** Promoción aplicada correctamente, cliente paga C$80, descuento registrado en reportes de promociones
**Variante:** Cajero escanea solo 2 unidades pero el cliente trajo 4; debe explicar que la promoción se aplica automáticamente al escanear todos

---

## V-023: Venta con error en el vuelto
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Cajero calculó mal el vuelto y dio C$50 de más. El cliente ya se fue. El error se descubre en el arqueo de caja.
**Precondiciones:** Cierre de caja muestra diferencia negativa de C$50
**Pasos:**
1. Cajero cuenta la caja al final del turno
2. Sistema reporta: "Diferencia: -C$50"
3. Cajero revisa transacciones del día
4. Identifica transacción donde dio C$500 de vuelto cuando debió ser C$450
5. Cajero reporta a administrador
6. Administrador registra incidente: "Error de vuelto - C$50"
7. Se descuenta de la nómina del cajero (o se registra como pérdida)
**Resultado esperado:** Diferencia identificada, incidente registrado, responsable notificado
**Variante:** Cliente regresa cuando se da cuenta que le dieron vuelto de menos; cajero debe verificar y entregar diferencia

---

## V-024: Venta anulada después de impresa
**Rol:** Cajero + Administrador
**Duración:** 5 minutos
**Descripción:** Se imprimió el ticket pero el cliente cambió de opinión y ya no quiere los productos. La venta ya está registrada en el sistema.
**Precondiciones:** Venta completada, ticket impreso, todos los métodos de pago registrados
**Pasos:**
1. Cliente pide cancelar la compra
2. Cajero selecciona "Anular venta" en el sistema
3. Sistema solicita motivo de anulación
4. Cajero ingresa: "Cliente desistió de la compra"
5. Sistema requiere autorización de administrador
6. Administrador ingresa PIN para aprobar anulación
7. Sistema invierte todos los movimientos:
   - +Stock (devuelve productos al inventario)
   - -Caja (elimina el ingreso)
   - Invierte pagos (si fue tarjeta, genera reverso)
8. Ticket de anulación se imprime
9. Venta queda en historial con estatus "Anulada"
**Resultado esperado:** Venta anulada, inventario y caja restaurados, registro de anulación en auditoría
**Variante:** Pago fue con tarjeta y ya pasó la hora de reverso; el cliente debe esperar 3-5 días hábiles para el reembolso del banco

---

## V-025: Venta con múltiples métodos de pago
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Cliente paga C$2,540. Usa: C$1,000 en efectivo, C$1,000 con tarjeta de débito, y C$540 con puntos de fidelidad.
**Precondiciones:** Cliente registrado en programa de fidelidad, puntos disponibles (5,400 puntos = C$540)
**Pasos:**
1. Cajero registra todos los productos
2. Total: C$2,540
3. Cajero selecciona "Split payment" (pago dividido)
4. Método 1: Efectivo — C$1,000 (recibe C$1,000, no hay vuelto)
5. Método 2: Tarjeta débito — ingresa monto C$1,000, pasa en datáfono
6. Método 3: Puntos fidelidad — cliente autoriza usar 5,400 puntos = C$540
7. Sistema verifica puntos disponibles y los descuenta
8. Venta completa, ticket desglosa cada método de pago
**Resultado esperado:** Pago distribuido entre 3 métodos, puntos de fidelidad descontados, todos los movimientos registrados
**Variante:** Puntos de fidelidad expiraron el día anterior; sistema rechaza el canje

---

## V-026: Venta a un empleado con precio especial
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Don Luis, bodeguero de Los Pinos Central, compra productos para su casa. Como empleado, tiene derecho a precio de costo + 5%.
**Precondiciones:** Empleado identificado en sistema, configuración de precio especial para empleados activa
**Pasos:**
1. Cajero inicia venta
2. Selecciona tipo "Venta a empleado"
3. Busca empleado: "Luis Martínez — Bodeguero"
4. Agrega productos:
   - Arroz Faisán 1lb (precio público C$32, precio empleado C$22)
   - Aceite Patrona 1L (precio público C$85, precio empleado C$55)
   - Leche Klim 400g (precio público C$95, precio empleado C$65)
5. Total empleado: C$142 vs público: C$213
6. Pago en efectivo
7. Se registra como venta a empleado en reportes
**Resultado esperado:** Precio de empleado aplicado, reporte de ventas a empleados generado
**Variante:** Empleado quiere comprar para un amigo (precio empleado). Cajero debe limitar cantidad según política de la empresa

---

## V-027: Venta con código de barras ilegible
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** El código de barras de un producto (Detergente Ariel 500g) está borroso/dañado y el escáner no lo lee. El cliente tiene prisa.
**Precondiciones:** Producto existe en catálogo, código de barras dañado
**Pasos:**
1. Cajero intenta escanear 3 veces — no lee
2. Cajero busca producto manualmente en el catálogo
3. Opciones:
   a. Buscar por código de producto (ej: ARI500)
   b. Buscar por nombre: "Detergente Ariel 500g"
   c. Buscar por lista de precios
4. Cajero selecciona producto de la lista
5. Verifica precio (C$40) con el cliente
6. Agrega manualmente al carrito
7. Venta continúa normalmente
**Resultado esperado:** Producto agregado manualmente, venta procesada, se reporta código de barras dañado
**Variante:** Cajero selecciona producto equivocado (Detergente Ariel 1kg en vez de 500g); cliente reclama el precio

---

## V-028: Cliente que compra para reventa
**Rol:** Cajero
**Duración:** 4 minutos
**Descripción:** Don Toño compra 30 bultos de Arroz Faisán y 20 bultos de Azúcar Sulí. Dice que es "para su pulpería" pero en realidad es revendedor que abastece varios negocios.
**Precondiciones:** Cliente registrado como "Pulpería Los Amigos", límite de crédito C$30,000
**Pasos:**
1. Cajero agrega 30 bultos Arroz Faisán (C$480 c/u = C$14,400)
2. Agrega 20 bultos Azúcar Sulí (C$420 c/u = C$8,400)
3. Total: C$22,800
4. Cajero verifica: cliente tiene crédito suficiente
5. Sistema sugiere: "Este cliente califica para descuento por volumen"
6. Se aplica 5% de descuento por volumen: -C$1,140
7. Total final: C$21,660
8. Pago: C$10,000 efectivo + C$11,660 a crédito
**Resultado esperado:** Venta con pago mixto, descuento por volumen, cliente paga parcial y el resto a crédito
**Variante:** El cliente quiere que no se facture a su RUC porque "no quiere pagar IVA"; se debe rechazar por evasión fiscal

---

## V-029: Venta con entrega a domicilio
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Un cliente compra 5 bultos de Arroz, 3 cajas de Aceite y 2 bultos de Azúcar y solicita entrega a domicilio en Villa Fontana, Managua.
**Precondiciones:** Servicio de delivery configurado, vehículo disponible, zona de cobertura activa
**Pasos:**
1. Cajero registra venta normal
2. Selecciona opción "Entrega a domicilio"
3. Ingresa dirección: "Villa Fontana, casa #142, Managua"
4. Sistema calcula costo de envío: C$150 (tarifa fija zona urbana)
5. Cajero confirma horario de entrega: 2-4 PM
6. Sistema asigna la entrega a la ruta del día
7. Venta total: C$4,800 (productos) + C$150 (envío) = C$4,950
8. Pago: C$4,950 en efectivo (paga por adelantado)
9. Se genera orden de entrega para el rutero
**Resultado esperado:** Venta registrada con dirección, orden de entrega creada, rutero tiene la ruta asignada
**Variante:** La dirección está en zona no cubierta (zona rural sin ruta); sistema rechaza la entrega a domicilio

---

## V-030: Venta en días festivos con recargo
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Es 1 de enero (Año Nuevo) y la tienda abre medio día. Las ventas tienen un recargo del 15% por ser día festivo (según ley laboral Nicaragüense).
**Precondiciones:** Configuración de día festivo activa en el sistema, recargo del 15% configurado
**Pasos:**
1. Cajero inicia sesión
2. Sistema muestra banner: "Día festivo — Recargo 15% activo"
3. Cliente compra: Café Presto 200g (C$120) + Leche Klim 400g (C$95) = C$215
4. Sistema aplica automáticamente recargo 15%: C$215 + C$32.25 = C$247.25
5. Ticket muestra: "Recargo día festivo 15%: C$32.25"
6. Cliente paga C$250, vuelto C$2.75
7. Reporte de recargos se genera separadamente
**Resultado esperado:** Recargo aplicado automáticamente, visible en ticket, registrado en reporte fiscal de días festivos
**Variante:** Sistema no tiene configurado el día festivo; cajero debe aplicar recargo manual, lo cual es propenso a error

---

## V-031: Venta con cliente que paga con cheque
**Rol:** Cajero
**Duración:** 6 minutos
**Descripción:** Cliente (Distribuidora Pérez) paga con cheque de C$18,500. El sistema debe validar datos del cheque antes de aceptarlo.
**Precondiciones:** Cliente autorizado para pagar con cheque, configuración de aceptación de cheques activa
**Pasos:**
1. Cajero totaliza compra: C$18,500
2. Selecciona modo de pago "Cheque"
3. Ingresa datos del cheque:
   - Banco: BAC Credomatic
   - Número de cheque: 004256
   - Fecha: 25/07/2026
   - Monto: C$18,500
   - Titular: Distribuidora Pérez
4. Sistema valida que el cliente está en lista blanca de cheques
5. Sistema registra cheque como "Pendiente de cobro"
6. Se imprime ticket con nota "Pago con cheque"
7. Cheque físico se guarda en caja fuerte
**Resultado esperado:** Pago registrado como cheque pendiente, cliente recibe su compra, cheque se depositará al día siguiente
**Variante:** Cheque rebotó (sin fondos); sistema debe marcar al cliente como moroso y notificar a administrador

---

## V-032: Venta cruzada (upsell/cross-sell)
**Rol:** Cajero
**Duración:** 2 minutos
**Descripción:** Cliente compra Café Presto 200g. El sistema sugiere vender azúcar y leche porque "quien compra café usualmente compra estos productos".
**Precondiciones:** Módulo de venta cruzada activo, reglas de productos relacionados configuradas
**Pasos:**
1. Cajero escanea Café Presto 200g (C$120)
2. Sistema muestra sugerencia: "Clientes que compran Café Presto también compran: Azúcar Sulí 1kg (C$38), Leche Klim 400g (C$95)"
3. Cajero pregunta al cliente: "¿Lleva azúcar o leche también?"
4. Cliente dice: "Sí, lleve azúcar"
5. Cajero agrega Azúcar Sulí
6. Total: C$158
**Resultado esperado:** Venta incrementada gracias a sugerencia del sistema
**Variante:** Cliente se molesta porque "siente que le están metiendo productos"; cajero debe ser discreto en la sugerencia

---

## V-033: Venta con pago en dólares y tipo de cambio
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Un cliente paga con un billete de US$20. La tienda acepta dólares al tipo de cambio del día (C$36.62 por US$1). El sistema debe calcular el equivalente en córdobas y dar el vuelto en la moneda correcta.
**Precondiciones:** Tipo de cambio configurado en C$36.62, caja con fondos para vuelto en ambas monedas
**Pasos:**
1. Cajero registra productos: Arroz Faisán 1lb (C$32), Aceite Patrona 1L (C$85), Café Presto 200g (C$110) = C$227
2. Cliente entrega US$20
3. Cajero selecciona método de pago "Dólares"
4. Sistema calcula US$20 × 36.62 = C$732.40
5. Vuelto: C$732.40 - C$227 = C$505.40 en córdobas
6. Se imprime ticket con tipo de cambio y ambos montos
**Resultado esperado:** Venta registrada en C$227, pago en USD, vuelto en C$505.40
**Variante:** Tipo de cambio desactualizado; cliente reclama

---

## V-034: Venta con tarjeta cuando el datáfono falla
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** El datáfono (POS bancario) no tiene señal. El cliente insiste en pagar con tarjeta. El cajero debe procesar la venta como "Efectivo" y registrar una nota para conciliar cuando el datáfono vuelva.
**Precondiciones:** Datáfono sin señal, cliente con tarjeta, productos escaneados
**Pasos:**
1. Cajero escanea productos (total C$450)
2. Cliente quiere pagar con tarjeta VISA
3. Datáfono muestra "SIN SEÑAL"
4. Cajero cambia método a "EFECTIVO" pero anota en sistema como "TARJETA_PENDIENTE"
5. Venta se procesa como "CONTADO" pero con nota de método real
6. Cajero registra voucher pendiente en hoja de caja
7. Al final del día, el arqueo debe reflejar C$450 menos en efectivo
**Resultado esperado:** Venta procesada con método alternativo, nota visible en cierre de caja
**Variante:** Cliente no tiene efectivo para pagar de otra forma; se cancela la venta

---

## V-035: Corte de energía durante una venta
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** A las 11am hay un corte de energía programado por Unión Fenosa. El sistema de facturación se cae. La tienda opera con UPS que da 15 minutos de respaldo.
**Precondiciones:** UPS conectado, sistema funcionando
**Pasos:**
1. Cajero está procesando una venta de C$1,200
2. Se va la luz; el UPS emite alerta sonora
3. El servidor local tiene batería para 15 minutos
4. Cajero debe completar la venta actual antes de que el servidor se apague
5. Si el servidor se apaga antes del COMMIT, la venta no queda registrada
6. Al volver la energía, el cajero debe verificar la última venta completada
7. Las ventas no completadas deben re-procesarse
**Resultado esperado:** Venta en progreso se completa o se descarta consistentemente
**Variante:** UPS falla antes del respaldo de 15 minutos - pérdida de transacción no confirmada
