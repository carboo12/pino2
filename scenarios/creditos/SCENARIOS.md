# Escenarios de Crédito — Pino2 Los Pinos Central

---

## CR-001: Solicitud de crédito para cliente nuevo
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** La Pulpería Los Amigos solicita crédito por primera vez. El administrador debe evaluar la solicitud, revisar referencias y asignar un límite.
**Precondiciones:** Cliente nuevo con 3 meses de operación
**Pasos:**
1. Cliente llena solicitud de crédito (físico o digital)
2. Administrador revisa referencias comerciales
3. Consulta historial en central de riesgo (si aplica)
4. Asigna límite de crédito inicial de C$15,000
5. Configura plazo de pago: 30 días
6. Activa bandera de crédito en el sistema
7. Notifica al cliente que su crédito fue aprobado
**Resultado esperado:** Cliente con límite de crédito C$15,000, plazo 30 días
**Variante:** Solicitud denegada por mal historial → se notifica al cliente con explicación

---

## CR-002: Cliente solicita aumento de límite de crédito
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Cooperativa San Miguel tiene 6 meses pagando puntual con límite actual de C$30,000. Solicita aumento a C$50,000 porque creció su volumen de compra.
**Precondiciones:** Cliente con 6 meses de historial, límite actual C$30,000, pagos puntuales
**Pasos:**
1. Cliente solicita aumento por escrito
2. Administrador revisa historial de pagos (0 atrasos)
3. Revisa volumen de compra último trimestre (promedio C$25,000/mes)
4. Aprueba aumento a C$50,000
5. Actualiza límite en el sistema
6. Notifica al cliente
**Resultado esperado:** Límite actualizado a C$50,000
**Variante:** Cliente con atrasos → aumento denegado, se recomienda reducir plazo

---

## CR-003: Cliente excede su límite de crédito
**Rol:** Vendedor / Administrador
**Duración:** 5 minutos
**Descripción:** El cliente "Licorería El Chele" tiene límite de C$20,000 y ya debe C$18,500. Quiere hacer un pedido de C$5,000. El sistema debe bloquear la transacción.
**Precondiciones:** Cliente con saldo actual C$18,500, límite C$20,000, nuevo pedido C$5,000
**Pasos:**
1. Vendedor intenta crear pedido por C$5,000
2. Sistema calcula: C$18,500 + C$5,000 = C$23,500 > C$20,000
3. Sistema muestra alerta: "Límite de crédito excedido"
4. Vendedor notifica al cliente
5. Opciones: pago parcial del saldo pendiente, o autorización especial del administrador
**Resultado esperado:** Pedido bloqueado, mensaje claro al usuario
**Variante:** Administrador autoriza excepción temporal → se registra autorización

---

## CR-004: Cliente con pago atrasado (30+ días)
**Rol:** Cobrador / Administrador
**Duración:** 10 minutos
**Descripción:** Comedor Santa Ana tiene una factura de C$12,000 con 35 días de vencida. El sistema debe generar alerta y bloquear nuevo crédito.
**Precondiciones:** Factura vencida hace 35 días, saldo C$12,000
**Pasos:**
1. Sistema detecta factura vencida (>30 días)
2. Genera alerta automática en el dashboard del administrador
3. Bloquea ventas a crédito para este cliente
4. Asigna tarea al cobrador para visita de cobro
5. Envía notificación de mora al cliente
6. Si no paga en 7 días, pasa a cobro judicial
**Resultado esperado:** Cliente marcado como moroso, crédito bloqueado, tarea de cobro asignada
**Variante:** Cliente paga después de la alerta → se desbloquea automáticamente

---

## CR-005: Pago anticipado con descuento (pronto pago)
**Rol:** Administrador / Cobrador
**Duración:** 5 minutos
**Descripción:** El cliente Escuela Rubén Darío tiene una factura de C$25,000 a 30 días. Decide pagar a los 5 días para obtener el 5% de descuento por pronto pago.
**Precondiciones:** Factura emitida hace 5 días, total C$25,000, descuento por pronto pago 5%
**Pasos:**
1. Cliente solicita pagar antes del vencimiento
2. Cobrador verifica que aplica descuento por pronto pago
3. Sistema calcula: C$25,000 - 5% = C$23,750
4. Cobrador registra pago por C$23,750
5. Sistema genera nota de crédito por el descuento (C$1,250)
6. Cliente recibe factura cancelada con descuento aplicado
**Resultado esperado:** Pago registrado con descuento, nota de crédito generada
**Variante:** Política de la empresa no permite descuento → se cobra el total

---

## CR-006: Refinanciación de deuda
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Cliente "Pulpería Los Amigos" acumuló C$45,000 en deuda vencida. No puede pagar todo pero quiere ponerse al día. Se acuerda refinanciar a 3 meses.
**Precondiciones:** Deuda vencida C$45,000, cliente solicita acuerdo de pago
**Pasos:**
1. Administrador revisa situación del cliente
2. Acuerda refinanciar: 3 pagos de C$15,000
3. Sistema genera 3 facturas mensuales
4. Cancela la deuda original
5. Crea nuevo plan de pagos
6. Registra el acuerdo en notas del cliente
**Resultado esperado:** Deuda original cancelada, 3 nuevas facturas creadas
**Variante:** Cliente no paga ni el primer refinanciamiento → pasa a cobro judicial

---

## CR-007: Nota de crédito por producto devuelto
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Cliente devuelve 2 bultos de Aceite Patrona porque llegaron dañados. Se genera una nota de crédito por C$960 (C$480 c/u).
**Precondiciones:** Producto dañado recibido por el cliente, factura original emitida
**Pasos:**
1. Cliente reporta producto dañado
2. Rutero recoge el producto y lo devuelve a bodega
3. Administrador verifica el daño
4. Genera nota de crédito por C$960
5. La nota de crédito se aplica al saldo pendiente del cliente
6. El producto dañado se registra como merma
**Resultado esperado:** Nota de crédito emitida, saldo del cliente reducido
**Variante:** Cliente ya pagó la factura → nota de crédito se convierte en saldo a favor

---

## CR-008: Castigo de cuenta incobrable
**Rol:** Administrador / Dueño
**Duración:** 30 minutos
**Descripción:** Después de 6 meses de gestiones de cobro, el cliente "Licorería El Chele" no pagó su deuda de C$12,000 y cerró el negocio. Se autoriza castigo de la cuenta.
**Precondiciones:** Cliente inubicable, deuda C$12,000, más de 180 días de vencida
**Pasos:**
1. Administrador prepara expediente de gestión de cobro
2. Dueño autoriza castigo de la cuenta
3. Sistema marca la deuda como incobrable
4. Genera asiento contable de pérdida
5. Cierra la cuenta del cliente
6. Reporta a central de riesgo
**Resultado esperado:** Cuenta castigada, pérdida registrada contablemente
**Variante:** Cliente reaparece y quiere pagar → se reactiva y cobra con recargo

---

## CR-009: Cliente con deuda en dólares (tipo de cambio)
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Distribuidora "El Colono" tiene una deuda de US$2,500. Al momento del pago, el tipo de cambio pasó de C$36.50 a C$36.62. El cliente quiere pagar al cambio anterior.
**Precondiciones:** Deuda en dólares, tipo de cambio fluctuante
**Pasos:**
1. Cliente quiere pagar US$2,500 al tipo de cambio de la factura (C$36.50 = C$91,250)
2. Sistema usa el tipo de cambio actual (C$36.62 = C$91,550)
3. Diferencia: C$300
4. Administrador decide si aplica cambio histórico o actual
5. Si aplica cambio histórico, se genera nota de crédito por la diferencia
6. Se registra el pago
**Resultado esperado:** Pago registrado, diferencia de cambio documentada
**Variante:** Cliente paga en dólares efectivo → se reciben los US$2,500 y se registra al tipo de cambio del día

---

## CR-010: Reestructuración de deuda grupal (cooperativa)
**Rol:** Administrador
**Duración:** 25 minutos
**Descripción:** La Cooperativa San Miguel agrupa a 15 socios. Cada socio tiene deudas individuales. La cooperativa solicita consolidar todas las deudas en una sola cuenta.
**Precondiciones:** Cliente tipo cooperativa con múltiples socios
**Pasos:**
1. Administrador revisa deudas individuales de los 15 socios
2. Total consolidado: C$128,000
3. Crea nueva cuenta consolidada a nombre de la cooperativa
4. Transfiere saldos individuales a la cuenta consolidada
5. Acuerda nuevo plan de pagos con la cooperativa
6. Las cuentas individuales quedan en cero
**Resultado esperado:** Deuda consolidada en una sola cuenta, plan de pagos único
**Variante:** Un socio se opone a la consolidación → su deuda permanece individual
