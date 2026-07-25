# Escenarios de Cobranza — Pino2 Los Pinos Central

---

## CO-001: Cobrador visita cliente con pago puntual
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** El cobrador visita a un cliente que siempre paga puntual. Hoy llega la fecha de vencimiento y el cliente tiene el pago listo.
**Precondiciones:** Cliente con factura por vencer, historial de pago puntual
**Pasos:**
1. Cobrador revisa su ruta de cobro del día: 12 clientes
2. Visita a Pulpería Los Amigos en Granada — factura #FAC-2026-1234 por C$4,200
3. Cliente: "Don René, aquí tiene su pago, puntual como siempre"
4. Cobrador recibe C$4,200 en efectivo
5. Abre la app de cobranza, busca la factura
6. Selecciona "Registrar cobro"
7. Ingresa monto: C$4,200, método: efectivo
8. Sistema actualiza la factura a "Pagada"
9. Cobrador entrega recibo de pago
10. Cliente archiva el recibo
**Resultado esperado:** Factura pagada, cliente al corriente, recibo entregado
**Variante:** Cliente paga con transferencia (ya la hizo); cobrador verifica en banca móvil antes de registrar

---

## CO-002: Cobrador recibe pago parcial
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente con una factura de C$8,500 solo puede pagar C$5,000. El cobrador debe registrar el pago parcial y actualizar el saldo pendiente.
**Precondiciones:** Factura vencida, cliente ofrece pago parcial
**Pasos:**
1. Cobrador visita Distribuidora Pérez en León
2. Factura #FAC-2026-1240 por C$8,500 — 10 días vencida
3. Cliente: "Don René, solo tengo C$5,000 ahorita, ¿puedo pagar el resto la próxima semana?"
4. Cobrador verifica política de la empresa: pagos parciales permitidos
5. En la app, selecciona "Pago parcial"
6. Ingresa monto: C$5,000
7. Sistema calcula saldo restante: C$3,500
8. Cliente paga C$5,000 en efectivo
9. Factura queda con estatus "Pago parcial — saldo C$3,500"
10. Cobrador: "La próxima semana vengo por el resto"
**Resultado esperado:** Pago parcial registrado, factura actualizada, saldo pendiente registrado
**Variante:** La empresa no acepta pagos parciales; cobrador debe rechazar y exigir el pago completo

---

## CO-003: Cobrador gestiona cliente moroso (30 días)
**Rol:** Cobrador
**Duración:** 15 minutos
**Descripción:** Un cliente tiene 30 días de mora y C$12,000 pendientes. El cobrador debe presionar el cobro y amenazar con suspensión de crédito.
**Precondiciones:** Cliente con 30 días de mora, notificaciones previas enviadas
**Pasos:**
1. Cobrador visita Pulpería El Buen Gusto en Jinotega
2. Sistema muestra: facturas vencidas por C$12,000 (30+ días)
3. Cobrador: "Doña María, ya van 30 días, necesitamos que nos ponga al día"
4. Cliente: "Es que las ventas han estado flojas"
5. Cobrador: "Si no paga esta semana, le vamos a suspender el crédito"
6. Cliente: "No, no me suspenda. Le voy a pagar C$6,000 hoy y el resto la otra semana"
7. Cobrador acepta el pago parcial de C$6,000
8. Registra el cobro en la app
9. Configura recordatorio: "Revisar en 7 días"
10. Cliente firma compromiso de pago
**Resultado esperado:** Pago parcial recibido, compromiso firmado, suspensión evitada temporalmente
**Variante:** Cliente no paga nada; cobrador debe emitir notificación formal de suspensión de crédito

---

## CO-004: Cobrador enfrenta cliente agresivo
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente se pone agresivo cuando el cobrador le exige el pago. El cobrador debe mantener la calma y seguir el protocolo de seguridad.
**Precondiciones:** Cliente moroso, cliente con actitud hostil
**Pasos:**
1. Cobrador llega a Licorería El Chele en Managua
2. Cliente (Don Toño) debe C$22,000 (45 días vencido)
3. Cobrador: "Don Toño, necesitamos que pague los C$22,000"
4. Cliente se altera: "¡Ustedes son unos usureros! ¡No les voy a pagar nada!"
5. Cliente levanta la voz, se acerca agresivamente
6. Cobrador se mantiene calmado, da un paso atrás
7. Cobrador: "Don Toño, no es personal, es negocio. Podemos negociar un plan de pago"
8. Cliente: "¡Fuera de aquí!"
9. Cobrador se retira sin presionar más
10. Reporta en la app: "Cliente agresivo — no se pudo cobrar — escalar a administrador"
**Resultado esperado:** Cobrador seguro, incidente reportado, caso escalado para gestión legal
**Variante:** Cliente amenaza físicamente; cobrador se retira inmediatamente y llama a la policía

---

## CO-005: Cobrador recibe pago con cheque
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente paga su factura de C$18,500 con un cheque de BAC Credomatic. El cobrador debe validar y registrar el cheque.
**Precondiciones:** Cliente autorizado para pago con cheque, chequera válida
**Pasos:**
1. Cliente (Cooperativa San Miguel): "Le pago con cheque"
2. Total a pagar: C$18,500
3. Cobrador verifica datos del cheque: BAC Credomatic, #0042891
4. Fecha: hoy, monto: C$18,500, a nombre de "Los Pinos Central"
5. Cobrador ingresa datos del cheque en la app
6. Sistema valida: cliente en lista blanca de cheques
7. Registra pago como "Cheque — pendiente de cobro"
8. Cobrador entrega recibo con nota: "Pago con cheque sujeto a cobro"
9. Guarda el cheque físicamente en la carpeta de cobranza
10. Al final del día, entrega los cheques al administrador para depósito
**Resultado esperado:** Cheque registrado, factura marcada como "Pagada con cheque pendiente", cheque entregado a administrador
**Variante:** Cheque es de otro banco (Banpro) no aceptado por la empresa; cobrador rechaza y pide efectivo o transferencia

---

## CO-006: Cobrador encuentra negocio cerrado
**Rol:** Cobrador
**Duración:** 5 minutos
**Descripción:** El cobrador viaja 30 minutos para cobrar a un cliente pero encuentra el negocio cerrado. Sin aviso previo.
**Precondiciones:** Cliente programado en ruta, negocio cerrado inesperadamente
**Pasos:**
1. Cobrador llega a Pulpería Doña Mary en Masaya
2. Persiana abajo, no hay nadie
3. Espera 10 minutos por si alguien llega
4. Llama al cliente: teléfono apagado
5. Marca en la app: "Cliente ausente — negocio cerrado"
6. Toma foto del negocio cerrado como evidencia
7. Sistema registra la visita como "Sin éxito — ausente"
8. Cobrador continúa con el siguiente cliente
9. Programa reintento para mañana
10. Reporta al administrador: "Pulpería Doña Mary cerrada sin aviso"
**Resultado esperado:** Visita registrada como infructuosa, reintento programado, administrador notificado
**Variante:** Cliente llega 5 minutos después de que el cobrador se fue; reclama que no le avisaron

---

## CO-007: Cobrador aplica recargo por mora
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente pagó con 15 días de retraso. El sistema debe aplicar el recargo por mora del 2% mensual sobre el saldo.
**Precondiciones:** Factura vencida 15 días, recargo por mora configurado en el sistema
**Pasos:**
1. Factura #FAC-2026-1250 por C$10,000 — vencida 15 días
2. Cliente: "Vengo a pagar los C$10,000"
3. Cobrador: "Don Javier, como tuvo 15 días de retraso, se aplica un recargo del 1% (2% mensual)"
4. Sistema calcula: C$10,000 x 1% = C$100 de recargo
5. Total a pagar: C$10,100
6. Cliente: "Ah, está bien, tiene razón"
7. Paga C$10,100 en efectivo
8. Cobrador registra el pago
9. Factura se cierra con recargo aplicado
10. Se emite recibo detallado con el recargo
**Resultado esperado:** Factura pagada con recargo, cliente informado del cargo, ingreso extra registrado
**Variante:** Cliente se niega a pagar el recargo; cobrador debe explicar la política o escalar al administrador

---

## CO-008: Cobrador recibe pago en dólares
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente paga su factura de C$15,000 con dólares. El cobrador debe calcular el tipo de cambio y registrar el pago en ambas monedas.
**Precondiciones:** Tipo de cambio del día configurado (C$36.50/USD), pago en dólares permitido
**Pasos:**
1. Factura #FAC-2026-1260 por C$15,000
2. Cliente: "Le pago en dólares, ¿a cómo está el cambio?"
3. Cobrador consulta la app: tipo de cambio del día C$36.50/USD
4. Sistema calcula: C$15,000 / C$36.50 = USD $410.96
5. Cliente entrega USD $411
6. Cobrador: "Son USD $411, aquí está el cambio: C$15,001.50 — me debe C$1.50 de vuelto"
7. Cliente: "No importa, quédese con el vuelto"
8. Cobrador registra: pago en USD $411, equivalente a C$15,001.50
9. Factura se cierra y el sobrante de C$1.50 se registra como diferencia positiva
10. Entrega los USD $411 al administrador al final del día
**Resultado esperado:** Pago en dólares registrado, tipo de cambio aplicado, factura cerrada
**Variante:** Tipo de cambio desactualizado (C$35.00 en vez de C$36.50); cobrador debe actualizar antes de procesar

---

## CO-009: Cobrador negocia plan de pagos
**Rol:** Cobrador
**Duración:** 15 minutos
**Descripción:** Un cliente con deuda de C$45,000 (60 días vencido) no puede pagar todo. El cobrador negocia un plan de pagos en 3 cuotas.
**Precondiciones:** Deuda grande, cliente con voluntad de pago pero sin liquidez
**Pasos:**
1. Cobrador visita a Distribuidora Pérez en León
2. Deuda total: C$45,000 — 60 días vencido
3. Cliente: "No tengo C$45,000 ahorita, pero no quiero que me demanden"
4. Cobrador: "Podemos hacer un plan de pagos. ¿Cuánto puede dar ahora?"
5. Cliente: "Puedo dar C$15,000 hoy, C$15,000 en 15 días y C$15,000 en 30 días"
6. Cobrador: "Me parece bien, pero tendrá un recargo del 2% sobre el saldo diferido"
7. En la app, selecciona "Crear plan de pagos"
8. Configura: 3 cuotas de C$15,000 + recargo 2% = C$15,300 cada una
9. Cliente paga primera cuota: C$15,300
10. Cobrador registra el plan y entrega calendario de pagos
**Resultado esperado:** Plan de pagos creado, primera cuota cobrada, cliente con compromiso formal
**Variante:** Cliente falta a la segunda cuota; el plan se cancela y la deuda total se vuelve exigible inmediatamente

---

## CO-010: Cobrador gestiona cobro de cliente fallecido
**Rol:** Cobrador
**Duración:** 20 minutos
**Descripción:** El cobrador se entera que un cliente (Don Miguel, dueño de Comedor Santa Ana) falleció. La deuda es de C$28,500. Debe gestionar el cobro con los familiares.
**Precondiciones:** Cliente fallecido con deuda pendiente, familiares identificados
**Pasos:**
1. Cobrador va a Comedor Santa Ana y encuentra el negocio cerrado
2. Pregunta a vecinos: "Don Miguel falleció la semana pasada"
3. Localiza a la viuda (Doña Ana) en la casa
4. Cobrador: "Doña Ana, lamento la pérdida. Don Miguel tenía una deuda de C$28,500"
5. Doña Ana: "El negocio va a seguir, mi hijo va a hacerse cargo"
6. Cobrador: "Necesitamos saber cómo van a manejar la deuda"
7. Opciones:
   a. La deuda se paga con los activos del negocio
   b. Se transfiere al nuevo dueño (el hijo)
   c. Se condona si no hay activos
8. Hijo (Carlos) llega: "Yo voy a seguir con el negocio, me hago responsable"
9. Cobrador registra cambio de titular: cliente Don Miguel → Carlos Pérez
10. Carlos firma acuerdo de pago de la deuda
**Resultado esperado:** Deuda transferida al nuevo titular, plan de pago acordado, cliente actualizado en sistema
**Variante:** Familia no quiere asumir la deuda; se declara incobrable y se castiga contablemente

---

## CO-011: Cobrador entrega efectivo y cierra jornada
**Rol:** Cobrador
**Duración:** 15 minutos
**Descripción:** Al final del día, el cobrador regresa a la tienda con el efectivo cobrado. Debe entregar el dinero al administrador y cerrar su jornada en el sistema.
**Precondiciones:** Ruta de cobro completada, efectivo y cheques recolectados
**Pasos:**
1. Cobrador regresa a las 5 PM con C$62,300 en efectivo y 2 cheques por C$15,000
2. Se presenta con el administrador
3. En la app, selecciona "Cerrar jornada de cobranza"
4. Sistema muestra resumen del día:
   - Clientes visitados: 12
   - Cobrados: 9
   - No cobrados: 3 (2 ausentes, 1 rechazó)
   - Total cobrado: C$62,300 efectivo + C$15,000 cheques = C$77,300
5. Cobrador cuenta el efectivo frente al administrador
6. Administrador verifica: C$62,300
7. Entrega los 2 cheques por C$15,000
8. Administrador firma recibo de recepción
9. Sistema registra el cierre de jornada
10. Cobrador: "3 pendientes para mañana"
**Resultado esperado:** Efectivo y cheques entregados, jornada cerrada, reporte de cobranza generado
**Variante:** Efectivo no cuadra (faltan C$500); cobrador debe revisar transacciones y encontrar la diferencia

---

## CO-012: Cobrador detecta billete falso en pago
**Rol:** Cobrador
**Duración:** 15 minutos
**Descripción:** Un cliente paga C$5,300 e incluye un billete de C$1,000 sospechoso. El cobrador lo detecta con su plumilla detectora.
**Precondiciones:** Cobrador equipado con detector de billetes falsos
**Pasos:**
1. Cliente paga C$5,300: entrega 5 billetes de C$1,000 + 3 de C$100
2. Cobrador pasa cada billete de C$1,000 por la plumilla detectora
3. Uno de los billetes no reacciona correctamente (marca tinta falsa)
4. Cobrador: "Lo siento, este billete no lo puedo aceptar, parece falso"
5. Cliente: "¿Cómo? Si me lo dieron en el banco"
6. Cobrador: "La plumilla indica que no es auténtico. ¿Tiene otro billete?"
7. Cliente revisa su cartera y encuentra otro billete de C$1,000
8. Cliente reemplaza el billete sospechoso
9. Cobrador verifica el nuevo billete — pasa la prueba
10. Cobrador registra el incidente en la app: "Billete falso detectado y rechazado"
**Resultado esperado:** Billete falso rechazado, pago completado con billete válido, incidente registrado
**Variante:** Cliente no tiene otro billete; paga con tarjeta o con los billetes restantes (C$4,300) y el resto queda pendiente

---

## CO-013: Cobrador recalcula factura por diferencia de precio
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente reclama que en su factura el precio del Aceite Patrona está a C$90 en vez de C$85 que acordó. El cobrador debe verificar y corregir.
**Precondiciones:** Discrepancia de precio en factura, cliente con documentación
**Pasos:**
1. Factura #FAC-2026-1270: 10 cajas Aceite Patrona x C$90 = C$900
2. Cliente: "El precio acordado era C$85, no C$90"
3. Cobrador revisa el pedido original en la app
4. Pedido muestra precio autorizado: C$85 (acuerdo del vendedor)
5. Error: el sistema facturó a precio de lista (C$90) en vez del precio acordado
6. Cobrador: "Tiene razón, fue un error del sistema"
7. En la app, selecciona "Corregir factura" — requiere autorización
8. Cobrador llama al administrador: "Autorice corrección de precio en factura #1270"
9. Administrador autoriza
10. Factura se corrige: 10 x C$85 = C$850, diferencia C$50
**Resultado esperado:** Factura corregida, cliente paga el monto correcto, error de sistema documentado
**Variante:** Administrador no autoriza; cobrador debe escalar a supervisor de cobranza

---

## CO-014: Cobrador enfrenta cliente que se niega a pagar
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Cliente dice que no va a pagar porque "los productos estaban dañados". El cobrador debe verificar y decidir si procede el cobro.
**Precondiciones:** Cliente con reclamo de producto dañado, factura vencida
**Pasos:**
1. Cobrador visita Pulpería Los Amigos
2. Deuda: C$6,800 — 20 días vencida
3. Cliente: "No voy a pagar porque el arroz que me entregaron estaba pasado"
4. Cobrador: "¿Hizo el reclamo en su momento?"
5. Cliente: "Sí, llamé y me dijeron que iban a venir pero nunca vinieron"
6. Cobrador revisa el sistema: no hay reclamo registrado
7. Cobrador: "No encuentro registro de su reclamo. ¿Tiene evidencia?"
8. Cliente muestra fotos del arroz con gorgojos
9. Cobrador: "Voy a escalar su caso, pero necesita pagar mientras se resuelve"
10. Cliente se niega; cobrador registra: "Pago rechazado por reclamo de calidad — escalar a administrador"
**Resultado esperado:** Reclamo registrado, pago pendiente, caso escalado para resolución
**Variante:** El reclamo sí está registrado en el sistema; cobrador procesa una nota de crédito y el cliente paga la diferencia

---

## CO-015: Cobrador recibe pago por transferencia bancaria
**Rol:** Cobrador
**Duración:** 10 minutos
**Descripción:** Un cliente (Cooperativa San Miguel) dice que ya hizo una transferencia bancaria para pagar su factura. El cobrador debe verificar el abono y registrar.
**Precondiciones:** Cliente con acceso a banca en línea, transferencia realizada
**Pasos:**
1. Factura #FAC-2026-1280 por C$25,000
2. Cliente: "Ya hice la transferencia desde Banpro"
3. Cobrador: "¿Me puede mostrar el comprobante?"
4. Cliente muestra el comprobante en su celular: transferencia a cuenta de Los Pinos, C$25,000
5. Cobrador verifica: datos correctos, fecha de hoy
6. Abre la app y selecciona "Verificar transferencia"
7. Ingresa datos de la transferencia: banco Banpro, referencia #TRF-2026-8890
8. Sistema no puede verificar en tiempo real (conexión limitada)
9. Cobrador: "La transferencia se reflejará mañana en nuestra cuenta. Le doy de plazo hasta mañana"
10. Registra como "Pago pendiente de verificación — transferencia Banpro #8890"
**Resultado esperado:** Factura marcada como pendiente por verificación bancaria, cliente con recibo provisional
**Variante:** Transferencia no se refleja en 24 horas; se contacta al cliente y al banco para investigar
