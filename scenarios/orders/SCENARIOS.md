# Escenarios de Pedidos — Pino2 Los Pinos Central

---

## O-001: Pedido normal de bodega a tienda
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se genera un pedido de reposición desde la bodega central hacia la tienda. El sistema calcula cantidades basado en punto de reorden.
**Precondiciones:** Productos con punto de reorden configurado, inventario en bodega suficiente
**Pasos:**
1. Administrador accede a "Generar pedido de reposición"
2. Sistema muestra productos por debajo del punto de reorden:
   - Arroz Faisán 1lb: actual 20 bultos, reorden 50 → pedir 40
   - Aceite Patrona 1L: actual 15 cajas, reorden 30 → pedir 20
   - Azúcar Sulí 1kg: actual 25 bultos, reorden 40 → pedir 20
3. Administrador revisa y confirma cantidades sugeridas
4. Sistema genera pedido #ORD-2026-001
5. Pedido se envía a bodega para preparación
6. Bodega confirma disponibilidad
7. Se programa despacho
**Resultado esperado:** Pedido generado con 3 productos, cantidades calculadas automáticamente, bodega notificada
**Variante:** Bodega no tiene suficiente stock para el pedido; se genera pedido parcial y se programa resto para siguiente recepción

---

## O-002: Pedido urgente (express)
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** La tienda se quedó sin Huevos San Felipe x30 (el producto más vendido del día) y necesita reposición urgente antes de las 10 AM.
**Precondiciones:** Producto agotado, bodega tiene stock, vehículo disponible
**Pasos:**
1. Administrador crea pedido urgente
2. Selecciona tipo: "Express — entrega en 2 horas"
3. Producto: 30 bultos Huevos San Felipe x30
4. Sistema marca el pedido como "Urgente" con prioridad máxima
5. Bodeguero recibe notificación en su terminal
6. Prepara el pedido en 15 minutos
7. Asigna vehículo de reparto express
8. Se despacha inmediatamente
9. Tienda recibe en 45 minutos
**Resultado esperado:** Pedido preparado y despachado en 30 minutos, recibido en tienda en menos de 2 horas
**Variante:** El vehículo express está en ruta; se debe priorizar otro pedido o usar taxi para envío

---

## O-003: Pedido con productos agotados
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Se genera un pedido que incluye productos que están agotados en la bodega. El sistema debe manejar la disponibilidad parcial.
**Precondiciones:** Pedido generado, algunos productos sin stock en bodega
**Pasos:**
1. Bodeguero recibe pedido #ORD-2026-002
2. Comienza a preparar: 20 bultos Arroz (hay 50), 10 bultos Frijoles (hay 15)
3. Llega al tercer producto: 5 cajas Aceite Patrona — stock en bodega: 2
4. Sistema muestra: "Stock insuficiente para 5 cajas. Solo disponible: 2"
5. Bodeguero marca: preparar 2 cajas, 3 pendientes
6. Pedido se divide: "Preparado parcialmente"
7. Los 3 pendientes quedan como "Backorder" para cuando llegue mercancía
8. Se notifica al administrador de la tienda
**Resultado esperado:** Pedido parcialmente preparado, backorder creado para productos faltantes
**Variante:** El producto agotado no tiene fecha de reposición; se sugiere producto sustituto

---

## O-004: Pedido con precio especial
**Rol:** Administrador
**Duración:** 8 minutos
**Descripción:** Un cliente solicita un pedido con precios especiales negociados (descuento por fidelidad del 10%). El pedido debe reflejar los precios acordados.
**Precondiciones:** Cliente con acuerdo de precios especiales, lista de precios configurada
**Pasos:**
1. Administrador crea pedido para "Pulpería Los Amigos"
2. Agrega productos: 30 bultos Arroz Faisán, 20 bultos Frijoles Seda
3. Sistema detecta que el cliente tiene lista de precios "Cliente Frecuente"
4. Aplica automáticamente precios especiales: Arroz C$450 (vs C$480), Frijoles C$360 (vs C$380)
5. Administrador verifica los precios
6. Total: 30x450 + 20x360 = C$13,500 + C$7,200 = C$20,700
7. Confirma pedido
8. Se genera orden con precios especiales visibles
**Resultado esperado:** Precios especiales aplicados, pedido confirmado con descuento de C$1,500 contra precio normal
**Variante:** Administrador intenta aplicar un descuento adicional manual de 5%; sistema rechaza porque los descuentos especiales no son acumulables con otros descuentos

---

## O-005: Preparación de pedido incompleta
**Rol:** Bodeguero
**Duración:** 10 minutos
**Descripción:** El bodeguero prepara un pedido de 50 productos pero accidentalmente solo prepara 48. El error se descubre al cargar el camión.
**Precondiciones:** Pedido generado, bodeguero preparando, faltan 2 productos
**Pasos:**
1. Bodeguero recibe pedido de 50 líneas
2. Prepara los productos en tarimas
3. Marca pedido como "Completado" en el sistema
4. Chofer llega a cargar
5. Chofer cuenta: 48 bultos en vez de 50
6. Reporta la diferencia
7. Bodeguero verifica: faltan 2 bultos de Azúcar Sulí
8. Busca en bodega: encuentra los 2 bultos en otra zona
9. Los agrega a la carga
10. Actualiza el pedido como "completado"
**Resultado esperado:** Pedido completado después de corrección, error humano detectado antes de salir a ruta
**Variante:** Los 2 bultos no se encuentran; se debe ajustar el pedido y notificar al cliente

---

## O-006: Carga de camión con productos frágiles
**Rol:** Bodeguero
**Duración:** 15 minutos
**Descripción:** Se debe cargar un camión con 30 cajas de Aceite Patrona (vidrio) y 50 bultos de Arroz. El aceite es frágil y debe colocarse adecuadamente.
**Precondiciones:** Pedidos preparados, camión asignado, productos frágiles identificados
**Pasos:**
1. Bodeguero verifica el manifiesto de carga
2. Identifica productos frágiles: 30 cajas Aceite Patrona (envase de vidrio)
3. Colocate los bultos de arroz en la base del camión
4. Coloca las cajas de aceite encima, bien aseguradas
5. Usa separadores y esquineros de cartón
6. Asegura la carga con cinchas
7. Toma foto de la carga asegurada (evidencia)
8. Registra en sistema: "Carga completada — productos frágiles asegurados"
9. Chofer firma conformidad
**Resultado esperado:** Carga segura, productos frágiles protegidos, evidencia fotográfica registrada
**Variante:** Durante el trayecto, un bache hace que caiga una caja de aceite y se rompan 3 botellas; se reporta como merma en ruta

---

## O-007: Entrega exitosa
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero llega a la dirección del cliente, entrega los productos y el cliente firma la recepción conforme. Es el escenario ideal.
**Precondiciones:** Pedido preparado, ruta asignada, cliente espera la entrega
**Pasos:**
1. Rutero llega a la dirección: "Pulpería Los Amigos, Mercado Oriental"
2. Identifica al cliente: Don Toño
3. Descarga los productos (20 bultos Arroz, 10 bultos Frijoles)
4. Rutero abre la app móvil de Pino2
5. Selecciona pedido #ORD-2026-003
6. Muestra productos a entregar
7. Cliente verifica cantidad y calidad visualmente
8. Cliente firma digitalmente en la app
9. Rutero marca pedido como "Entregado"
10. Se envía confirmación al sistema central
**Resultado esperado:** Pedido marcado como entregado, firma del cliente registrada, inventario del cliente actualizado
**Variante:** El cliente no puede firmar (no sabe leer/escribir); se usa huella digital o firma del rutero como testigo

---

## O-008: Entrega rechazada (cliente no acepta)
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero llega a entregar el pedido pero el cliente lo rechaza porque "no pidió eso" o porque "los productos están dañados".
**Precondiciones:** Pedido enviado, cliente en dirección, cliente rechaza
**Pasos:**
1. Rutero llega a "Comedor Santa Ana"
2. Doña María (dueña) revisa los productos
3. Dice: "Yo no pedí esto, yo pedí otra marca de aceite"
4. Rutero muestra el pedido en la app: "Aceite Patrona 1L"
5. Cliente insiste: "Yo pedí Aceite Ideal"
6. Rutero no puede forzar la entrega
7. Marca en la app: "Rechazado por el cliente"
8. Motivo: "Producto incorrecto — cliente pidió otra marca"
9. Carga los productos de vuelta al camión
10. Sistema notifica al administrador para resolver el conflicto
**Resultado esperado:** Pedido marcado como rechazado, productos regresan a bodega, administrador contacta al cliente
**Variante:** Cliente rechaza porque encontró los productos más baratos en otro lado; se ofrece descuento para salvar la venta

---

## O-009: Entrega parcial (cliente acepta parte)
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente acepta solo parte del pedido porque algunos productos están dañados o no los necesita.
**Precondiciones:** Pedido enviado, algunos productos en disputa
**Pasos:**
1. Rutero llega a "Licorería El Chele"
2. Productos: 30 cajas Aceite Patrona, 20 bultos Arroz
3. Cliente revisa: 2 cajas de aceite tienen abolladuras
4. Cliente dice: "No acepto esas 2 cajas dañadas"
5. Rutero selecciona "Entrega parcial" en la app
6. Marca las 2 cajas de aceite como "Dañadas — no aceptadas"
7. Completa entrega de 28 cajas + 20 bultos de arroz
8. Cliente firma por la parte aceptada
9. Las 2 cajas dañadas regresan a bodega
10. Sistema ajusta: entrega parcial, devolución registrada
**Resultado esperado:** 28 cajas entregadas + 20 bultos, 2 cajas regresan, cliente firma parcial
**Variante:** Cliente insiste en que todas las cajas están dañadas para no pagar; rutero debe mostrar evidencia (foto de la carga antes de salir)

---

## O-010: Devolución de producto en ruta
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** En medio de la ruta, un cliente solicita devolver productos comprados la semana anterior. El rutero debe procesar la devolución.
**Precondiciones:** Cliente en la ruta actual, producto comprado previamente, dentro de política de devolución
**Pasos:**
1. Rutero llega a "Cooperativa San Miguel"
2. Cliente entrega 3 bultos de Frijoles Seda (comprados hace 5 días)
3. Motivo: "Los granos tienen gorgojos"
4. Rutero verifica el producto: efectivamente tiene gorgojos
5. Abre la opción "Devolución en ruta" en la app
6. Busca la factura original
7. Selecciona los 3 bultos a devolver
8. Motivo: "Producto defectuoso — plaga"
9. Sistema autoriza devolución (preautorizada para este cliente)
10. Rutero recoge los 3 bultos, emite nota de crédito en la app
11. Cliente firma digitalmente
**Resultado esperado:** Devolución procesada en ruta, nota de crédito emitida, productos dañados regresan a bodega
**Variante:** Devolución excede el monto autorizado para el rutero (mayor a C$5,000); debe llamar al administrador para autorización

---

## O-011: Pedido cancelado después de preparado
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El cliente canceló el pedido después de que ya estaba preparado y listo para despachar. Los productos deben regresar a inventario.
**Precondiciones:** Pedido en estado "Preparado", cliente solicita cancelación
**Pasos:**
1. Cliente (Escuela Rubén Darío) llama: "Cancelamos el pedido, el MINED recortó el presupuesto"
2. Administrador busca el pedido #ORD-2026-004
3. Estado actual: "Preparado — listo para despacho"
4. Administrador cancela el pedido en el sistema
5. Motivo: "Cancelación por cliente — recorte presupuestario"
6. Sistema revierte: todos los productos vuelven a inventario
7. Se genera nota de cancelación
8. Se notifica a bodega que los productos ya no salen
9. Se archiva el pedido como "Cancelado"
**Resultado esperado:** Pedido cancelado, inventario restaurado, notificaciones enviadas
**Variante:** Los productos ya habían salido en el camión (estaban en tránsito); se debe llamar al rutero para que regrese

---

## O-012: Pedido con fecha de entrega programada
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un cliente solicita que el pedido se entregue en una fecha específica (no inmediata). Se programa la entrega futura.
**Precondiciones:** Cliente solicita fecha específica, disponibilidad de ruta
**Pasos:**
1. Cliente llama: "Necesito los 50 bultos de Arroz para el 15 de agosto, no antes"
2. Administrador crea pedido con fecha de entrega: 15/08/2026
3. Selecciona tipo: "Programado"
4. Productos se reservan en inventario (no disponibles para otros)
5. Pedido queda en estado "Programado"
6. El 14/08, el sistema activa el pedido para preparación
7. Bodeguero prepara el 14/08 para entrega el 15/08
8. Rutero tiene la entrega en su ruta del 15/08
**Resultado esperado:** Pedido programado, productos reservados, preparación automática un día antes
**Variante:** Cliente quiere cambiar la fecha de entrega; se puede reprogramar hasta 24 horas antes

---

## O-013: Pedido de un cliente nuevo sin historial
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Un cliente nuevo (Doña Elena, nueva pulpería en Ciudad Sandino) quiere hacer su primer pedido. No tiene historial crediticio.
**Precondiciones:** Cliente registrado como nuevo, sin historial de compras, solicita crédito
**Pasos:**
1. Doña Elena llega a la tienda: "Quiero abrir cuenta y hacer pedido"
2. Administrador registra al cliente en el sistema
3. Datos: cédula, dirección, referencias, fotos del negocio
4. Cliente solicita C$15,000 de crédito
5. Administrador evalúa: cliente nuevo, sin historial
6. Decide: crédito inicial de C$5,000 (más conservador)
7. Registra el límite en el sistema
8. Cliente acepta
9. Se genera primer pedido: C$4,800 (por debajo del límite)
10. Pedido se procesa con entrega programada
**Resultado esperado:** Cliente registrado, límite de C$5,000 asignado, primer pedido creado
**Variante:** Cliente no tiene referencias comerciales; se requiere depósito de garantía o pago de contado para el primer pedido

---

## O-014: Pedido de un cliente en mora
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un cliente con saldo vencido (30+ días) quiere hacer un nuevo pedido. El sistema debe bloquear o requerir autorización.
**Precondiciones:** Cliente registrado, tiene saldo vencido de C$8,000 desde hace 35 días
**Pasos:**
1. Cliente (Licorería El Chele) solicita nuevo pedido de C$12,000
2. Administrador crea pedido
3. Sistema muestra alerta: "Cliente en mora — Saldo vencido: C$8,000 (35 días)"
4. Pedido no puede procesarse automáticamente
5. Administrador evalúa opciones:
   a. Rechazar pedido hasta que pague
   b. Aceptar si paga el saldo vencido primero
   c. Aceptar nuevo pedido si paga 50% del saldo vencido
6. Administrador contacta al cliente
7. Cliente se compromete a pagar C$4,000 (mitad)
8. Administrador registra el acuerdo
9. Pedido se procesa condicionado al pago
**Resultado esperado:** Pedido condicionado, acuerdo de pago registrado, cliente paga parcialmente
**Variante:** Cliente no paga ni acepta acuerdo — pedido rechazado, cuenta pasa a cobro judicial

---

## O-015: Pedido con nota de crédito
**Rol:** Administrador
**Duración:** 8 minutos
**Descripción:** Un cliente tiene una nota de crédito por C$2,500 (por devolución anterior) y quiere usarla para pagar total o parcialmente un nuevo pedido.
**Precondiciones:** Cliente tiene nota de crédito vigente, nuevo pedido creado
**Pasos:**
1. Administrador crea pedido para "Pulpería Los Amigos": C$8,500
2. Cliente dice: "Tengo una nota de crédito de C$2,500"
3. Administrador busca nota de crédito #NC-2026-015
4. Verifica: vigente (expira en 3 meses), no usada
5. Aplica nota de crédito al pedido
6. Saldo pendiente: C$8,500 - C$2,500 = C$6,000
7. Cliente pagará C$6,000 contra entrega
8. Sistema marca nota de crédito como "Usada"
9. Pedido procesado con nota de crédito aplicada
**Resultado esperado:** Nota de crédito aplicada al pedido, saldo reducido, nota marcada como usada
**Variante:** Nota de crédito está vencida; el sistema rechaza su aplicación y el cliente debe pagar completo

---

## O-016: Pedido de productos promocionales
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Se procesa un pedido que incluye productos en promoción (Detergente Ariel 500g en "compre 3 lleve 4").
**Precondiciones:** Promoción activa, cliente quiere acogerse, fechas vigentes
**Pasos:**
1. Cliente pide 12 unidades de Detergente Ariel 500g
2. Promoción: "Compre 3, lleve 4" (equivalente a 25% descuento)
3. Administrador ingresa 12 unidades
4. Sistema aplica promoción: por cada 4 unidades, paga 3
5. 12 unidades / 4 = 3 grupos. Paga 3 x 3 = 9 unidades
6. Precio normal: 12 x C$40 = C$480
7. Precio promocional: 9 x C$40 = C$360
8. Ahorro: C$120
9. Pedido procesado con precio promocional
**Resultado esperado:** Precio promocional aplicado, descuento visible en el pedido, inventario reserva 12 unidades
**Variante:** Cliente pide 5 unidades (no múltiplo de 4); 4 se facturan con promoción y 1 a precio normal

---

## O-017: Pedido de temporada (navidad)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Es noviembre y se preparan pedidos especiales de temporada navideña. Los clientes piden productos típicos en grandes cantidades.
**Precondiciones:** Temporada navideña, productos de temporada configurados, clientes hacen pedidos grandes
**Pasos:**
1. Cliente pide: 100 bultos Arroz, 50 Aceite Patrona, 30 Azúcar, 200 Huevos San Felipe
2. También pide productos navideños: aceite para hornear, leche evaporada, etc.
3. Administrador crea pedido de temporada
4. Sistema aplica precios de temporada (pueden ser más altos por demanda)
5. Verifica disponibilidad (los huevos están escasos en diciembre)
6. Asigna prioridad: "Temporada navideña — alta prioridad"
7. Coordina con bodega para garantizar stock
8. Programa entrega para primera semana de diciembre
**Resultado esperado:** Pedido de temporada creado, stock reservado, entrega programada antes de Navidad
**Variante:** La demanda supera el stock disponible (todos piden huevos para Nochebuena); se raciona: máximo 50 bultos por cliente

---

## O-018: Pedido con descuento por pronto pago
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un cliente ofrece pagar el pedido por adelantado si recibe un descuento del 3% por pronto pago. Se acepta la condición.
**Precondiciones:** Cliente con historial, política de pronto pago configurada
**Pasos:**
1. Cliente: "Si pago hoy todo el pedido, ¿me da descuento?"
2. Administrador: "Sí, 3% de descuento por pronto pago"
3. Total del pedido: C$25,000
4. Descuento 3%: -C$750
5. Total a pagar: C$24,250
6. Cliente paga en efectivo al momento
7. Administrador registra pago: "Contado con descuento por pronto pago"
8. Sistema registra el descuento en la factura
9. Pedido se marca como "Pagado — pendiente de entrega"
**Resultado esperado:** Descuento aplicado, pago total recibido, pedido pagado anticipadamente
**Variante:** Cliente paga con tarjeta de crédito; el descuento por pronto pago no aplica a pagos con tarjeta (solo efectivo o transferencia)

---

## O-019: Pedido de una institución del gobierno
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** El MINSA (Ministerio de Salud) hace un pedido de 500 bultos de Arroz y 300 bultos de Frijoles para un programa de asistencia alimentaria. Requiere factura fiscal y cumplir con LAC (Ley de Contrataciones Administrativas).
**Precondiciones:** Institución gubernamental registrada, contrato marco vigente, precios regulados
**Pasos:**
1. MINSA envía orden de compra oficial
2. Administrador verifica que la institución está registrada
3. Crea pedido con los productos solicitados
4. Sistema aplica precios de contrato marco (fijos, no negociables)
5. Genera factura fiscal con datos del MINSA
6. Factura debe incluir: número de contrato, partida presupuestaria
7. Sistema valida que la factura cumple con requisitos fiscales del gobierno
8. Se genera factura con retención de IVA (IR 2%)
9. Pago: transferencia bancaria (hasta 30 días según LAC)
10. Pedido se despacha con nota de envío y factura
**Resultado esperado:** Pedido gubernamental procesado, factura con retenciones, plazo de pago 30 días
**Variante:** La orden de compra del MINSA tiene errores en el RUC; la factura no puede timbrarse hasta corregir con el proveedor

---

## O-020: Pedido con pago contra entrega
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** Cliente acordó pagar el pedido al momento de la entrega, en efectivo. El rutero debe cobrar y entregar.
**Precondiciones:** Pedido marcado como "Pago contra entrega", rutero tiene cambio suficiente
**Pasos:**
1. Rutero llega con el pedido
2. Descarga los productos
3. Cliente verifica mercancía
4. Total: C$12,500
5. Rutero muestra el monto a cobrar en la app
6. Cliente paga en efectivo: C$13,000
7. Rutero recibe el dinero
8. Da vuelto: C$500
9. Registra el pago en la app: "Efectivo — C$12,500"
10. Entrega factura cancelada al cliente
11. Marca pedido como "Entregado y pagado"
**Resultado esperado:** Pago cobrado en ruta, efectivo registrado, pedido completado
**Variante:** Cliente no tiene el monto exacto y rutero no tiene cambio; cliente debe conseguir cambio o pagar con otro método

---

## O-021: Pedido de un cliente que nunca paga
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Un cliente ha acumulado C$35,000 en deuda sin pagar. No responde llamadas. Se debe bloquear y pasar a cobro judicial.
**Precondiciones:** Cliente con deuda vencida de 90+ días, múltiples gestiones de cobro fallidas
**Pasos:**
1. Administrador genera reporte de cuentas incobrables
2. Sistema muestra: Cliente "Distribuidora Pérez", deuda C$35,000, 95 días vencido
3. Administrador intenta contactar — sin éxito
4. Bloquea al cliente en el sistema: "No vender — moroso"
5. Cambia estatus del cliente a "Incobrable — gestión judicial"
6. Sistema impide cualquier nuevo pedido o venta
7. Se genera reporte de deuda para abogados
8. Se provisiona la deuda como pérdida en contabilidad
9. Se emite carta de cobro formal
**Resultado esperado:** Cliente bloqueado, deuda provisionada, caso enviado a cobro judicial
**Variante:** Cliente aparece después de 6 meses a pagar (herederos liquidan deuda); se reactiva si paga completo

---

## O-022: Pedido con entrega en múltiples direcciones
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Una cooperativa pide un pedido grande que debe dividirse y entregarse en 3 direcciones diferentes (3 comunidades rurales).
**Precondiciones:** Cliente con múltiples sucursales o puntos de entrega, pedido consolidado
**Pasos:**
1. Cliente: "Son 150 bultos de Arroz: 50 para comunidad A, 50 para B, 50 para C"
2. Administrador crea pedido maestro
3. Agrega 3 destinos de entrega:
   - Destino 1: Comarca San Miguel, Managua — 50 bultos
   - Destino 2: Comarca Los Martínez, Managua — 50 bultos
   - Destino 3: Comarca El Crucero — 50 bultos
4. Sistema divide el pedido en 3 órdenes de entrega
5. Cada orden tiene su dirección y cantidad
6. Se asignan a rutas diferentes (o la misma ruta con paradas)
7. Bodega prepara cada pedido por separado
8. Cada entrega se confirma independientemente
**Resultado esperado:** Pedido maestro creado, 3 órdenes de entrega generadas, rutas asignadas
**Variante:** Una dirección está mal escrita (no se encuentra); rutero llama al cliente para confirmar dirección correcta

---

## O-023: Pedido reprogramado por mal clima
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Hay lluvias torrenciales en la ruta hacia Matagalpa. La carretera está intransitable. Se debe reprogramar la entrega.
**Precondiciones:** Ruta programada, condiciones climáticas adversas, seguridad del rutero en riesgo
**Pasos:**
1. Rutero reporta: "Lluvias torrenciales en la carretera a Matagalpa — no se puede pasar"
2. Administrador evalúa la situación
3. Decide reprogramar la entrega
4. En Pino2, selecciona pedidos de la ruta a Matagalpa
5. Cambia estado: "Reprogramado por clima"
6. Nueva fecha tentativa: cuando mejore el clima
7. Contacta a los clientes afectados para informar
8. Los productos se mantienen reservados para estos clientes
9. Se monitorea el clima para reagendar
**Resultado esperado:** Pedidos reprogramados, clientes notificados, productos reservados
**Variante:** Cliente necesita los productos con urgencia; se busca ruta alternativa por Jinotega aunque sea más larga

---

## O-024: Pedido con productos que requieren refrigeración
**Rol:** Bodeguero / Rutero
**Duración:** 10 minutos
**Descripción:** Un pedido incluye productos congelados que requieren cadena de frío (carnes, lácteos). Se debe preparar y transportar en condiciones controladas.
**Precondiciones:** Productos de refrigeración configurados, camión con refrigeración disponible
**Pasos:**
1. Pedido incluye: 10 cajas de pollo congelado, 5 cajas de lácteos
2. Bodeguero prepara en zona refrigerada
3. Sistema marca: "Requiere cadena de frío"
4. Asigna camión con refrigeración (#TRK-005 con cooler)
5. Productos se cargan en cooler a 4°C
6. Rutero verifica temperatura antes de salir
7. Registra temperatura inicial en la app
8. Durante la ruta, se monitorea temperatura
9. Al llegar, cliente verifica temperatura del producto
10. Entrega exitosa: temperatura 4°C (dentro del rango)
**Resultado esperado:** Cadena de frío mantenida, temperatura registrada, producto entregado en condiciones óptimas
**Variante:** El cooler falla durante el trayecto, temperatura sube a 10°C; producto se declara no apto y se devuelve

---

## O-025: Pedido con empaque especial
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Un cliente solicita que su pedido se empaque en cajas especiales con su logotipo para regalos empresariales de fin de año.
**Precondiciones:** Cliente solicita empaque personalizado, inventario de cajas especiales disponible
**Pasos:**
1. Cliente: "Necesito 50 canastas navideñas con logotipo de la empresa"
2. Administrador registra nota en el pedido: "Empaque personalizado — logotipo"
3. Bodeguero recibe el pedido con instrucciones especiales
4. Prepara los productos en canastas navideñas
5. Cada canasta incluye: Arroz, Aceite, Café, Leche, Azúcar (surtido)
6. Coloca etiqueta con logotipo del cliente
7. Empaca cada canasta individualmente
8. 50 canastas preparadas
9. Registra en sistema: "Empaque especial completado"
**Resultado esperado:** Pedido empacado según especificaciones, listo para entrega con valor agregado
**Variante:** Las canastas no llegaron del proveedor; se usan cajas genéricas con moño y se descuenta del precio

---

## O-026: Pedido con nota de envío
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Al preparar un pedido, se debe generar una nota de envío que acompañe la mercancía durante el transporte, detallando contenidos.
**Precondiciones:** Pedido preparado, sistema genera nota de envío automática
**Pasos:**
1. Bodeguero completa preparación del pedido #ORD-2026-010
2. Selecciona "Imprimir nota de envío"
3. Sistema genera documento con:
   - Número de pedido, fecha
   - Datos del cliente (nombre, dirección)
   - Lista de productos con cantidades
   - Total de bultos/piezas
   - Número de precinto
4. Bodeguero imprime 2 copias
5. Una copia se pega al pedido
6. Otra copia firma el chofer al cargar
7. Al entregar, cliente firma la nota de envío
**Resultado esperado:** Nota de envío generada, firmada por chofer y cliente, trazabilidad del pedido
**Variante:** La nota de envío no coincide con los productos cargados; se detiene el despacho hasta verificar

---

## O-027: Pedido con diferencia de precio
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El cliente reclama que el precio en el pedido es diferente al que se le cotizó. Hubo un cambio de precio entre la cotización y el pedido.
**Precondiciones:** Cotización enviada, pedido generado después, precio cambió en el sistema
**Pasos:**
1. Cliente recibe pedido y reclama: "El Arroz estaba en C$450, no C$480"
2. Administrador revisa el historial de precios
3. Encuentra: el precio subió de C$450 a C$480 hace 3 días
4. La cotización se hizo hace 8 días con precio anterior
5. El pedido se generó hoy con precio actualizado
6. Administrador decide:
   - Por cortesía, mantiene el precio cotizado (C$450) para este pedido
   - Actualiza la cotización a precio actual para próximos pedidos
7. Modifica el precio del pedido manualmente (con autorización)
8. Ajusta total de C$480 a C$450 por bulto
9. Cliente acepta y confirma pedido
**Resultado esperado:** Precio ajustado al cotizado, cliente satisfecho, nota de ajuste registrada
**Variante:** La diferencia es muy grande (C$100 por bulto); se negocia un descuento parcial para compartir la diferencia

---

## O-028: Pedido de productos sustitutos
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Un producto del pedido está agotado. Se ofrece un producto sustituto de marca alternativa con precio equivalente.
**Precondiciones:** Producto original agotado, sustituto disponible, cliente autoriza
**Pasos:**
1. Bodeguero prepara pedido: Frijoles Rojos Seda 1lb — agotado
2. Sistema muestra: "Stock insuficiente para Frijoles Seda"
3. Sugiere sustituto: "Frijoles Rojos Fantur 1lb — mismo precio C$28"
4. Bodeguero contacta al cliente: "¿Acepta Frijoles Fantur en lugar de Seda?"
5. Cliente autoriza
6. Bodeguero selecciona "Sustituir producto"
7. Cambia Frijoles Seda por Fantur en el pedido
8. Nota: "Sustitución autorizada por cliente — mismo precio"
9. Pedido continúa
**Resultado esperado:** Producto sustituido con autorización, cliente informado, pedido completo
**Variante:** Cliente no autoriza el sustituto; el producto queda como backorder hasta que llegue el original

---

## O-029: Pedido con factura electrónica
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Se genera un pedido que requiere factura electrónica (CFDI). El cliente la necesita para su contabilidad y la solicita por correo.
**Precondiciones:** Cliente con RUC, sistema conectado al SAT para timbrado
**Pasos:**
1. Pedido confirmado: C$35,000 para "Comercial Gómez, S.A."
2. Administrador selecciona "Generar factura electrónica"
3. Sistema prepara CFDI con datos del cliente
4. Envía al SAT para timbrado
5. SAT valida y asigna UUID
6. Factura timbrada con código QR
7. Sistema envía automáticamente al correo del cliente: facturas@comercialgomez.com
8. Se imprime copia para el archivo
9. Pedido queda vinculado a la factura electrónica
**Resultado esperado:** CFDI timbrado, UUID asignado, cliente recibe factura por correo, pedido vinculado
**Variante:** SAT no responde por mantenimiento; factura queda "pendiente de timbrar" y se reenvía automáticamente cuando el servicio se restablezca

---

## O-030: Pedido consolidado de varios clientes
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Varios clientes pequeños (3 pulperías del mismo barrio) hacen un pedido conjunto para optimizar el flete. Se consolida en un solo pedido con entregas separadas.
**Precondiciones:** Múltiples clientes acuerdan pedido consolidado, todos en la misma zona geográfica
**Pasos:**
1. 3 clientes: Pulpería Los Amigos, Pulpería Doña Mary, Pulpería El Chino
2. Todos en el Barrio San Judas, Managua
3. Cada uno da su lista de productos
4. Administrador crea un pedido maestro consolidado
5. Agrupa productos iguales (ej: los 3 piden Arroz → total 25 bultos)
6. Al preparar, cada cliente va etiquetado por separado
7. Sistema genera 3 sub-órdenes dentro del pedido maestro
8. Se asigna una sola ruta con 3 paradas
9. Al entregar, cada cliente recibe su parte y firma su sub-orden
10. Cada cliente paga su parte independientemente
**Resultado esperado:** Pedido consolidado creado, entregas separadas en la misma ruta, eficiencia logística
**Variante:** Un cliente no paga su parte al recibir; se reporta a los otros clientes y se gestiona el cobro separado
