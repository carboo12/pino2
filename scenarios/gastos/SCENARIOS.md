# Escenarios de Gastos y Caja Chica — Pino2 Los Pinos Central

---

## G-001: Registro de gasto de servicios públicos (Luz/Agua)
**Rol:** Administrador de Tienda
**Duración:** 10 minutos
**Descripción:** Se recibe la factura de energía eléctrica del mes por C$ 4,500. Se paga en efectivo de caja chica y se registra el comprobante.
**Precondiciones:** Caja chica abierta con fondos suficientes
**Pasos:**
1. Administrador entra al módulo de Finanzas -> Gastos
2. Selecciona categoría "SERVICIOS_PUBLICOS"
3. Ingresa monto: C$ 4,500.00
4. Agrega descripción: "Pago de recibo Disnorte/Dissur mes julio"
5. Adjunta número de referencia del comprobante
6. Guarda el gasto; el sistema deduce el monto de la disponibilidad de caja chica
**Resultado esperado:** Gasto registrado correctamente y reflejado en el reporte financiero

---

## G-002: Compra de suministros de limpieza y papelería
**Rol:** Cajero / Administrador
**Duración:** 15 minutos
**Descripción:** Se compran detergentes, bolsas plásticas y rollos de papel térmico para la caja registradora por un valor de C$ 1,200.
**Precondiciones:** Comprobante de pago o factura física disponible
**Pasos:**
1. Cajero o administrador abre el registro de egreso rápido
2. Selecciona categoría "SUMINISTROS"
3. Ingresa monto C$ 1,200.00 con método de pago EFECTIVO
4. Registra los ítems comprados en el detalle
5. Sistema emite un comprobante interno de egreso de caja
**Resultado esperado:** Salida de efectivo justificada en arqueo de caja

---

## G-003: Pago de mantenimiento preventivo de vehículo de reparto
**Rol:** Despachador / Administrador
**Duración:** 20 minutos
**Descripción:** El camión Isuzu M 123-456 recibe cambio de aceite y filtro en taller externo. El costo es de C$ 3,800.
**Precondiciones:** Vehículo registrado en la flota
**Pasos:**
1. Administrador ingresa al módulo de Vehículos -> Mantenimiento
2. Selecciona la unidad M 123-456
3. Registra mantenimiento tipo "PREVENTIVE" por C$ 3,800.00
4. Vincula el pago a la categoría de gasto "MANTENIMIENTO_VEHICULO"
5. Actualiza el kilometraje actual del servicio (ej. 45,000 km)
**Resultado esperado:** Mantenimiento registrado y gasto contabilizado en la unidad correspondiente

---

## G-004: Recarga de combustible de la flota
**Rol:** Rutero / Despachador
**Duración:** 10 minutos
**Descripción:** El rutero realiza carga de 40 litros de diésel en la estación Shell por C$ 1,600.
**Precondiciones:** Tarjeta o efectivo asignado para combustible
**Pasos:**
1. Rutero o despachador registra el consumo en el módulo de Flota -> Combustible
2. Ingresa litros (40L), costo por litro (C$ 40) y kilometraje al momento de cargar
3. Sistema registra la transacción en `vehicle_fuel_log` y en egresos de combustible
**Resultado esperado:** Historial de consumo de combustible actualizado y egreso de caja registrado

---

## G-005: Reembolso y reposición de caja chica
**Rol:** Administrador / Dueño
**Duración:** 15 minutos
**Descripción:** La caja chica ha alcanzado su límite mínimo de fondo (quedan C$ 500 de C$ 5,000). Se revisan recibos y se emite reposición por C$ 4,500.
**Precondiciones:** Comprobantes de gastos acumulados
**Pasos:**
1. Administrador ejecuta el reporte de egresos de caja chica
2. Consolida comprobantes físicos contra registros del sistema
3. Verifica que la suma de recibos sea igual al fondo a reponer (C$ 4,500)
4. Emite cheque/transferencia de reposición de la cuenta principal a caja chica
5. Sistema restablece el saldo disponible de caja chica a C$ 5,000
**Resultado esperado:** Caja chica repuesta y cuadre perfecto de comprobantes

---

## G-006: Rechazo de comprobante imprevisto o no autorizado
**Rol:** Dueño / Administrador
**Duración:** 10 minutos
**Descripción:** Se presenta un recibo no justificado por C$ 800 de consumos personales sin factura legal ni autorización previa.
**Precondiciones:** Intento de registro de gasto no justificado
**Pasos:**
1. Administrador o revisor audita la lista de egresos pendientes
2. Identifica el gasto de C$ 800 sin soporte válido
3. Marca el gasto como "RECHAZADO" con nota explicativa
4. El monto no se descuenta de los fondos operativos de la tienda y se cobra al solicitante
**Resultado esperado:** Gasto no autorizado bloqueado y control financiero preservado
