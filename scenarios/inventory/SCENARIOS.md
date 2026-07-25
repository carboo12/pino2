# Escenarios de Inventario — Pino2 Los Pinos Central

---

## I-001: Recepción de mercancía de proveedor
**Rol:** Bodeguero
**Duración:** 20 minutos
**Descripción:** Llega un camión de Cargill con 200 bultos de Arroz Faisán 1lb y 100 bultos de Frijoles Rojos Seda 1lb. Se debe cotejar contra factura y registrar en el sistema.
**Precondiciones:** Orden de compra generada, factura del proveedor, producto esperado en bodega
**Pasos:**
1. Bodeguero recibe factura del proveedor (Cargill)
2. En Pino2, selecciona "Recepción de mercancía"
3. Busca la orden de compra #PO-2026-4852
4. Sistema muestra productos esperados: 200 bultos Arroz Faisán, 100 bultos Frijoles Seda
5. Bodeguero cuenta físicamente los bultos
6. Verifica: 200 bultos Arroz OK, 100 bultos Frijoles OK
7. Ingresa cantidades recibidas en el sistema
8. Sistema registra productos en inventario con datos: proveedor, fecha, lote, fecha de vencimiento
9. Se imprime etiqueta de recepción
10. Bodeguero ubica los productos en la bodega (zona A - abarrotes)
**Resultado esperado:** Inventario actualizado con +200 Arroz, +100 Frijoles, fecha y lote registrados
**Variante:** La factura dice 205 bultos de Arroz pero físicamente solo llegaron 200; se registra la diferencia como "pendiente"

---

## I-002: Ajuste por pérdida/robo
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se descubre que faltan 3 bultos de Aceite Patrona 1L en la bodega. No hay registro de venta ni de traspaso. Se confirma robo interno.
**Precondiciones:** Conteo físico muestra diferencia contra sistema, evidencia de pérdida
**Pasos:**
1. Administrador realiza conteo físico de Aceite Patrona
2. Sistema muestra: stock teórico = 45 bultos
3. Conteo físico: 42 bultos
4. Diferencia: -3 bultos
5. Administrador investiga: revisa cámaras, no encuentra venta ni traspaso
6. Se confirma: robo interno
7. En Pino2, selecciona "Ajuste de inventario → Robo"
8. Ingresa: -3 bultos Aceite Patrona, motivo "Robo interno — bajo investigación"
9. Sistema registra ajuste y bloquea los productos para auditoría
10. Se genera reporte de pérdida para seguro
**Resultado esperado:** Stock ajustado a 42, pérdida registrada como "robo", notificación a gerencia
**Variante:** Aparecen los productos días después en otra área; se hace ajuste inverso y se cancela el reporte de robo

---

## I-003: Ajuste por producto dañado
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Durante la carga de un camión, un bulto de Arroz Faisán se cae y se rompe, derramando el contenido. El producto ya no es vendible.
**Precondiciones:** Producto dañado físicamente, bodeguero presente
**Pasos:**
1. Bodeguero reporta el incidente
2. En Pino2, selecciona "Ajuste de inventario → Dañado"
3. Busca producto: "Arroz Faisán 1lb - bulto x24"
4. Ingresa cantidad: -1 bulto (24 unidades)
5. Motivo: "Caída durante carga — empaque roto"
6. Sistema descuenta del inventario disponible
7. Producto se marca como "Merma — dañado"
8. Se registra valor de pérdida: C$480 (precio de costo)
9. Producto dañado se separa para disposición final (desecho o donación animal)
**Resultado esperado:** Inventario reduce 1 bulto, merma registrada en reporte de pérdidas
**Variante:** Solo 5 libras del bulto de 24 se dañaron; el bodeguero puede separar las libras buenas y ajustar solo 5 unidades

---

## I-004: Producto caducado en bodega
**Rol:** Bodeguero
**Duración:** 10 minutos
**Descripción:** Durante la limpieza semanal de bodega, se encuentran 15 unidades de Leche Klim 400g con fecha de vencimiento pasada (caducadas hace 3 días).
**Precondiciones:** Producto con lote vencido, bodeguero realiza inspección
**Pasos:**
1. Bodeguero identifica 15 Leche Klim vencidas (lote L2305, vence 22/07/2026)
2. En Pino2, selecciona "Producto caducado"
3. Escanea o busca el producto
4. Selecciona lote específico: L2305
5. Ingresa cantidad: 15
6. Motivo: "Vencimiento — lote expirado"
7. Sistema mueve producto de "Disponible" a "Caducado"
8. Se genera etiqueta de "Cuarentena — producto caducado"
9. Productos se separan para devolución a proveedor (si aplica) o destrucción
10. Se notifica al administrador para gestionar devolución
**Resultado esperado:** 15 unidades pasan a estado "caducado", no disponibles para venta, reporte de caducidad generado
**Variante:** Proveedor acepta devolución de productos caducados; se genera nota de crédito y los productos se retiran

---

## I-005: Conteo cíclico físico
**Rol:** Bodeguero
**Duración:** 30 minutos
**Descripción:** Se realiza conteo cíclico programado de la categoría "Abarrotes" (sección A). Se cuentan 50 productos diferentes y se cotejan contra el sistema.
**Precondiciones:** Programa de conteo cíclico activo, sección A programada para hoy
**Pasos:**
1. Bodeguero imprime lista de productos a contar (sección A)
2. En Pino2, selecciona "Conteo cíclico"
3. Sistema muestra lista de 50 productos de la sección A
4. Bodeguero cuenta físicamente cada producto:
   - Arroz Faisán 1lb: sistema 450, físico 448 (diferencia -2)
   - Frijoles Seda 1lb: sistema 320, físico 322 (diferencia +2)
   - Azúcar Sulí 1kg: sistema 285, físico 285 (exacto)
   - ...
5. Bodeguero ingresa conteo físico de cada producto
6. Sistema calcula diferencias automáticamente
7. Diferencias dentro del margen (0.5%) se ajustan automáticamente
8. Diferencias mayores requieren autorización
**Resultado esperado:** 50 productos contados, diferencias ajustadas, reporte de precisión de inventario generado
**Variante:** Bodeguero se salta un producto sin contar; sistema detecta que no se ingresó dato y solicita completar

---

## I-006: Transferencia entre tiendas (Central → Norte)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** La tienda Los Pinos Norte necesita 20 bultos de Arroz Faisán y 10 bultos de Azúcar Sulí. Se transfiere desde Central.
**Precondiciones:** Ambas tiendas en el sistema, Central tiene suficiente stock, usuario tiene permisos de transferencia
**Pasos:**
1. Administrador en Central selecciona "Transferencia de inventario"
2. Selecciona origen: "Los Pinos — Central"
3. Selecciona destino: "Los Pinos — Norte"
4. Agrega productos:
   - 20 bultos Arroz Faisán
   - 10 bultos Azúcar Sulí
5. Sistema verifica stock disponible en Central
6. Se genera orden de transferencia #TR-2026-102
7. Se preparan los productos para despacho
8. Chofer firma la salida
9. Al llegar a Norte, el bodeguero de Norte confirma recepción
10. Sistema descuenta de Central y acredita a Norte
**Resultado esperado:** Central: -20 Arroz, -10 Azúcar. Norte: +20 Arroz, +10 Azúcar. Transferencia registrada
**Variante:** Al llegar a Norte, faltan 2 bultos de azúcar; se registra diferencia y se investiga pérdida en tránsito

---

## I-007: Producto mal clasificado en bodega
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Se encuentra un bulto de Jabón Rey Lavandería en la zona de productos de limpieza cuando en el sistema está clasificado como "Cuidado personal".
**Precondiciones:** Producto físico y sistema tienen categorías diferentes, bodeguero hace verificación
**Pasos:**
1. Bodeguero escanea código de barras del Jabón Rey
2. Sistema muestra: "Categoría: Cuidado personal"
3. Bodeguero verifica físicamente: está en zona de limpieza
4. Bodeguero reporta la inconsistencia
5. Administrador revisa y confirma que la categoría correcta es "Limpieza"
6. En Pino2, edita la categoría del producto
7. La ubicación física ahora coincide con la del sistema
**Resultado esperado:** Producto actualizado de "Cuidado personal" a "Limpieza", consistencia entre físico y sistema
**Variante:** El cambio de categoría afecta precios (impuestos diferentes); se debe recalcular el IVA

---

## I-008: Exceso de inventario (producto lento)
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El reporte de rotación muestra que el Jabón Rey Lavandería tiene 200 bultos en inventario y solo se venden 2 por semana. Es producto de lenta rotación.
**Precondiciones:** Reporte de rotación generado, producto identificado como lento
**Pasos:**
1. Administrador genera reporte "Productos de lenta rotación"
2. Sistema lista: Jabón Rey Lavandería — 200 bultos, rotación 0.4 semanal
3. Se calculan días de inventario: 200 / (2/semana) = 700 días
4. Administrador evalúa opciones:
   a. Promoción para liquidar
   b. Devolución a proveedor
   c. Transferencia a tienda con mayor demanda
5. Decide: promoción 20% de descuento
6. Configura promoción en el sistema: Jabón Rey, 20%, 2 semanas
7. Se genera orden de promoción
**Resultado esperado:** Promoción activa para producto lento, inventario se reducirá gradualmente
**Variante:** Aún con promoción no se vende; se procede a devolución a proveedor

---

## I-009: Quiebre de stock (producto agotado)
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un cliente quiere comprar 20 bultos de Huevos San Felipe x30, pero el inventario muestra 0. Es uno de los productos más vendidos.
**Precondiciones:** Stock = 0, punto de reorden configurado, orden de compra pendiente
**Pasos:**
1. Cajero intenta vender 20 bultos de Huevos San Felipe
2. Sistema rechaza: "Stock insuficiente. Disponible: 0"
3. Administrador revisa inventario del producto
4. Verifica que hay una orden de compra en tránsito (50 bultos, llegan mañana)
5. Administrador ve el historial: se pidieron 50 bultos pero la demanda era de 80
6. Se genera orden de compra urgente por 30 bultos adicionales
7. Se notifica al cliente que puede recoger mañana
**Resultado esperado:** Orden urgente generada, cliente notificado, punto de reorden revisado para ajustar a 60
**Variante:** El quiebre es porque el proveedor no despachó; se busca proveedor alternativo (Granja San Francisco)

---

## I-010: Recepción con diferencia contra factura
**Rol:** Bodeguero
**Duración:** 15 minutos
**Descripción:** Llega factura de Proveedor "Aceitera Patrona" por 50 cajas de Aceite Patrona 1L. Al contar físicamente, solo hay 48 cajas. Faltan 2.
**Precondiciones:** Orden de compra #PO-2026-4901, factura del proveedor por 50, físicos 48
**Pasos:**
1. Bodeguero inicia recepción en Pino2
2. Selecciona orden de compra: espera 50 cajas
3. Cuenta físicamente: solo 48 cajas
4. Ingresa cantidad recibida: 48
5. Sistema pregunta: "Diferencia de -2 unidades. ¿Desea registrar como faltante?"
6. Bodeguero ingresa: "Faltante de 2 cajas — verificar con proveedor"
7. Sistema registra recepción parcial de 48
8. Se genera nota de diferencia para reclamar al proveedor
9. Las 48 cajas se agregan al inventario
10. Las 2 faltantes quedan como "Pendiente de recepción"
**Resultado esperado:** 48 registradas en inventario, diferencia documentada para reclamo
**Variante:** Las 2 cajas aparecen después (se habían quedado en el camión); se hace ajuste de entrada extemporánea

---

## I-011: Producto sin código de barras
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Llega un producto nuevo de un proveedor local (Café Presto 200g en presentación especial) que no tiene código de barras.
**Precondiciones:** Producto nuevo sin GTIN, sistema requiere código para inventario
**Pasos:**
1. Bodeguero intenta registrar el producto en el sistema
2. Escanea — no hay código de barras
3. En Pino2, selecciona "Crear producto" → "Sin código de barras"
4. Ingresa datos: Café Presto 200g (presentación especial navideña), proveedor: Presto
5. Sistema genera código interno: "PRESTO200-NAV"
6. Se imprime etiqueta con código interno
7. Se pega etiqueta al producto
8. Producto registrado y etiquetado
9. Se notifica al administrador para gestionar código de barras oficial
**Resultado esperado:** Producto registrado con código interno, etiqueta impresa y colocada
**Variante:** El código interno ya existe para otro producto; sistema alerta y asigna otro

---

## I-012: Producto con código de barras duplicado
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se descubre que dos productos diferentes (Detergente Ariel 500g y Detergente Ariel 1kg) tienen el mismo código de barras registrado en el sistema.
**Precondiciones:** Productos configurados con el mismo GTIN, error de carga de datos
**Pasos:**
1. Cajero escanea Detergente Ariel 500g
2. Sistema muestra Detergente Ariel 1kg (precio incorrecto)
3. Cajero reporta el error
4. Administrador investiga en el catálogo
5. Encuentra: ambos productos tienen GTIN "750100123456"
6. Administrador edita el producto 500g, corrige el código de barras al correcto (750100123457)
7. Verifica que el código no esté en uso
8. Guarda cambios
**Resultado esperado:** Códigos de barras únicos, productos diferenciados correctamente
**Variante:** El código duplicado ya está en facturas y ventas anteriores; se debe mantener historial

---

## I-013: Ajuste masivo post-huracán
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** El Huracán "Julia" afectó la bodega de Los Pinos Central. Hubo inundación y se perdieron productos de la sección baja. Se debe ajustar todo el inventario afectado.
**Precondiciones:** Desastre natural ocurrido, evaluación de daños completada, seguro notificado
**Pasos:**
1. Administrador evalúa daños físicos en bodega
2. Sección baja inundada: 50 bultos de Arroz Faisán, 30 bultos de Azúcar Sulí, 20 bultos de Frijoles Seda
3. En Pino2, selecciona "Ajuste masivo por desastre"
4. Carga lista de productos dañados (desde hoja de cálculo)
5. Ingresa cantidades y motivo: "Inundación por huracán Julia"
6. Sistema descuenta todo del inventario disponible
7. Se genera reporte de pérdida total para el seguro
8. Productos dañados se marcan como "Pérdida total — desastre natural"
9. Se programa re-orden de reposición
**Resultado esperado:** Inventario ajustado masivamente, reporte de pérdida generado, orden de reposición creada
**Variante:** Algunos productos de la zona alta se salvaron; se hace doble inventario para separar dañados de salvados

---

## I-014: Inventario de productos congelados
**Rol:** Bodeguero
**Duración:** 15 minutos
**Descripción:** Se recibe un contenedor con productos congelados (carnes, vegetales congelados). Se deben registrar en el sistema con control de temperatura y lote.
**Precondiciones:** Congelador en bodega, productos perecederos, control de temperatura
**Pasos:**
1. Bodeguero verifica temperatura del congelador: -18°C (correcto)
2. Recibe productos congelados del proveedor
3. En Pino2, selecciona "Recepción de congelados"
4. Ingresa producto, lote y temperatura de recepción
5. Sistema asigna ubicación: "Congelador — estante B3"
6. Se imprime etiqueta para producto congelado (resistente a humedad)
7. Bodeguero almacena en congelador
8. Sistema activa alerta de temperatura para este producto
**Resultado esperado:** Productos registrados con lote y temperatura, ubicación específica en congelador
**Variante:** La temperatura del camión de reparto es de -10°C (debía ser -18°C); se rechaza la recepción por cadena de frío rota

---

## I-015: Merma por derrame/rotura
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Un bodeguero dejó caer una caja de Aceite Patrona 1L. Se rompieron 4 botellas de vidrio y el aceite se derramó. El producto es pérdida total.
**Precondiciones:** Producto físico dañado, derrame ocurrido
**Pasos:**
1. Bodeguero reporta el accidente
2. En Pino2, selecciona "Ajuste por merma → Derrame"
3. Busca: Aceite Patrona 1L
4. Ingresa cantidad: -4 unidades
5. Motivo: "Rotura de envase de vidrio durante manipulación"
6. Costo de merma: 4 x C$55 (precio costo) = C$220
7. Sistema registra merma
8. Bodeguero limpia el derrame
9. Los vidrios rotos se desechan según normativa
**Resultado esperado:** 4 unidades descartadas, merma registrada, pérdida de C$220 documentada
**Variante:** El derrame afectó productos cercanos (empaques de cartón mojados con aceite); se debe evaluar daño colateral

---

## I-016: Producto vencido en góndola
**Rol:** Cajero / Bodeguero
**Duración:** 5 minutos
**Descripción:** Un cliente encontró un producto vencido en la góndola y lo reportó al cajero. Puede generar multa del Minsa si no se maneja correctamente.
**Precondiciones:** Producto en góndola con lote vencido, cliente reporta
**Pasos:**
1. Cliente lleva Leche Klim 400g al cajero: "Está vencida"
2. Cajero verifica fecha: vence 20/06/2026 (hoy es 25/07/2026)
3. Cajero reporta al administrador
4. Administrador revisa la góndola completa de Leche Klim
5. Encuentra 10 unidades vencidas mezcladas con 30 buenas
6. En Pino2, bloquea el lote completo (L2305)
7. Todas las unidades del lote L2305 pasan a "Cuarentena — revisión"
8. Se separan físicamente de la góndola
9. 30 unidades buenas (lote L2310) se quedan en góndola
10. Se ofrece disculpas al cliente y un descuento en su próxima compra
**Resultado esperado:** Lote vencido retirado, inventario ajustado, cliente compensado
**Variante:** Cliente amenaza con denunciar al Minsa; administrador debe documentar la acción correctiva inmediata

---

## I-017: Donación de producto próximo a vencer
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se tienen 20 bultos de Arroz Faisán que vencen en 15 días. No se venderán a tiempo. Se decide donar a un comedor infantil.
**Precondiciones:** Producto próximo a vencer (menos de 30 días), acuerdo con beneficiario, beneficio fiscal disponible
**Pasos:**
1. Administrador identifica productos próximos a vencer
2. En Pino2, selecciona "Donación"
3. Busca producto: Arroz Faisán 1lb (lote L2320, vence 10/08/2026)
4. Ingresa cantidad: 20 bultos = 480 unidades
5. Selecciona beneficiario: "Comedor Santa Ana" (registrado en sistema)
6. Ingresa número de acta de donación
7. Sistema descuenta del inventario disponible
8. Productos pasan a "Inventario — Donado"
9. Se genera comprobante de donación para deducción fiscal
10. Se coordina entrega con el comedor
**Resultado esperado:** Productos donados, beneficio fiscal registrado, inventario ajustado, comedor recibe alimentos
**Variante:** El beneficiario no puede recibir la donación (falta de permiso); se busca otro beneficiario (Iglesia San José)

---

## I-018: Devolución a proveedor
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se devuelven 10 bultos de Frijoles Rojos Seda que están próximos a vencer (según acuerdo comercial con el proveedor, se pueden devolver).
**Precondiciones:** Acuerdo de devolución con proveedor, productos en buen estado, dentro del plazo
**Pasos:**
1. Administrador selecciona productos a devolver
2. En Pino2, selecciona "Devolución a proveedor"
3. Busca orden de compra original #PO-2026-4700
4. Selecciona: 10 bultos Frijoles Rojos Seda (lote L2290)
5. Motivo: "Próximo a vencer — según acuerdo comercial"
6. Sistema reserva los productos (no disponibles para venta)
7. Se genera nota de devolución
8. Se coordina recogida con el proveedor
9. Proveedor recoge los productos y emite nota de crédito
10. Admin registra nota de crédito en el sistema
**Resultado esperado:** 10 bultos retirados de inventario, nota de crédito registrada, proveedor actualizado
**Variante:** El proveedor no acepta la devolución porque el producto tiene menos de 60 días de vida útil; se debe vender con descuento

---

## I-019: Producto con empaque dañado (bulto roto)
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** Un bulto de Azúcar Sulí 1kg (24 unidades por bulto) está rasgado. El empaque exterior está roto pero los paquetes individuales están intactos.
**Precondiciones:** Empaque exterior dañado, producto individual en buen estado
**Pasos:**
1. Bodeguero encuentra bulto con empaque roto
2. Evalúa: los 24 paquetes individuales están intactos
3. Decide: desarmar el bulto y vender como unidades sueltas
4. En Pino2, selecciona "Desarmar bulto"
5. Escanea producto: Azúcar Sulí 1kg
6. Ingresa: 1 bulto (24 unidades) → unidades sueltas
7. Sistema convierte: -1 bulto (24), +24 unidades individuales
8. Las 24 unidades quedan disponibles para venta individual
9. Se etiquetan individualmente
**Resultado esperado:** Bulto desarmado, 24 unidades sueltas en inventario, precio unitario aplicado
**Variante:** Algunos paquetes internos también están dañados; se ajustan como merma parcial

---

## I-020: Fumigación / cuarentena de producto
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** Se encontraron plagas (gorgojos) en la sección de granos básicos. Se debe fumigar y poner en cuarentena todos los productos afectados.
**Precondiciones:** Plaga detectada, fumigación programada, productos afectados identificados
**Pasos:**
1. Administrador detecta gorgojos en Arroz y Frijoles
2. En Pino2, selecciona "Cuarentena por fumigación"
3. Selecciona sección: "Zona A — Granos básicos"
4. Todos los productos de esa zona pasan a estado "Cuarentena"
5. Productos en cuarentena no están disponibles para venta
6. Se imprime letrero de "Área en fumigación"
7. Se realiza fumigación (8:00 AM - 10:00 AM)
8. Después de fumigación, administrador inspecciona
9. Productos sin daño: salen de cuarentena
10. Productos dañados por plaga: se ajustan como merma
**Resultado esperado:** Productos en cuarentena durante fumigación, luego se liberan o ajustan, ventas no afectadas por productos contaminados
**Variante:** Clientes se quejan porque no encuentran productos de granos básicos; se debe colocar aviso en góndola

---

## I-021: Producto retenido por Minsa (Ministerio de Salud)
**Rol:** Administrador
**Duración:** 1 hora
**Descripción:** El Minsa realiza una inspección y retiene 50 unidades de Leche Klim 400g por posible contaminación. Se debe bloquear el lote completo.
**Precondiciones:** Inspección del Minsa en curso, lote sospechoso identificado
**Pasos:**
1. Inspector del Minsa llega a la tienda
2. Solicita documentación de Leche Klim 400g (registro sanitario, lote)
3. Toma muestras del lote L2310 (50 unidades)
4. Emite acta de retención preventiva
5. Administrador ingresa acta en Pino2: "Retención Minsa"
6. Bloquea todo el lote L2310 (200 unidades, incluyendo las 50 retenidas)
7. Producto pasa a estado "Retenido — Minsa"
8. No se puede vender ni mover hasta liberación
9. Se espera resultado de análisis (7 días hábiles)
**Resultado esperado:** Lote bloqueado, acta registrada, productos identificados como retenidos
**Variante:** Análisis confirma contaminación; todos los productos del lote deben destruirse y se pierde completamente

---

## I-022: Consolidación de inventario fin de mes
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** Se realiza el cierre de inventario mensual. Todos los productos deben contarse y las diferencias ajustarse para el cierre contable.
**Precondiciones:** Fin de mes, todos los movimientos del mes registrados, última semana sin conteos cíclicos programados
**Pasos:**
1. Administrador bloquea el inventario para nuevos movimientos (solo ventas permitidas)
2. Imprime hojas de conteo por secciones
3. Asigna bodegueros a cada sección
4. Se realiza conteo físico de todos los productos (4 horas)
5. Bodegueros ingresan conteos en el sistema
6. Sistema calcula diferencias:
   - 320 productos exactos
   - 15 productos con diferencia menor (ajuste automático)
   - 5 productos con diferencia mayor (requieren investigación)
7. Administrador investiga las 5 diferencias mayores
8. Se registran ajustes con justificación
9. Se genera reporte de inventario final del mes
**Resultado esperado:** Inventario final conciliado, diferencias ajustadas, reporte contable generado
**Variante:** La diferencia debe explicarse en la contabilidad; si no hay justificación, se reporta como pérdida

---

## I-023: Lote vencido mezclado con bueno
**Rol:** Bodeguero
**Duración:** 10 minutos
**Descripción:** En la bodega se encontró que un bodeguero mezcló producto de un lote nuevo con uno viejo. Hay Leche Klim de lote L2305 (vence pronto) mezclada con L2310 (fresca).
**Precondiciones:** Dos lotes del mismo producto mezclados físicamente, no se pueden separar
**Pasos:**
1. Bodeguero encuentra la mezcla de lotes
2. No se pueden separar físicamente (ya están combinados)
3. Reporta al administrador
4. Administrador evalúa: si L2305 vence en 5 días, el lote completo debe venderse antes o pasará a merma
5. En Pino2, unifica el inventario bajo el lote más próximo a vencer (L2305)
6. Se reduce la fecha de vencimiento efectiva a 5 días
7. Se crea promoción urgente: 30% descuento en Leche Klim
8. Se coloca en góndola destacada para liquidación rápida
9. Si no se vende en 5 días, se dona o se desecha
**Resultado esperado:** Lotes unificados bajo el más crítico, promoción activada, seguimiento de venta
**Variante:** Cliente compra producto y descubre que vence mañana; se le ofrece cambio o descuento adicional

---

## I-024: Recepción de contenedor completo
**Rol:** Administrador / Bodeguero
**Duración:** 3 horas
**Descripción:** Llega un contenedor de 40 pies con 1,200 bultos de productos importados (Arroz, Frijoles, Aceite). Se debe recibir completo y cotejar contra conocimiento de embarque.
**Precondiciones:** Contenedor en puerto (Corinto), documentos de importación, orden de compra internacional
**Pasos:**
1. Contenedor llega a la bodega
2. Bodeguero verifica precintos de seguridad
3. Abre contenedor con administrador presente
4. Descarga y cuenta cada tipo de producto:
   - 400 bultos Arroz Faisán (importado)
   - 300 bultos Frijoles Seda
   - 500 cajas Aceite Patrona
5. En Pino2, selecciona "Recepción de contenedor"
6. Carga orden de compra internacional
7. Ingresa cantidades recibidas
8. Sistema registra con información aduanera (número de DAI)
9. Se verifican fechas de vencimiento de cada lote
10. Productos se ubican en bodega según rotación
**Resultado esperado:** 1,200 bultos registrados, inventario actualizado con datos aduaneros
**Variante:** Llegan 390 bultos de Arroz en vez de 400; se registra diferencia y se inicia reclamo a la naviera

---

## I-025: Producto sin registro sanitario
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Un proveedor local ofrece un producto nuevo (churros industrializados) pero no tiene registro sanitario del Minsa. No puede comercializarse.
**Precondiciones:** Producto nuevo, proveedor local, sin registro sanitario
**Pasos:**
1. Proveedor ofrece "Churros Doña Tota" a C$15 la unidad
2. Administrador revisa documentación
3. No tiene registro sanitario del Minsa
4. Administrador rechaza el producto en el sistema
5. No se puede crear el producto en el catálogo sin registro
6. Administrador informa al proveedor que debe gestionar el registro
7. Ingresa nota: "Proveedor contactado — pendiente de registro sanitario"
8. Se programa seguimiento en 30 días
**Resultado esperado:** Producto no ingresado, proveedor notificado, sistema mantiene integridad regulatoria
**Variante:** Producto se vende igual sin registro; riesgo de multa del Minsa y cierre de tienda

---

## I-026: Ajuste por producto robado en bodega
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Cámaras de seguridad muestran a un empleado sustrayendo 5 cajas de Aceite Patrona 1L durante la noche. Se debe ajustar el inventario y proceder legalmente.
**Precondiciones:** Evidencia de video, empleado identificado, robo confirmado
**Pasos:**
1. Administrador revisa grabaciones de seguridad
2. Identifica al empleado (bodeguero nocturno)
3. Confirma robo de 5 cajas de Aceite Patrona (30L total)
4. En Pino2, selecciona "Ajuste por robo documentado"
5. Ingresa: -5 cajas Aceite Patrona
6. Motivo: "Robo interno — empleado [nombre], caso abierto #INV-2026-05"
7. Adjunta evidencia (número de caso)
8. Sistema ajusta inventario
9. Genera reporte para la policía y el seguro
10. Se inicia proceso de despido
**Resultado esperado:** Inventario ajustado, caso documentado, proceso disciplinario iniciado
**Variante:** Empleado alega inocencia; se retiene el ajuste hasta que concluya la investigación interna

---

## I-027: Bultos/unidades con diferencias
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** El sistema muestra 10 bultos de Huevos San Felipe x30 (equivalente a 300 unidades). El conteo físico encuentra 9 bultos completos + 22 unidades sueltas (295 unidades totales).
**Precondiciones:** Producto con presentación de bulto y unidad, diferencia en el conteo
**Pasos:**
1. Bodeguero cuenta: 9 bultos sellados + 22 unidades sueltas
2. Sistema reporta: 10 bultos (presentación bulto)
3. Diferencia: 1 bulto menos, 22 unidades sueltas de más
4. Bodeguero investiga: encontró que se desarmó un bulto para ventas individuales
5. No se registró el desarme en el sistema
6. En Pino2, registra: "Desarmar 1 bulto (30 unidades)"
7. Mueve el inventario: -1 bulto, +30 unidades
8. Ahora: 9 bultos + 30 unidades sueltas = 300 unidades (cuadra con lo físico)
9. Pero físicamente hay 22 unidades, no 30 — faltan 8 unidades
10. Se ajustan las 8 como diferencia no explicada
**Resultado esperado:** Inventario reconciliado: 9 bultos + 22 unidades, diferencia de 8 ajustada
**Variante:** Se encuentran las 8 unidades en otra área de la bodega (mal ubicadas); se cancelan los ajustes

---

## I-028: Producto mal ubicado en el sistema
**Rol:** Bodeguero
**Duración:** 5 minutos
**Descripción:** El sistema dice que el producto está en "Pasillo 3, estante B2" pero físicamente está en "Pasillo 5, estante A1". El bodeguero no lo encuentra para despachar.
**Precondiciones:** Producto existe, ubicación en sistema incorrecta
**Pasos:**
1. Rutero requiere despachar 5 bultos de Azúcar Sulí
2. Bodeguero consulta ubicación en Pino2: "Pasillo 3, B2"
3. Va a la ubicación: no hay producto
4. Busca manualmente en toda la bodega
5. Encuentra los 5 bultos en "Pasillo 5, A1"
6. En Pino2, actualiza la ubicación: "Pasillo 5, A1"
7. Explica la diferencia (otro bodeguero movió los productos sin actualizar)
8. Despacha los 5 bultos
**Resultado esperado:** Ubicación corregida en el sistema, despacho completado
**Variante:** Producto no se encuentra en ninguna ubicación física — se reporta como pérdida

---

## I-029: Conteo de inventario con báscula
**Rol:** Bodeguero
**Duración:** 10 minutos
**Descripción:** Para productos a granel o de peso variable (frijoles, arroz a granel), se usa una báscula para contar por peso en vez de por unidad.
**Precondiciones:** Producto a granel, báscula calibrada y conectada al sistema
**Pasos:**
1. Bodeguero selecciona "Conteo por peso"
2. Conecta báscula al sistema (Bluetooth)
3. Coloca contenedor vacío en báscula — tara: 2kg
4. Agrega producto: Frijoles Rojos Seda a granel
5. Báscula marca: 48.5 kg
6. Sistema calcula: 48.5 kg / 1 lb (0.454 kg) = ~107 unidades
7. Bodeguero registra conteo: 107 unidades
8. Sistema compara con stock teórico: 112 unidades
9. Diferencia: -5 unidades
10. Se ajusta
**Resultado esperado:** Conteo preciso por peso, ajuste registrado, báscula calibrada
**Variante:** Báscula no calibrada da lectura incorrecta; se detecta cuando el peso total no coincide con lo esperado

---

## I-030: Producto con peso variable
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Un cliente compra queso seco (producto de peso variable). Se debe pesar en el momento de la venta y el precio se calcula por peso.
**Precondiciones:** Producto configurado como "peso variable", báscula en mostrador
**Pasos:**
1. Cliente lleva un trozo de queso seco al mostrador
2. Cajero selecciona "Queso seco — peso variable"
3. Coloca el queso en la báscula conectada al sistema
4. Báscula marca: 0.850 kg
5. Sistema calcula: 0.850 kg x C$160/kg = C$136
6. Cajero confirma el peso y precio
7. Se genera etiqueta con peso, precio y código
8. Venta procede normalmente
9. Sistema descuenta del inventario el peso exacto vendido
**Resultado esperado:** Producto pesado, precio calculado por peso, etiqueta impresa, inventario descuenta 0.850 kg
**Variante:** Báscula no funciona; cajero debe pesar en báscula manual e ingresar el peso manualmente

---

## I-031: Producto con lote vencido mezclado con bueno
**Rol:** Bodeguero
**Duración:** 30 minutos
**Descripción:** Durante un conteo físico, el bodeguero descubre que 10 unidades de "Leche Klim 400g" tienen fecha de vencimiento de mayo 2026 mezcladas con 40 unidades con fecha diciembre 2026. El lote vencido no debe venderse.
**Precondiciones:** 50 unidades en stock, mezcla de dos lotes
**Pasos:**
1. Bodeguero detecta 10 unidades vencidas en góndola
2. Separa físicamente las 10 unidades
3. Registra ajuste de inventario: -10, motivo "VENCIDO"
4. Imprime reporte de merma para administrador
5. Las 40 unidades buenas quedan disponibles
**Resultado esperado:** Stock pasa de 50 a 40, movimiento registrado como salida por vencimiento
**Variante:** El proveedor acepta devolución de producto vencido → se registra como "DEVOLUCION_PROVEEDOR" en vez de merma

---

## I-032: Producto robado en bodega (ajuste por pérdida)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se descubre que faltan 3 bultos de Aceite Patrona 1L (18 unidades) del inventario. No hay registro de venta ni movimiento. Se presume robo interno.
**Precondiciones:** Diferencia entre inventario físico y sistema
**Pasos:**
1. Conteo físico muestra 47 unidades, sistema muestra 65
2. Administrador investiga: no hay ventas, movimientos ni ajustes recientes
3. Se confirma pérdida por robo
4. Registra ajuste: -18 unidades, motivo "ROBO"
5. Se guarda evidencia (fotos, acta) en el sistema
6. Se notifica a dueño para decidir acción legal
**Resultado esperado:** Stock se ajusta a 47, movimiento tipo ROBO registrado
**Variante:** El responsable es identificado → el ajuste va contra su salario, no contra inventario
