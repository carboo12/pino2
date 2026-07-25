# Escenarios Legales y Cumplimiento — Pino2 Los Pinos Central

---

## LG-001: Factura electrónica requerida por DGI
**Rol:** Administrador / Cajero
**Duración:** 10 minutos
**Descripción:** Cliente "Distribuidora El Colono" solicita factura electrónica con RUC para deducir IVA. El sistema debe emitir factura electrónica autorizada por DGI.
**Precondiciones:** Conexión a DGI activa, cliente registrado con RUC
**Pasos:**
1. Cajero registra venta por C$34,500
2. Cliente solicita factura electrónica
3. Cajero selecciona "Factura Electrónica DGI"
4. Sistema envía a DGI en tiempo real
5. DGI responde con número de autorización: 123456789
6. Sistema imprime factura con código QR
7. Se envía copia al correo del cliente
**Resultado esperado:** Factura electrónica emitida con autorización DGI
**Variante:** DGI no responde (sin conexión) → se emite factura contingente con numeración temporal

---

## LG-002: Inspección sorpresa de la DGI
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** Un inspector de la DGI llega sin previo aviso a revisar facturación, inventario y reportes fiscales. Se deben presentar los documentos requeridos.
**Precondiciones:** Sistema operando normalmente, DGI realiza auditoría
**Pasos:**
1. Inspector de DGI llega a la tienda
2. Administrador recibe al inspector
3. Genera reporte de ventas del mes actual
4. Genera reporte de facturación electrónica
5. Muestra el libro de ventas y compras
6. Inspector verifica 10 transacciones al azar
7. Todas las transacciones coinciden con los reportes
8. Inspector firma acta de conformidad
**Resultado esperado:** Auditoría DGI aprobada, acta firmada
**Variante:** Se encuentra una discrepancia → se debe explicar y corregir; posible multa

---

## LG-003: Cliente demanda por producto vencido
**Rol:** Administrador / Dueño
**Duración:** 3 horas
**Descripción:** Un cliente compró Leche Klim 400g que estaba vencida. Su hijo se enfermó. El cliente amenaza con demanda legal. Se debe gestionar el reclamo.
**Precondiciones:** Producto vencido vendido, cliente afectado
**Pasos:**
1. Cliente llega a la tienda con el producto vencido y el recibo
2. Administrador verifica: lote vencido, venta registrada hace 2 días
3. Ofrece disculpas y compensación inmediata
4. Si el cliente acepta, se le reembolsa el producto + C$1,000 de compensación
5. Se registra el incidente en el sistema
6. Se retira todo el lote del inventario
7. Se investiga cómo se vendió un producto vencido
**Resultado esperado:** Cliente compensado, lote retirado, proceso mejorado
**Variante:** Cliente no acepta compensación y presenta demanda → se requiere abogado

---

## LG-004: Producto decomisado por autoridades (ALMA/MINSA)
**Rol:** Administrador / Dueño
**Duración:** 4 horas
**Descripción:** ALMA (Aduana) o MINSA decomisa un lote de productos por falta de registro sanitario o documento de importación. Se deben retirar del inventario.
**Precondiciones:** Producto con documentación incompleta
**Pasos:**
1. Autoridad llega con orden de decomiso
2. Identifica 50 unidades de "Café Presto 200g" sin registro sanitario visible
3. Administrador entrega el producto voluntariamente
4. Registra el decomiso en el sistema: -50 unidades, motivo "DECOMISO"
5. Genera nota de pérdida para contabilidad
6. Contacta al proveedor para reclamar
7. Toma acciones correctivas para evitar recurrencia
**Resultado esperado:** Producto decomisado, pérdida registrada, proveedor notificado
**Variante:** La autoridad impone multa → se paga la multa y se registra como gasto extraordinario

---

## LG-005: Contrato de crédito con cliente
**Rol:** Administrador / Cliente
**Duración:** 30 minutos
**Descripción:** Cliente nuevo "Comedor Santa Ana" solicita crédito. Se debe generar y firmar un contrato de crédito con los términos y condiciones.
**Precondiciones:** Cliente nuevo, solicitud de crédito aprobada
**Pasos:**
1. Administrador prepara contrato de crédito: C$25,000 límite, 30 días plazo, 2% interés moratorio
2. Cliente revisa y firma el contrato
3. Administrador escanea el contrato firmado
4. Adjunta el documento al perfil del cliente en el sistema
5. Activa el crédito del cliente
6. Cliente puede comenzar a comprar a crédito
**Resultado esperado:** Contrato firmado, crédito activado
**Variante:** Cliente no acepta los términos → se negocian condiciones diferentes

---

## LG-006: Embargo judicial de cuentas por cobrar
**Rol:** Administrador / Dueño
**Duración:** 2 horas
**Descripción:** Un juez ordena el embargo de las cuentas por cobrar de un cliente moroso. Se debe retener el pago y notificar al juzgado.
**Precondiciones:** Orden judicial de embargo recibida
**Pasos:**
1. Administrador recibe notificación judicial
2. Identifica al cliente en el sistema
3. Congela la cuenta del cliente (no se pueden hacer pagos)
4. Notifica al cobrador que no debe recibir pagos de este cliente
5. Prepara reporte de saldo pendiente para el juzgado
6. Cuando el juzgado libere el embargo, se reactiva la cuenta
**Resultado esperado:** Cuenta embargada, saldo reportado al juzgado
**Variante:** El cliente paga antes de recibir la orden → se deposita el pago en la cuenta del juzgado
