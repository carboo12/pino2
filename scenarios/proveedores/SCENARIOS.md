# Escenarios de Proveedores — Pino2 Los Pinos Central

---

## PV-001: Pedido de compra a proveedor
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** Se agotó el stock de Arroz Faisán 1lb (quedan 12 unidades). Se debe hacer un pedido de compra al proveedor por 500 unidades.
**Precondiciones:** Producto con stock por debajo del mínimo, proveedor configurado
**Pasos:**
1. Sistema alerta: "Stock mínimo alcanzado para Arroz Faisán 1lb (12 unidades)"
2. Administrador revisa el reporte de productos críticos
3. Crea orden de compra: 500 unidades a C$28 c/u (precio de compra)
4. Envía la orden al proveedor (correo/sistema)
5. Proveedor confirma recepción de la orden
6. La orden queda en estado "PENDIENTE_RECEPCION"
**Resultado esperado:** Orden de compra creada y enviada al proveedor
**Variante:** Proveedor rechaza la orden por falta de inventario → se busca otro proveedor

---

## PV-002: Recepción de mercancía con diferencia (contra factura)
**Rol:** Bodeguero
**Duración:** 30 minutos
**Descripción:** Llega la factura del proveedor por 500 unidades de Arroz Faisán. Al contar, solo hay 495 unidades. Faltan 5 unidades.
**Precondiciones:** Orden de compra emitida por 500 unidades, factura del proveedor por 500
**Pasos:**
1. Bodeguero recibe el camión del proveedor
2. Cuenta físicamente los bultos: 41 bultos de 12 unidades = 492 + 3 unidades sueltas = 495
3. Factura del proveedor dice 500 unidades
4. Registra en sistema: recibidas 495, facturadas 500, diferencia -5
5. Sistema genera nota de crédito pendiente por 5 unidades
6. Bodeguero firma la recepción con "recibido conforme con diferencia"
7. Administrador gestiona la nota de crédito con el proveedor
**Resultado esperado:** Recepción registrada con diferencia, nota de crédito pendiente
**Variante:** Sobrante: llegan 505 unidades → se registra como "recibido de más" y se devuelven 5

---

## PV-003: Devolución de producto dañado al proveedor
**Rol:** Bodeguero / Administrador
**Duración:** 20 minutos
**Descripción:** Al recibir un contenedor de Aceite Patrona, se encuentran 3 bultos rotos (18 unidades perdidas). El producto debe devolverse al proveedor.
**Precondiciones:** Producto dañado durante transporte del proveedor
**Pasos:**
1. Bodeguero detecta 3 bultos de Aceite Patrona con fuga de aceite
2. Separa el producto dañado del inventario bueno
3. Registra en sistema: 18 unidades dañadas, motivo "DAÑO_TRANSPORTE"
4. Genera nota de devolución al proveedor
5. El proveedor recoge el producto dañado en la próxima visita
6. Proveedor emite nota de crédito por C$1,530 (18 x C$85)
**Resultado esperado:** Producto dañado devuelto, nota de crédito del proveedor recibida
**Variante:** El proveedor no acepta la devolución → la pérdida se asume como merma

---

## PV-004: Proveedor cambia precio sin previo aviso
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** El proveedor de Café Presto aumentó el precio de compra de C$75 a C$85, pero no notificó. Llega la factura con el nuevo precio. El presupuesto ya estaba aprobado.
**Precondiciones:** Orden de compra emitida a C$75, factura llega a C$85
**Pasos:**
1. Administrador recibe factura del proveedor
2. Detecta diferencia: C$75 vs C$85 (+C$10 por unidad)
3. Contacta al proveedor para reclamar
4. Si el proveedor insiste en el nuevo precio, se debe aprobar la diferencia
5. Actualiza el precio de compra en el sistema
6. Ajusta el precio de venta al público para mantener margen
**Resultado esperado:** Diferencia resuelta, precio actualizado
**Variante:** Se cancela la orden y se busca otro proveedor

---

## PV-005: Pago a proveedor
**Rol:** Administrador / Dueño
**Duración:** 15 minutos
**Descripción:** Fin de mes. Se deben pagar las facturas pendientes a proveedores. Total C$234,000 a 5 proveedores diferentes.
**Precondiciones:** Facturas de proveedores por pagar
**Pasos:**
1. Administrador genera reporte de cuentas por pagar
2. Revisa 5 facturas: total C$234,000
3. Selecciona las facturas a pagar (prioriza las más antiguas)
4. Programa los pagos según fechas de vencimiento
5. Emite cheques/transferencias
6. Registra los pagos en el sistema
7. Marca facturas como "PAGADAS"
**Resultado esperado:** Proveedores pagados, facturas actualizadas
**Variante:** No hay suficiente efectivo → se negocia pago parcial con los proveedores

---

## PV-006: Producto con registro sanitario vencido
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** El Ministerio de Salud (MINSA) notifica que el registro sanitario del producto "Leche Klim 400g" está vencido. No se puede vender hasta renovarlo.
**Precondiciones:** Registro sanitario vencido, producto en inventario
**Pasos:**
1. Administrador recibe notificación de MINSA
2. Verifica el registro sanitario en el sistema
3. Marca el producto como "RETENIDO" (no disponible para venta)
4. Contacta al proveedor para gestionar la renovación
5. El producto se congela en bodega hasta nuevo aviso
6. Una vez renovado, se reactiva en el sistema
**Resultado esperado:** Producto retenido, no vendible hasta renovación
**Variante:** El proveedor no renueva → el producto se devuelve o se destruye
