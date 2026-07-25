# Escenarios de Caja — Pino2 Los Pinos Central

---

## C-001: Apertura de caja normal
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Al iniciar el turno (6:30 AM), el cajero apertura la caja con el fondo inicial asignado. Es la primera acción del día.
**Precondiciones:** Cajero con credenciales activas, fondo asignado por administrador
**Pasos:**
1. Cajero inicia sesión en Pino2 POS
2. Selecciona "Apertura de caja"
3. Sistema solicita conteo del fondo inicial
4. Cajero cuenta: 10 billetes C$100 (C$1,000), 20 billetes C$50 (C$1,000), 20 monedas C$10 (C$200), 50 monedas C$5 (C$250), 200 monedas C$1 (C$200), 50 monedas C$0.50 (C$25), 100 monedas C$0.25 (C$25), misceláneas (C$300)
5. Ingresa denominaciones en el sistema
6. Sistema calcula total: C$5,000
7. Si cuadra con fondo asignado, caja se apertura
8. Sistema registra: "Caja #1 aperturada — 25/07/2026 06:30 — Fondo C$5,000"
9. Caja lista para operar
**Resultado esperado:** Caja aperturada, fondo registrado, turno iniciado
**Variante:** Fondo inicial no coincide (C$4,850 en vez de C$5,000); cajero debe reportar y ajustar antes de aperturar

---

## C-002: Cierre de caja con cuadre exacto
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Al final del turno, el cajero cierra la caja y todo cuadra perfectamente. Es el resultado ideal.
**Precondiciones:** Turno completo, todas las ventas registradas, sin diferencias
**Pasos:**
1. Cajero selecciona "Cierre de caja"
2. Sistema muestra resumen del día:
   - Ventas totales: C$34,250
   - Número de transacciones: 47
   - Efectivo recibido: C$28,500
   - Tarjeta: C$4,000
   - Crédito: C$1,750
3. Cajero cuenta físicamente el efectivo
4. Billetes y monedas totalizan: C$33,500 (C$28,500 ventas + C$5,000 fondo)
5. Ingresa conteo en el sistema
6. Sistema compara: efectivo esperado C$33,500 vs real C$33,500
7. Diferencia: C$0.00
8. Cierre exitoso — sistema muestra "Caja cuadrada exactamente"
9. Se imprime reporte de cierre
**Resultado esperado:** Diferencia C$0, cierre exitoso, reporte impreso
**Variante:** Cajero cree que falta dinero pero es error de conteo; recalcula y descubre que está correcto

---

## C-003: Cierre de caja con diferencia positiva
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Al cerrar, la caja tiene C$150 de más. Sobrante por error (cajero dio menos vuelto de lo debido).
**Precondiciones:** Turno completo, diferencia positiva identificada
**Pasos:**
1. Cajero inicia cierre de caja
2. Sistema espera: efectivo C$33,500 (incluyendo fondo)
3. Cajero cuenta: C$33,650
4. Diferencia: +C$150
5. Sistema marca: "Sobrante de C$150"
6. Cajero investiga transacciones
7. Identifica: posible error de vuelto en venta #235 (C$500 vuelto, debió ser C$650)
8. Registra observación: "Posible error de vuelto — C$150 de más"
9. Administrador revisa y autoriza ajuste
10. Diferencia se registra como "Sobrante — ingreso extraordinario"
**Resultado esperado:** Sobrante registrado, investigación iniciada, C$150 ingresa a caja general
**Variante:** Nadie reclama el sobrante; después de 30 días pasa a resultados de la empresa

---

## C-004: Cierre de caja con diferencia negativa
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** La caja tiene C$200 de menos. Faltante por error (cajero dio más vuelto de lo debido).
**Precondiciones:** Turno completo, diferencia negativa
**Pasos:**
1. Cajero inicia cierre
2. Sistema espera: C$33,500
3. Cajero cuenta: C$33,300
4. Diferencia: -C$200
5. Sistema alerta: "Faltante de C$200"
6. Cajero revisa transacciones
7. Identifica: venta #240 — dio C$500 de vuelto cuando debió ser C$300
8. Reporta el error
9. Administrador registra el incidente
10. C$200 se descuenta de nómina del cajero (según política)
**Resultado esperado:** Faltante identificado, responsable notificado, ajuste registrado
**Variante:** Cajero jura que contó bien; se revisan cámaras de seguridad para confirmar

---

## C-005: Cierre de caja con diferencia que requiere aprobación
**Rol:** Cajero + Administrador
**Duración:** 15 minutos
**Descripción:** La diferencia es de C$850, que excede el límite de C$500 para ajustes automáticos. Se requiere aprobación del administrador.
**Precondiciones:** Diferencia mayor al límite permitido
**Pasos:**
1. Cajero cierra: diferencia -C$850
2. Sistema alerta: "Diferencia excede límite (C$500). Se requiere autorización."
3. Cajero no puede cerrar la caja
4. Llama al administrador
5. Administrador revisa transacciones del día
6. No encuentra una explicación clara
7. Administrador autoriza el cierre con código especial
8. Ingresa su PIN: autorización nivel 3
9. Registra: "Diferencia negativa C$850 — pendiente de investigación"
10. Caja se cierra, se abre caso de investigación
11. Se revisarán cámaras y transacciones al día siguiente
**Resultado esperado:** Cierre autorizado bajo investigación, caso abierto, responsable podría ser identificado después
**Variante:** Cámaras muestran que el cajero metió el dinero en su bolsillo; se procede con despido y denuncia

---

## C-006: Arqueo de caja sorpresa
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** El administrador realiza un arqueo sorpresa a media mañana para verificar que el cajero está manejando el dinero correctamente.
**Precondiciones:** Operación normal en curso, administrador inicia arqueo sin previo aviso
**Pasos:**
1. Administrador llega a la caja: "Arqueo sorpresa, por favor detenga sus operaciones"
2. Cajero imprime reporte de ventas hasta el momento
3. Administrador cuenta físicamente el dinero de la caja
4. Registra denominaciones en hoja de arqueo
5. Compara con lo que el sistema reporta
   - Ventas acumuladas: C$12,300
   - Devoluciones: -C$200
   - Efectivo esperado: C$17,100 (C$12,300 + C$5,000 fondo - C$200)
   - Efectivo real: C$17,100
6. Cuadre exacto
7. Administrador firma hoja de arqueo
8. Cajero reanuda operaciones
9. Se registra: "Arqueo sorpresa — sin novedad"
**Resultado esperado:** Arqueo completado, cuadre exacto, cajero demuestra manejo correcto del efectivo
**Variante:** Diferencia encontrada — cajero no puede explicar; se suspende al cajero y se investiga

---

## C-007: Retiro de efectivo de caja (gasto menor)
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Se necesita retirar C$800 de la caja para comprar café y azúcar para la oficina. Es un gasto menor autorizado.
**Precondiciones:** Autorización del administrador, comprobante de gasto
**Pasos:**
1. Administrador autoriza retiro de C$800
2. Cajero selecciona "Retiro de caja — gasto menor"
3. Ingresa monto: C$800
4. Motivo: "Compra de café y azúcar para oficina"
5. Entrega el efectivo al administrador
6. Sistema descuenta C$800 del efectivo de caja
7. Se imprime comprobante de retiro
8. El dinero retirado no afecta las ventas registradas
9. Caja operativa con C$4,200 menos de efectivo
**Resultado esperado:** Retiro registrado, efectivo reducido, comprobante emitido
**Variante:** Cajero retira dinero sin autorización; se detecta en el arqueo y se reporta como robo

---

## C-008: Ingreso de efectivo a caja
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Se ingresa efectivo adicional a la caja porque se está quedando sin cambio (billetes pequeños) para dar vuelto.
**Precondiciones:** Caja operativa, necesita más efectivo para cambio
**Pasos:**
1. Cajero solicita: "Necesito más cambio, se acabaron los billetes de C$50"
2. Administrador entrega C$2,000 en billetes pequeños
3. Cajero selecciona "Ingreso de efectivo a caja"
4. Ingresa monto: C$2,000
5. Fuente: "Cambio proporcionado por administración"
6. Cajero agrega el efectivo a su caja
7. Sistema suma C$2,000 al saldo de efectivo esperado
8. Cajero continúa operando con cambio suficiente
**Resultado esperado:** Efectivo en caja incrementado, saldo esperado actualizado, operación continúa
**Variante:** Cajero olvida registrar el ingreso; al cierre, aparecerá un sobrante de C$2,000

---

## C-009: Denominaciones incorrectas en caja
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Al iniciar el día, el cajero reporta que las denominaciones del fondo no son las adecuadas (muchos billetes grandes, pocos pequeños).
**Precondiciones:** Fondo inicial asignado, denominaciones inadecuadas para la zona
**Pasos:**
1. Cajero apertura caja y cuenta el fondo
2. Composición: 25 billetes de C$200 (C$5,000) — 100% billetes grandes
3. Reporta: "No tengo billetes pequeños para dar vuelto"
4. Solicita cambio al administrador
5. Administrador cambia 10 billetes de C$200 por:
   - 20 billetes de C$50 (C$1,000)
   - 30 billetes de C$20 (C$600)
   - 50 monedas de C$10 (C$500)
   - 20 monedas de C$5 (C$100)
   - 10 billetes de C$200 restantes (C$2,000)
6. Total: C$5,000 con mejores denominaciones
7. Cajero registra la nueva composición en el sistema
**Resultado esperado:** Fondo recompuesto, denominaciones adecuadas para operar
**Variante:** No hay suficiente cambio en la bóveda; se envía a un empleado al banco a conseguir billetes pequeños

---

## C-010: Billetes falsos en caja
**Rol:** Cajero + Administrador
**Duración:** 15 minutos
**Descripción:** El cajero recibe un billete de C$500 que resulta ser falso. Descubierto al final del día al pasar por el detector de billetes.
**Precondiciones:** Billete falso recibido durante el día, detectado en el arqueo
**Pasos:**
1. Cajero hace arqueo, pasa billetes por detector UV
2. Billete de C$500 no pasa: "FALSO" marca la máquina
3. Cajero reporta inmediatamente al administrador
4. Administrador confirma: billete falso (marca de agua incorrecta, hilo de seguridad ausente)
5. Revisan cámaras de seguridad para identificar al cliente
6. Identifican transacción y cliente (si es posible)
7. Billete falso se incauta y se marca como evidencia
8. Se registra en sistema: "Billete falso C$500 recibido — caso #FAL-2026-01"
9. Se reporta a la Policía Nacional (Dirección de Delitos Económicos)
10. Pérdida de C$500 se registra como pérdida operativa
**Resultado esperado:** Billete falso identificado, reportado a autoridades, pérdida registrada
**Variante:** Cajero detecta el billete falso al momento de recibirlo (detector rápido); rechaza al cliente y reporta inmediatamente

---

## C-011: Faltante por robo en caja
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Durante el arqueo nocturno, se descubre que faltan C$12,000 de la caja fuerte. Evidencia de robo.
**Precondiciones:** Caja fuerte con efectivo, faltante significativo, signos de forcedura
**Pasos:**
1. Administrador abre la caja fuerte para el cierre nocturno
2. Nota que el precinto está roto
3. Cuenta el dinero: faltan C$12,000
4. Revisa cámaras: persona encapuchada a las 3 AM
5. En Pino2, registra: "Robo en caja fuerte — C$12,000"
6. Genera reporte de incidente
7. Llama a la Policía Nacional
8. Notifica al seguro
9. Cambia combinación de la caja fuerte
10. Revisa procedimientos de seguridad
**Resultado esperado:** Robo documentado, autoridades notificadas, reclamo al seguro iniciado
**Variante:** Se descubre que fue un empleado con acceso; se procede con despido y denuncia penal

---

## C-012: Sobrante por error en caja
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** El cajero encuentra C$500 de más en su caja. Probablemente un cliente pagó de más y no reclamó el vuelto.
**Precondiciones:** Cierre de caja muestra sobrante
**Pasos:**
1. Cajero descubre sobrante de C$500 en el arqueo
2. Registra en sistema: "Sobrante C$500 — no reclamado"
3. Administrador revisa transacciones cercanas
4. Encuentra: venta #189 — total C$2,500, cliente pagó con C$3,000 y se fue sin esperar vuelto
5. No hay forma de contactar al cliente
6. Sobrante se registra como "Ingreso extraordinario — sobrante no reclamado"
7. Según política, si el cliente regresa a reclamar dentro de 15 días, se le devuelve
**Resultado esperado:** Sobrante registrado, transacción identificada, espera de reclamo 15 días
**Variante:** Cliente regresa al día siguiente reclamando su vuelto; se verifica, se le devuelve y se ajusta la caja

---

## C-013: Caja chica para gastos menores
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Se establece una caja chica de C$2,000 para gastos menores del día (café, pasajes, artículos de limpieza).
**Precondiciones:** Fondo de caja chica autorizado, administrador designa responsable
**Pasos:**
1. Administrador designa caja chica de C$2,000
2. Responsable: Cajero de turno
3. Se retira C$2,000 de caja general
4. Se registra en sistema: "Apertura de caja chica — C$2,000"
5. Durante el día se hacen gastos:
   - Café y azúcar: C$250
   - Pasajes de mensajero: C$100
   - Escobas y trapeadores: C$450
6. Cada gasto tiene su comprobante
7. Al final del día: gastado C$800, quedan C$1,200
8. Se reporta saldo de caja chica
**Resultado esperado:** Caja chica operativa, gastos registrados, comprobantes respaldan cada gasto
**Variante:** Se perdió un comprobante; no se puede justificar C$150, se descuenta al responsable

---

## C-014: Corte de caja a mitad del día
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Hay cambio de turno al mediodía. El cajero de la mañana hace corte y entrega la caja al cajero de la tarde.
**Precondiciones:** Cambio de turno, dos cajeros involucrados
**Pasos:**
1. Cajero matutino selecciona "Corte parcial — cambio de turno"
2. Sistema calcula ventas de 6:30 AM a 12:00 PM
3. Total ventas: C$18,200
4. Cajero cuenta efectivo: C$23,200 (C$18,200 ventas + C$5,000 fondo)
5. Cuadre exacto
6. Sistema imprime reporte de corte parcial
7. Cajero matutino firma y entrega
8. Cajero vespertino apertura con el mismo fondo de C$5,000
9. Sistema registra cambio de turno
**Resultado esperado:** Corte parcial exitoso, fondo transferido, cambio de turno registrado
**Variante:** Cajero matutino deja C$100 de menos; se registra la diferencia y el cajero vespertino recibe C$4,900 de fondo

---

## C-015: Corte de caja semanal
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Fin de semana, se realiza el cierre semanal que consolida los 7 días de operación. Se prepara reporte para contabilidad.
**Precondiciones:** 7 cortes diarios completados, todas las diferencias cerradas
**Pasos:**
1. Administrador accede a "Cierre semanal"
2. Sistema consolida ventas de la semana:
   - Lunes: C$32,100
   - Martes: C$28,450
   - Miércoles: C$35,200
   - Jueves: C$30,800
   - Viernes: C$42,500
   - Sábado: C$48,300
   - Domingo: C$25,600
   - Total semanal: C$242,950
3. Revisa diferencias de cada día
4. Verifica que todas las diferencias están cerradas
5. Genera reporte semanal
6. Exporta para contabilidad (formato contable)
7. Envía reporte al dueño por correo
**Resultado esperado:** Cierre semanal generado, reporte consolidado, contabilidad actualizada
**Variante:** Un día de la semana no cerró (diferencias sin resolver); el cierre semanal se bloquea hasta resolver

---

## C-016: Conteo de caja con múltiples monedas
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** La caja tiene Córdobas, dólares americanos y monedas fraccionarias. El conteo debe separar por tipo de moneda.
**Precondiciones:** Múltiples monedas en caja, tipo de cambio configurado
**Pasos:**
1. Cajero inicia cierre de caja
2. Cuenta Córdobas: C$28,500
3. Cuenta dólares: USD $250
4. Cuenta monedas fraccionarias: C$32.50 en centavos
5. Ingresa cada tipo en el sistema
6. Sistema convierte dólares a Córdobas:
   USD $250 x C$36.50 = C$9,125
7. Total en Córdobas: C$28,500 + C$9,125 + C$32.50 = C$37,657.50
8. Sistema compara con esperado
9. Verifica conversión
**Resultado esperado:** Conteo multi-moneda, conversión correcta, cierre exitoso
**Variante:** Cajero usa tipo de cambio equivocado (de ayer C$35.80 en vez de hoy C$36.50); el sistema usa el tipo de cambio oficial del día automáticamente

---

## C-017: Apertura de caja sin fondos iniciales
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** El cajero llega a trabajar pero no hay fondo de caja porque el administrador no lo preparó.
**Precondiciones:** Caja sin fondo asignado, cajero necesita operar
**Pasos:**
1. Cajero intenta aperturar caja
2. Sistema: "No hay fondo asignado para esta caja"
3. Cajero reporta al administrador
4. Administrador no preparó la caja (olvido)
5. Administrador busca C$5,000 de la bóveda
6. Asigna fondo a la caja en el sistema: "Fondo extraordinario — C$5,000"
7. Cajero apertura caja normalmente
8. Inicia operaciones 15 minutos tarde
**Resultado esperado:** Caja aperturada con fondo asignado de emergencia, retraso mínimo
**Variante:** No hay efectivo en bóveda; cajero no puede abrir la caja hasta que llegue dinero del banco

---

## C-018: Cierre de caja sin internet
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Se pierde la conexión a internet justo cuando el cajero intenta cerrar la caja. El sistema opera en modo offline.
**Precondiciones:** Ventas del día completadas, internet caído, sistema en modo offline
**Pasos:**
1. Cajero selecciona "Cierre de caja"
2. Sistema detecta: "Sin conexión a internet"
3. Sistema entra en modo offline
4. Cajero cuenta el efectivo normalmente
5. Ingresa conteo en el sistema (funciona localmente)
6. Sistema calcula diferencias localmente
7. Genera comprobante de cierre local
8. Datos quedan almacenados localmente
9. Cuando el internet regrese, los datos se sincronizan automáticamente
10. Cajero cierra la caja físicamente
**Resultado esperado:** Cierre procesado offline, datos pendientes de sincronización, cierre físico completado
**Variante:** Internet no regresa; cajero debe tomar captura de pantalla del cierre y enviar foto al administrador

---

## C-019: Cierre de caja después de facturación electrónica
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Se emitieron facturas electrónicas durante el día. El cierre de caja debe coincidir con el reporte de facturas timbradas del SAT.
**Precondiciones:** Facturas electrónicas emitidas, timbradas por SAT
**Pasos:**
1. Cajero inicia cierre
2. Sistema muestra: "Verificando facturas electrónicas contra SAT"
3. Se comparan todas las facturas emitidas vs timbradas
4. 45 facturas emitidas, 43 timbradas, 2 en cola
5. Sistema alerta: "2 facturas pendientes de timbrar"
6. Cajero no puede cerrar hasta que las facturas se timbren
7. Administrador fuerza el timbrado manual
8. SAT timbra las 2 facturas pendientes
9. Sistema confirma: 45/45 facturas timbradas
10. Cierre procede normalmente
**Resultado esperado:** Cierre completado después de verificar timbrado, todas las facturas electrónicas validadas
**Variante:** SAT no timbra por error en datos (RUC incorrecto); se debe corregir la factura y reenviar

---

## C-020: Voucher de tarjeta pendiente
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Una venta con tarjeta no generó voucher por falla del datáfono. El pago está pendiente de confirmación.
**Precondiciones:** Venta procesada como "tarjeta", sin voucher emitido por falla técnica
**Pasos:**
1. Cajero inicia cierre
2. Sistema muestra: "1 venta con tarjeta sin voucher"
3. Ventas con tarjeta: 15 transacciones
4. 14 tienen voucher, 1 no
5. Cajero revisa: transacción #256 — datáfono no imprimió
6. Cajero contacta al banco (BAC)
7. Banco confirma: transacción aprobada, se puede generar voucher manual
8. Cajero ingresa número de autorización manualmente: "AUTH-48291"
9. Sistema registra el voucher manual
10. Cierre procede
**Resultado esperado:** Voucher manual registrado, cierre completado, transacción bancaria cuadrada
**Variante:** Banco no encuentra la transacción; se debe anular el pago con tarjeta y cobrar de nuevo al cliente

---

## C-021: Diferencia por tipo de cambio
**Rol:** Cajero
**Duración:** 8 minutos
**Descripción:** El tipo de cambio usado durante el día fue C$36.50, pero al cierre el BCN publicó uno nuevo (C$36.70). Hay diferencia en las conversiones de dólares.
**Precondiciones:** Ventas en dólares durante el día, tipo de cambio cambia después del cierre del BCN
**Pasos:**
1. Cajero cierra caja con tipo de cambio del día: C$36.50
2. Ventas en dólares: USD $500 convertidos a C$18,250
3. Al día siguiente, BCN publica nuevo TC: C$36.70
4. Contabilidad detecta diferencia: USD $500 x (C$36.70 - C$36.50) = C$100
5. Se debe ajustar la diferencia cambiaria
6. Administrador registra ajuste: "Diferencia cambiaria — C$100"
7. Se crea cuenta contable de "Diferencia por tipo de cambio"
**Resultado esperado:** Diferencia cambiaria registrada, contabilidad ajustada, pérdida/ganancia por tipo de cambio documentada
**Variante:** Cajero usó tipo de cambio incorrecto durante el día (C$35.00); la diferencia es mayor y requiere ajuste significativo

---

## C-022: Cierre de caja con pagos electrónicos
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Durante el día hubo pagos con diferentes medios electrónicos: tarjeta, transferencia, billetera móvil. Todos deben conciliarse.
**Precondiciones:** Múltiples métodos de pago, todas las transacciones registradas
**Pasos:**
1. Cajero inicia cierre
2. Sistema desglosa pagos por método:
   - Efectivo: C$22,000
   - Tarjeta crédito: C$6,500 (7 transacciones)
   - Tarjeta débito: C$4,200 (5 transacciones)
   - Transferencia: C$3,000 (1 transacción)
   - Billetera móvil (Tigo Money): C$1,500 (3 transacciones)
   - Total: C$37,200
3. Cajero verifica cada resumen:
   - Datáfono: suma C$10,700 — cuadra
   - Estado de cuenta bancario: C$3,000 — pendiente (llegará mañana)
   - App Tigo: C$1,500 — cuadra
4. Marca como conciliado lo verificable
5. Transferencia queda como "pendiente de conciliación bancaria"
**Resultado esperado:** Cierre conciliado, métodos electrónicos verificados, transferencia pendiente de conciliación bancaria
**Variante:** El resumen del datáfono no coincide (C$10,200 vs C$10,700 esperado); se debe investigar cada transacción

---

## C-023: Caja con ingresos en dólares y córdobas
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** Durante el día, la caja recibió pagos tanto en Córdobas como en dólares americanos. El cierre debe separar ambas monedas.
**Precondiciones:** Ventas mixtas (USD y C$), tipo de cambio registrado
**Pasos:**
1. Cajero cuenta el efectivo por moneda:
   - Córdobas: C$25,300
   - Dólares: USD $320
2. Ingresa en sistema:
   - Córdobas: C$25,300
   - Dólares: USD $320
3. Sistema convierte dólares a C$:
   USD $320 x C$36.50 = C$11,680
4. Total efectivo en C$: C$25,300 + C$11,680 = C$36,980
5. Sistema compara con efectivo esperado en C$
6. Si los dólares se recibieron a diferente TC durante el día, puede haber diferencia
7. Diferencia por redenominación se registra separadamente
**Resultado esperado:** Efectivo separado por moneda, conversión aplicada, cierre en Córdobas consistente
**Variante:** Cliente pagó USD $20 pero se registró como C$730 (con TC C$36.50) aunque el billete es de USD $20 = C$730, correcto. Pero USD $20 = C$730 a TC C$36.50 — todo bien.

---

## C-024: Corte de caja con múltiples turnos
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Hubo 3 turnos de cajeros en el día. Se deben consolidar los cortes parciales de cada uno para el cierre diario.
**Precondiciones:** 3 turnos: mañana (6:30-12:00), medio día (12:00-17:00), tarde (17:00-20:00)
**Pasos:**
1. Cajero turno 1: corte parcial 6:30-12:00 — C$18,200 ventas
2. Cajero turno 2: corte parcial 12:00-17:00 — C$14,500 ventas
3. Cajero turno 3: cierre final 17:00-20:00 — C$7,300 ventas
4. Administrador consolida los 3 cortes
5. Sistema suma: C$18,200 + C$14,500 + C$7,300 = C$40,000 total día
6. Verifica que no hay traslapes
7. Cada cajero con su diferencia individual
8. Sistema genera reporte consolidado del día
9. Todas las diferencias se cierran en el corte general
10. Efectivo total coincide con la suma de los 3 turnos
**Resultado esperado:** Corte consolidado, 3 turnos reconciliados, cierre diario generado
**Variante:** Cajero del turno 2 olvidó hacer corte y se fue; se debe hacer corte retrospectivo basado en ventas registradas

---

## C-025: Caja de fin de mes
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** Último día del mes, se realiza el cierre mensual de caja. Se consolida todo el mes y se preparan reportes para contabilidad y dueño.
**Precondiciones:** Fin de mes, todos los cortes diarios completados
**Pasos:**
1. Administrador accede a "Cierre de mes"
2. Sistema consolida 30 días de operación
3. Total ventas del mes: C$1,245,800
4. Desglose por método de pago:
   - Efectivo: C$780,000
   - Tarjeta: C$310,000
   - Crédito: C$120,000
   - Transferencias: C$35,800
5. Total diferencias del mes: C$2,300 en faltantes, C$1,100 en sobrantes
6. Diferencia neta del mes: -C$1,200
7. Sistema genera:
   - Reporte de ventas por día
   - Reporte de métodos de pago
   - Reporte de diferencias
   - Reporte de IVA
   - Reporte de IR
8. Administrador revisa y aprueba
9. Exporta archivos para el contador (Excel, PDF)
10. Envía resumen al dueño por correo
**Resultado esperado:** Cierre de mes completado, reportes generados, contabilidad actualizada, dueño informado
**Variante:** Una semana del mes no cerró por diferencias pendientes; el cierre mensual se bloquea hasta resolver todas las diferencias
