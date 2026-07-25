# Escenarios de Rutas — Pino2 Los Pinos Central

---

## R-001: Asignación de ruta normal
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Cada mañana se asignan las rutas de entrega a los ruter@s. El sistema optimiza la ruta basado en direcciones y orden de entrega.
**Precondiciones:** Pedidos listos para despacho, vehículos disponibles, ruteros asignados
**Pasos:**
1. Administrador accede a "Planificación de rutas"
2. Sistema muestra pedidos del día: 12 entregas
3. Sistema sugiere 2 rutas:
   - Ruta Norte: 6 entregas (Ciudad Sandino, Mateare)
   - Ruta Sur: 6 entregas (Masaya, Granada)
4. Administrador revisa y ajusta según criterio
5. Asigna Ruta Norte a rutero Pedro
6. Asigna Ruta Sur a rutero Juan
7. Sistema calcula tiempo estimado por ruta
8. Imprime manifiesto de carga para cada ruta
9. Ruteros firman asignación
10. Inician ruta
**Resultado esperado:** Rutas asignadas, optimizadas por ubicación, ruteros con manifiesto
**Variante:** Un rutero llama enfermo; se debe redistribuir su ruta entre los otros ruteros

---

## R-002: Ruta con cliente nuevo
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero tiene un cliente nuevo en su ruta. No conoce la dirección exacta. Debe usar GPS y llamar al cliente para ubicarlo.
**Precondiciones:** Cliente nuevo registrado, dirección puede no ser precisa
**Pasos:**
1. Rutero revisa su ruta: tiene un cliente nuevo "Pulpería El Buen Gusto"
2. Dirección: "Costado sur del mercado de Ciudad Sandino"
3. Rutero usa GPS — no encuentra la dirección exacta
4. Llama al cliente: "Doña Elena, ¿dónde está exactamente su negocio?"
5. Cliente: "Al lado de la farmacia San Miguel, letrero rojo"
6. Rutero encuentra la pulpería
7. Estaciona y descarga: 15 bultos de Arroz
8. Cliente verifica productos
9. Primera entrega exitosa
10. Rutero marca dirección exacta en el GPS para futuras entregas
**Resultado esperado:** Cliente nuevo ubicado, entrega exitosa, georreferencia actualizada
**Variante:** Cliente nuevo dio dirección incorrecta (dijo Ciudad Sandino pero está en otro barrio); rutero no puede entregar y reporta

---

## R-003: Ruta con cliente que no estaba
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero llega a la dirección del cliente pero no hay nadie. El negocio está cerrado. No puede entregar.
**Precondiciones:** Pedido en ruta, cliente ausente, negocio cerrado
**Pasos:**
1. Rutero llega a "Pulpería Los Amigos" — 9:30 AM
2. Persiana bajada, negocio cerrado
3. Rutero espera 10 minutos
4. Llama al cliente: no contesta
5. Llama al administrador: "Cliente no está, ¿qué hago?"
6. Administrador intenta contactar al cliente
7. Sin éxito
8. Rutero marca pedido como "No entregado — cliente ausente"
9. Productos regresan a bodega
10. Se intentará entregar en la próxima ruta
**Resultado esperado:** Pedido marcado como no entregado, cliente ausente, producto regresa a bodega
**Variante:** Cliente llega 5 minutos después de que el rutero se fue; reclama que no le dejaron los productos

---

## R-004: Ruta con cliente que rechaza entrega
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente rechaza la entrega porque dice que los productos están dañados, aunque no lo están. El rutero debe manejar la situación.
**Precondiciones:** Pedido en buen estado, cliente rechaza sin motivo válido
**Pasos:**
1. Rutero llega a "Licorería El Chele"
2. Cliente inspecciona: 20 bultos de Arroz, 10 cajas Aceite
3. Cliente: "No acepto, el arroz se ve viejo"
4. Rutero: "El arroz es del lote de esta semana, está fresco"
5. Cliente insiste: "No lo quiero"
6. Rutero no puede forzar
7. Marca: "Rechazado por cliente — no acepta producto"
8. Cliente no firma
9. Productos regresan
10. Se reporta al administrador para seguimiento
**Resultado esperado:** Rechazo registrado, productos devueltos, cliente notificado para resolver
**Variante:** Cliente rechaza porque encontró mejor precio en otro distribuidor; administrador ofrece descuento para mantener al cliente

---

## R-005: Ruta con producto dañado en transporte
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** Durante el transporte, uno de los bultos se dañó (se rompió una bolsa de arroz). El rutero debe registrar la merma.
**Precondiciones:** Producto dañado durante el trayecto, evidencia del daño
**Pasos:**
1. Rutero nota olor a arroz derramado en el camión
2. Revisa: un bulto de Arroz Faisán tiene una rotura
3. Se han derramado aproximadamente 5 libras
4. Rutero toma foto del daño (evidencia)
5. En la app, selecciona "Producto dañado en ruta"
6. Ingresa: 1 bulto Arroz Faisán, daño parcial (5 lb)
7. Motivo: "Rotura durante transporte — carretera en mal estado"
8. Sistema registra merma en tránsito
9. Las 19 lb restantes del bulto se entregan como unidad suelta
10. Se ajusta el inventario al regresar a bodega
**Resultado esperado:** Merma registrada, evidencia capturada, producto restante entregado
**Variante:** Todo el bulto está inservible (contaminado); se entrega como pérdida total y se reemplaza al cliente

---

## R-006: Ruta con accidente de tránsito
**Rol:** Rutero
**Duración:** 2 horas
**Descripción:** El camión de reparto sufre un accidente leve en la carretera a Masaya. No hay heridos pero hay daños materiales y retraso en la ruta.
**Precondiciones:** Accidente en ruta, no hay heridos, camión dañado
**Pasos:**
1. Rutero choca contra una moto que se atravesó
2. Se detiene, verifica: motociclista está bien (solo golpes)
3. Llama a la policía de tránsito
4. Llama al administrador: "Tuve un accidente en la carretera a Masaya"
5. Reporta: no heridos, camión con golpe en el parachoques
6. Administrador: "¿Puedes continuar?"
7. Policia llega, hace informe
8. Rutero intercambia seguros
9. Camión puede continuar (daño estético)
10. Ruta se reanuda con 1 hora de retraso
11. Administrador contacta a clientes para avisar retraso
**Resultado esperado:** Accidente reportado, seguro intercambiado, ruta reanudada con retraso, clientes notificados
**Variante:** Camión no puede continuar (radiador roto); se envía otro camión a transferir la carga

---

## R-007: Ruta con desvío por carretera en mal estado
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** La carretera principal a Matagalpa está en reparación. El rutero debe tomar un desvío por caminos secundarios.
**Precondiciones:** Carretera en reparación, ruta alternativa disponible
**Pasos:**
1. Rutero llega al desvío: "Carretera en reparación — desvío 5km"
2. Consulta GPS — el desvío agrega 20 minutos
3. Reporta al administrador: "Voy por el desvío de San Ramón"
4. El desvío es camino de tierra (época seca, transitable)
5. Rutero conduce con cuidado (productos frágiles)
6. Llega a Matagalpa 25 minutos más tarde
7. Cliente: "Pensé que no iba a llegar"
8. Entrega exitosa
9. Reporta condición del desvío para futuras rutas
**Resultado esperado:** Ruta alternativa tomada, entrega exitosa con retraso mínimo, condición reportada
**Variante:** Época de invierno — el desvío está embarrado; el camión se atasca y necesita grúa

---

## R-008: Ruta en época lluviosa (invierno)
**Rol:** Rutero
**Duración:** 30 minutos por entrega
**Descripción:** Es invierno en Nicaragua (octubre). Lluvias torrenciales. Las calles están inundadas y el tráfico es lento.
**Precondiciones:** Invierno, calles inundadas, tráfico denso, productos perecederos protegidos
**Pasos:**
1. Rutero comienza ruta a las 7 AM — lluvia intensa
2. Productos perecederos cubiertos con plástico
3. Tráfico lento por inundaciones en Managua
4. Primera entrega: 30 minutos de retraso
5. Cliente: "Con esta lluvia pensé que no venía"
6. Rutero entrega con cuidado, evita que se mojen los productos
7. Cubre la entrada del cliente con plástico
8. Firma digital (pantalla mojada — usar dedo seco)
9. Continúa ruta con precaución
10. Al final del día: 2 horas de retraso acumulado
**Resultado esperado:** Entregas realizadas con retraso, productos protegidos de la lluvia, clientes satisfechos
**Variante:** Una calle está totalmente inundada (no se puede pasar); se reprograma esa entrega para otro día

---

## R-009: Ruta en época seca (verano)
**Rol:** Rutero
**Duración:** 15 minutos por entrega
**Descripción:** Es verano (abril). No llueve, carreteras secas, las rutas son más rápidas. Pero el calor extremo afecta algunos productos.
**Precondiciones:** Verano, altas temperaturas (38°C), productos perecederos sensibles al calor
**Pasos:**
1. Temperatura ambiente: 38°C a las 11 AM
2. Productos perecederos (Leche Klim, chocolate) en cooler
3. Rutero revisa temperatura del cooler: 6°C (aceptable)
4. Rutas más rápidas por buen clima
5. Entrega 1: 5 minutos antes
6. Entrega 2: 10 minutos antes
7. Cada hora revisa temperatura del cooler
8. A las 2 PM, temperatura sube a 10°C — cambia el block de hielo
9. Completa todas las entregas antes de lo previsto
**Resultado esperado:** Rutas eficientes, cadena de frío mantenida, entregas rápidas
**Variante:** Cooler falla y la leche se daña; se declara pérdida y se reemplaza al cliente

---

## R-010: Ruta con múltiples entregas en misma área
**Rol:** Rutero
**Duración:** 30 minutos para 5 entregas
**Descripción:** En un mismo barrio (Barrio San Judas) hay 5 entregas de diferentes clientes. El rutero optimiza el orden a pie.
**Precondiciones:** Múltiples clientes en la misma zona, pedidos livianos
**Pasos:**
1. Rutero llega al Barrio San Judas, Managua
2. Tiene 5 entregas en un radio de 3 cuadras
3. Sistema recomienda orden: calle principal hacia el fondo
4. Rutero estaciona el camión en un punto céntrico
5. Descarga los pedidos en un diablito (carretilla de carga)
6. Entrega 1: Pulpería Doña Mary - 2 bultos
7. Entrega 2: Comedor Santa Ana (sucursal) - 5 bultos
8. Entrega 3: Casa particular - 1 bulto
9. Entrega 4: Iglesia San Judas - 10 bultos
10. Entrega 5: Escuela San Judas - 3 bultos
11. Todas las entregas en 30 minutos
**Resultado esperado:** Entregas eficientes en zona concentrada, ahorro de tiempo y combustible
**Variante:** Una dirección no se encuentra (casa sin número); rutero pregunta a vecinos

---

## R-011: Ruta con devolución de múltiples productos
**Rol:** Rutero
**Duración:** 20 minutos
**Descripción:** Varios clientes en la ruta tienen devoluciones (productos dañados, sobrantes). El rutero debe recogerlos y registrarlos.
**Precondiciones:** Múltiples devoluciones programadas en la ruta
**Pasos:**
1. Rutero tiene 4 devoluciones en su ruta:
   - Cliente A: 2 bultos Frijoles (dañados)
   - Cliente B: 5 unidades Aceite (exceso)
   - Cliente C: 1 bulto Arroz (dañado)
   - Cliente D: 3 Leche Klim (próximas a vencer)
2. En cada parada, después de entregar, procesa la devolución
3. Cliente A: escanea producto, selecciona "Devolución"
4. Registra motivo y emite nota de crédito
5. Carga los productos en el camión (sección de devoluciones)
6. Repite con cada cliente
7. Al final del día: 4 devoluciones registradas y cargadas
8. Al llegar a bodega, entrega devoluciones al bodeguero
**Resultado esperado:** Devoluciones procesadas en ruta, notas de crédito emitidas, productos separados
**Variante:** Una devolución no está autorizada en el sistema; el rutero no puede procesarla, cliente debe ir a la tienda

---

## R-012: Ruta con cobro en efectivo
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero debe cobrar en efectivo a clientes que tienen pedidos "pago contra entrega". Debe registrar cada cobro.
**Precondiciones:** Pedidos con pago contra entrega, rutero tiene cambio
**Pasos:**
1. Rutero revisa su ruta: 3 pedidos requieren cobro en efectivo
2. Cliente 1: C$3,500 — paga con C$4,000, vuelto C$500
3. Rutero registra pago en la app
4. Guarda el efectivo en la caja portátil
5. Cliente 2: C$5,200 — paga exacto
6. Cliente 3: C$2,800 — paga con C$3,000, vuelto C$200
7. Al final del día: C$11,500 cobrados en ruta
8. Al regresar a la tienda, entrega el efectivo al administrador
9. Sistema concilia los cobros del día
**Resultado esperado:** Cobros efectuados en ruta, efectivo registrado, vuelto entregado, conciliación al regresar
**Variante:** Cliente no tiene el pago completo; acepta pagar parcial (C$2,000 de C$3,500) y queda de acuerdo en pagar el resto después

---

## R-013: Ruta con cobro con tarjeta
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero tiene un datáfono móvil para cobrar con tarjeta en ruta. Un cliente quiere pagar con tarjeta de crédito.
**Precondiciones:** Datáfono móvil disponible, conexión móvil para transacción
**Pasos:**
1. Rutero tiene datáfono portátil (inalámbrico)
2. Cliente: "Pago con tarjeta"
3. Total: C$6,500
4. Rutero ingresa monto en datáfono
5. Cliente inserta tarjeta (chip)
6. Datáfono procesa — esperando confirmación
7. Transacción aprobada — voucher se imprime
8. Cliente firma voucher
9. Rutero registra en la app: "Pagado con tarjeta — voucher #48291"
10. Entrega productos
**Resultado esperado:** Cobro con tarjeta procesado en ruta, voucher firmado, transacción registrada
**Variante:** Datáfono no tiene señal en la zona rural; cliente debe pagar en efectivo o se deja pendiente

---

## R-014: Ruta con problemas mecánicos del vehículo
**Rol:** Rutero
**Duración:** 1 hora
**Descripción:** El camión se descompone (sobrecalentamiento) en la carretera a Jinotega. Debe esperar asistencia.
**Precondiciones:** Vehículo con problema mecánico, asistencia en ruta disponible
**Pasos:**
1. Rutero nota que la temperatura del motor sube
2. Se detiene a un lado de la carretera
3. Abre el capó: el radiador está hirviendo
4. Reporta al administrador: "Camión sobrecalentado en la carretera a Jinotega"
5. Administrador contacta al mecánico
6. Mecánico llega en 30 minutos
7. Diagnóstico: manguera del radiador rota
8. Reparación: 20 minutos
9. Rutero reanuda ruta con 1 hora de retraso
10. Clientes notificados del retraso
**Resultado esperado:** Camión reparado, ruta reanudada, retraso gestionado con clientes
**Variante:** Reparación no es posible en ruta; se envía otro camión a transbordar la carga

---

## R-015: Ruta con horario de entrega restringido
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** Un cliente (Escuela Rubén Darío) solo recibe entregas entre 8 AM y 9 AM, antes de que comiencen las clases. El rutero debe ajustar su ruta para llegar a tiempo.
**Precondiciones:** Cliente con horario restringido, ruta debe planificarse alrededor
**Pasos:**
1. La Escuela Rubén Darío solo recibe 8:00-9:00 AM
2. Rutero planifica: esta es su primera entrega del día
3. Sale de la bodega a las 7:00 AM
4. Llega a la escuela a las 7:50 AM
5. Descarga: 10 bultos Arroz, 5 bultos Frijoles, 3 cajas Leche Klim
6. Cliente (directora) verifica productos
7. Firma entrega
8. Termina a las 8:15 AM (dentro del horario)
9. Continúa con las siguientes entregas
**Resultado esperado:** Entrega dentro del horario restringido, cliente satisfecho
**Variante:** Por tráfico, llega a las 9:15 AM; la directora ya no acepta porque están en clases; se reprograma

---

## R-016: Cliente pide adelantar entrega
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** El cliente llama para pedir que le entreguen antes porque tiene una emergencia. Si es posible, el rutero reordena la ruta.
**Precondiciones:** Cliente solicita cambio, ruta flexible, rutero cercano
**Pasos:**
1. Cliente (Pulpería Los Amigos) llama al administrador: "¿Pueden adelantar mi entrega?"
2. Administrador revisa ruta: "El rutero está a 2 cuadras de su negocio"
3. Administrador: "Sí, voy a indicarle que pase primero"
4. Administrador llama al rutero: "Cambia el orden, entrega primero a Pulpería Los Amigos"
5. Rutero confirma cambio
6. Llega a Pulpería Los Amigos
7. Entrega exitosa
8. Continúa con la ruta ajustada
**Resultado esperado:** Entrega adelantada, cliente atendido, ruta reordenada
**Variante:** Adelantar esta entrega retrasa otras entregas programadas con horario fijo; se evalúa si es viable

---

## R-017: Cliente pide atrasar entrega
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** El cliente no está listo para recibir el pedido y pide que le entreguen más tarde. El rutero lo reubica al final de la ruta.
**Precondiciones:** Cliente solicita cambio, rutero puede reordenar
**Pasos:**
1. Rutero llama a cliente "Cooperativa San Miguel": "Voy para allá en 10 minutos"
2. Cliente: "Estoy en una reunión, ¿puede ser después de las 3 PM?"
3. Rutero revisa su ruta: tiene otras entregas después
4. Confirma: "Sí, lo paso a dejar al final de la ruta, como a las 3:30 PM"
5. Reordena la ruta en la app: Cooperativa San Miguel al final
6. Continúa con las otras entregas
7. 3:30 PM: llega a Cooperativa San Miguel
8. Cliente listo, entrega exitosa
**Resultado esperado:** Entrega reprogramada, cliente satisfecho, ruta reordenada
**Variante:** El cliente dice "no sé a qué hora voy a estar" — se deja el pedido pendiente para la próxima ruta

---

## R-018: Orden de entrega incorrecta
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero llega a entregar y descubre que el pedido en el camión no coincide con lo que el cliente espera (productos equivocados).
**Precondiciones:** Error en preparación del pedido, carga incorrecta
**Pasos:**
1. Rutero llega a "Comedor Santa Ana"
2. Manifiesto: 10 bultos Arroz, 5 bultos Frijoles
3. Descarga: encuentra 10 bultos Arroz pero son de otra marca (Fantur vs Faisán)
4. Cliente: "Yo pedí Faisán, no Fantur"
5. Rutero verifica en la app: el pedido dice Faisán
6. Error en bodega: prepararon Fantur en lugar de Faisán
7. Rutero reporta: "Pedido incorrecto — marca equivocada"
8. Cliente no acepta: "No me sirve Fantur"
9. Rutero carga de vuelta los productos incorrectos
10. Reporta a bodega para que preparen el pedido correcto
**Resultado esperado:** Error detectado, productos devueltos, pedido correcto se preparará para próxima ruta
**Variante:** El cliente acepta Fantur si le dan un descuento; rutero llama al administrador para autorizar descuento

---

## R-019: Devolución por cliente equivocado
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** El rutero entrega un pedido a un cliente que no es (dirección similar). Se da cuenta después y debe recuperar los productos.
**Precondiciones:** Error de entrega, productos entregados a persona equivocada
**Pasos:**
1. Rutero llega a "Casa #142, Villa Fontana"
2. Hombre recibe y firma la entrega de 5 bultos Arroz
3. Rutero continúa ruta
4. 30 minutos después, cliente real (Doña María) llama: "¿Dónde está mi pedido?"
5. Rutero verifica: la dirección era "Casa #124, Villa Fontana", no #142
6. Rutero regresa a la casa #142
7. Explica el error: "Entregué en la casa equivocada"
8. El vecino devuelve los productos (buena fe)
9. Rutero carga y lleva a la dirección correcta (#124)
10. Entrega exitosa al cliente real
11. Reporta error en la app: "Dirección leída incorrectamente"
**Resultado esperado:** Productos recuperados, entrega correcta realizada, error reportado
**Variante:** Vecino no quiere devolver los productos (se los quedó); se reporta como pérdida y se denuncia

---

## R-020: Ruta sin conexión (modo offline)
**Rol:** Rutero
**Duración:** Toda la ruta
**Descripción:** El rutero pierde señal de internet en la zona rural (Matagalpa). La app debe funcionar en modo offline.
**Precondiciones:** Zona sin cobertura, app con capacidad offline
**Pasos:**
1. Rutero sale de Managua con conexión normal
2. Al llegar a la carretera a Matagalpa, pierde señal
3. La app entra automáticamente en modo offline
4. Rutero puede ver los pedidos de la ruta (descargados antes)
5. Entrega 1: registra firma del cliente localmente
6. Entrega 2: registra cobro en efectivo localmente
7. Datos se almacenan en el dispositivo
8. Al regresar a zona con cobertura, la app sincroniza automáticamente
9. Todas las entregas se cargan al servidor
10. Sistema confirma sincronización exitosa
**Resultado esperado:** Entregas procesadas offline, datos sincronizados al recuperar conexión
**Variante:** El dispositivo se queda sin batería antes de sincronizar; los datos se pierden y deben ingresarse manualmente

---

## R-021: Ruta con cliente que solicita cambio de producto en entrega
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente recibe su pedido pero pide cambiar 3 bultos de Arroz Faisán por 3 de Frijoles Seda porque "los clientes están pidiendo más frijoles esta semana". El rutero debe procesar el cambio.
**Precondiciones:** Pedido en entrega, cliente solicita modificación, productos disponibles en camión
**Pasos:**
1. Rutero llega a Pulpería Los Amigos en Granada con el pedido
2. Cliente revisa: "Oye, ¿puedo cambiar 3 bultos de Arroz por 3 de Frijoles?"
3. Rutero verifica en su carga: hay 3 bultos de Frijoles Seda disponibles
4. Rutero selecciona "Modificar entrega" en la app
5. Registra: -3 Arroz Faisán, +3 Frijoles Seda
6. Sistema recalcula la factura
7. Cliente paga la diferencia (si aplica) o recibe nota de crédito
8. Rutero descarga los 3 Frijoles y recarga los 3 Arroz
9. Cliente firma la entrega modificada
10. Pedido original se actualiza en el sistema
**Resultado esperado:** Cambio procesado en ruta, factura ajustada, cliente satisfecho
**Variante:** No hay Frijoles en el camión; rutero debe entregar el pedido original sin cambios

---

## R-022: Ruta con recogida de producto para reciclaje
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** La empresa tiene un programa de reciclaje de envases de aceite usados. El rutero debe recoger los envases vacíos de los clientes en su ruta.
**Precondiciones:** Programa de reciclaje activo, clientes participantes identificados
**Pasos:**
1. Rutero tiene en su ruta 4 clientes que participan en el programa de reciclaje
2. Cliente 1 (Pulpería Doña Mary): entrega 20 envases de Aceite Patrona vacíos
3. Rutero escanea los envases con la app (control de reciclaje)
4. Cliente recibe un voucher de descuento por cada envase (C$2 c/u)
5. Rutero carga los envases en la sección de reciclaje del camión
6. Repite con los otros 3 clientes
7. Total del día: 65 envases recogidos
8. Al regresar a bodega, entrega los envases al área de reciclaje
9. Sistema registra los vouchers emitidos a los clientes
10. Reporte de reciclaje generado
**Resultado esperado:** Envases recogidos, clientes reciben descuento, programa de reciclaje registrado
**Variante:** Cliente no tenía los envases limpios; rutero no acepta y explica los requisitos del programa

---

## R-023: Ruta con pago contra entrega y vuelto exacto
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** Cliente paga contra entrega con el monto exacto. El rutero solo debe registrar el pago sin necesidad de dar vuelto.
**Precondiciones:** Pedido marcado como pago contra entrega, monto exacto
**Pasos:**
1. Rutero entrega pedido a Cooperativa San Miguel: C$12,350
2. Cliente: "Aquí tiene, C$12,350 exactos"
3. Rutero cuenta el efectivo: C$12,350 correcto
4. En la app, selecciona "Pago contra entrega" e ingresa monto recibido: C$12,350
5. Sistema marca: vuelto C$0
6. Rutero entrega los productos
7. Cliente firma la entrega
8. Pedido queda como "Pagado y entregado"
9. Rutero guarda el efectivo en la caja portátil
10. Continúa con la siguiente entrega
**Resultado esperado:** Pago registrado, productos entregados, sin necesidad de vuelto
**Variante:** Cliente paga de más (C$13,000); rutero debe calcular y dar vuelto de C$650

---

## R-024: Ruta con entrega parcial (cliente acepta solo parte)
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente acepta solo parte del pedido porque "no le cabe en la bodega". Solicita que el resto se entregue la próxima semana.
**Precondiciones:** Pedido completo en camión, cliente solo recibe parcial
**Pasos:**
1. Rutero llega a Licorería El Chele con 15 bultos de Arroz y 10 cajas de Aceite
2. Cliente: "Recibo solo 10 bultos de Arroz y 5 cajas de Aceite, no me cabe"
3. Rutero: "¿El resto lo dejamos para la próxima entrega?"
4. Cliente: "Sí, la próxima semana"
5. Rutero selecciona "Entrega parcial" en la app
6. Ingresa cantidades entregadas: 10 Arroz, 5 Aceite
7. Sistema genera nota de crédito por los productos no entregados
8. Cliente firma por lo recibido
9. Rutero carga de vuelta los 5 bultos de Arroz y 5 cajas de Aceite
10. Los productos regresan a bodega para próxima entrega
**Resultado esperado:** Entrega parcial registrada, nota de crédito generada, productos devueltos para próxima ruta
**Variante:** Cliente no acepta pagar el flete de la segunda entrega; rutero debe cobrar el flete adicional

---

## R-025: Ruta con cliente que pide factura en el momento de entrega
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** Un cliente que normalmente no pide factura, hoy la solicita en el momento de la entrega porque "el contador se la pidió". El rutero debe emitir la factura desde la app.
**Precondiciones:** Pedido preparado sin factura, cliente solicita factura fiscal
**Pasos:**
1. Rutero llega a Comedor Santa Ana
2. Cliente: "Necesito factura fiscal de esta entrega, mi contador me la pidió"
3. Rutero: "¿Tiene su RUC a la mano?"
4. Cliente da el RUC: J0310000123456
5. Rutero selecciona "Emitir factura" en la app
6. Ingresa datos fiscales del cliente
7. Sistema envía a validación con DGI
8. Factura se genera con timbrado fiscal
9. Rutero entrega factura impresa (impresora portátil)
10. Cliente agradece
**Resultado esperado:** Factura fiscal emitida en ruta, cliente recibe su comprobante
**Variante:** No hay conexión a DGI en la zona; se genera factura contingente con número provisional

---

## R-026: Ruta con entrega a cliente con perro peligroso
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente tiene un perro agresivo suelto en el patio. El rutero debe entregar sin arriesgarse.
**Precondiciones:** Cliente con perro, medidas de seguridad
**Pasos:**
1. Rutero llega a la dirección: Pulpería El Buen Gusto, casa con reja
2. Perro grande suelto en el patio, ladrando agresivamente
3. Rutero no puede entrar
4. Llama al cliente: "Don Javier, el perro está suelto, no puedo entrar"
5. Cliente: "Ah, ya voy"
6. Cliente asegura al perro
7. Rutero ingresa con precaución
8. Entrega los productos: 5 bultos Arroz, 3 cajas Aceite
9. Cliente firma
10. Rutero se retira rápido
**Resultado esperado:** Entrega completada con seguridad, cliente notificado del riesgo
**Variante:** Cliente no contesta el teléfono y el perro no deja entrar; rutero marca como "No entregado — riesgo de seguridad"

---

## R-027: Ruta con cliente que no tiene cambio
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El cliente paga contra entrega pero no tiene cambio para un billete grande. El rutero debe resolver sin quedarse sin cambio.
**Precondiciones:** Pago contra entrega, cliente con billete grande
**Pasos:**
1. Pedido: C$4,500
2. Cliente paga con billete de C$1,000 — necesita dar 5 billetes = C$5,000
3. Rutero: "¿Tiene cambio de C$1,000?"
4. Cliente: "No, solo tengo este billete"
5. Rutero revisa su cartera de cambio: tiene C$500 en billetes pequeños
6. No alcanza para dar vuelto de C$550
7. Rutero sugiere: "¿Puede pagar con dos billetes de C$500 y uno de C$500? O completar con monedas"
8. Cliente busca y encuentra monedas por C$100
9. Cliente paga: 4 billetes de C$1,000 + C$100 en monedas = C$4,100 — faltan C$400
10. Cliente paga C$400 adicionales en efectivo que encontró
**Resultado esperado:** Pago completado, vuelto entregado, cliente y rutero encuentran solución
**Variante:** Cliente no tiene forma de pagar exacto; rutero deja el pedido pendiente y vuelve después de conseguir cambio en otro cliente

---

## R-028: Ruta con bloqueo de carretera por manifestación
**Rol:** Rutero
**Duración:** 30 minutos
**Descripción:** Hay una manifestación política en la carretera a Masaya. El tráfico está totalmente detenido. El rutero debe buscar ruta alternativa o esperar.
**Precondiciones:** Manifestación en ruta, tráfico bloqueado
**Pasos:**
1. Rutero va a Masaya por la carretera principal
2. Encuentra tráfico detenido — manifestación a 500 metros
3. Pregunta a otros conductores: "¿Hace cuánto están aquí?"
4. "Ya va media hora, no se puede pasar"
5. Rutero abre Google Maps: busca ruta alternativa
6. Encuentra desvío por camino de tierra (5 km extra)
7. Reporta al dispatcher: "Manifestación en Masaya, voy por el desvío de Nindirí"
8. Toma el desvío
9. Llega a Masaya 25 minutos después
10. Entregas se realizan con retraso
**Resultado esperado:** Ruta alternativa exitosa, entregas completadas con retraso, dispatcher informado
**Variante:** Todas las rutas alternativas también bloqueadas; rutero espera 2 horas hasta que la manifestación se disuelve

---

## R-029: Ruta con promoción especial para clientes frecuentes
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** El sistema indica que un cliente frecuente califica para una promoción especial. El rutero debe informar al cliente y aplicar el descuento.
**Precondiciones:** Cliente frecuente identificado, promoción activa
**Pasos:**
1. Rutero entrega pedido a Pulpería Doña Mary (cliente frecuente)
2. App muestra notificación: "Cliente frecuente — califica para promoción 5% de descuento"
3. Rutero: "Doña Mary, por ser cliente frecuente, tiene un 5% de descuento en su pedido de hoy"
4. Cliente: "¡Qué bien!"
5. Rutero selecciona "Aplicar descuento por fidelidad"
6. Sistema calcula: C$4,215 - 5% = C$4,004.25
7. Cliente paga el monto con descuento
8. Se emite factura con el descuento aplicado
9. Cliente firma
10. Rutero: "Gracias por su preferencia"
**Resultado esperado:** Descuento aplicado, cliente satisfecho, programa de fidelidad funcionando
**Variante:** Cliente ya tiene otro descuento aplicado; el sistema valida si son acumulables o elige el mayor

---

## R-030: Ruta con entrega express (motocicleta)
**Rol:** Rutero (motociclista)
**Duración:** 15 minutos por entrega
**Descripción:** Un cliente necesita un pedido pequeño urgente (2 bultos de Arroz). Se envía un motociclista para entrega express en vez de esperar al camión.
**Precondiciones:** Pedido pequeño, motociclista disponible, distancia corta
**Pasos:**
1. Dispatcher asigna pedido urgente a motociclista: 2 bultos Arroz, dirección Villa Fontana
2. Motociclista carga los 2 bultos en la parrilla de la moto
3. Sale inmediatamente (10 AM)
4. Llega a Villa Fontana en 12 minutos (vs 40 minutos que tardaría el camión)
5. Cliente: "Qué rápido, gracias"
6. Motociclista entrega el pedido
7. Cliente firma (en app móvil)
8. Motociclista registra la entrega
9. Reporta a dispatcher: "Entrega express completada"
10. Regresa a base para siguiente asignación
**Resultado esperado:** Entrega express rápida, cliente satisfecho, tiempo de entrega reducido
**Variante:** Los 2 bultos no caben en la moto; se envía un segundo viaje o se usa vehículo más grande

---

## R-031: Ruta con cliente que se muda de dirección
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** El rutero llega a la dirección registrada del cliente y descubre que el cliente se mudó. Debe localizar la nueva dirección.
**Precondiciones:** Cliente con dirección desactualizada, pedido en ruta
**Pasos:**
1. Rutero llega a "Ciudad Sandino, casa #142" — no hay negocio
2. Pregunta a vecinos: "¿Qué pasó con la pulpería de aquí?"
3. Vecino: "Doña Marta se mudó a la 5ta calle, al lado de la iglesia"
4. Rutero llama a Doña Marta: "Me dijeron que se mudó. ¿Me da la nueva dirección?"
5. Cliente: "Ah, sí, disculpe, olvidé actualizar. Estoy en la 5ta calle, casa #23"
6. Rutero va a la nueva dirección (5 minutos)
7. Encuentra el negocio
8. Entrega el pedido
9. Cliente firma
10. Rutero actualiza la dirección en el sistema
**Resultado esperado:** Entrega exitosa en nueva dirección, sistema actualizado
**Variante:** Cliente se mudó a otra ciudad (León); rutero no puede entregar — el pedido regresa a bodega

---

## R-032: Ruta con cliente que solicita factura de compras anteriores
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** Durante la entrega, un cliente pide facturas de compras de semanas anteriores que perdió. El rutero debe consultar el sistema y reimprimirlas.
**Precondiciones:** Facturas anteriores existentes en sistema, cliente solicita duplicados
**Pasos:**
1. Cliente: "Perdí las facturas de las últimas 3 entregas, ¿me las puede reimprimir?"
2. Rutero busca al cliente en la app
3. Selecciona "Historial de facturas"
4. Encuentra las últimas 3 facturas: #FAC-1250, #FAC-1260, #FAC-1270
5. Selecciona "Reimprimir"
6. La impresora portátil imprime las 3 facturas
7. Rutero entrega las facturas al cliente
8. Cliente: "Gracias, así le llevo al contador"
9. Rutero: "¿Necesita algo más?"
10. Cliente: "No, gracias"
**Resultado esperado:** Facturas reimpresas, cliente satisfecho, sin costo adicional
**Variante:** Las facturas son electrónicas (ya timbradas); también se reimprimen pero con marca de "Duplicado"

---

## R-033: Ruta con vehículo prestado de otra flota
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** El camión asignado al rutero está en mantenimiento. Debe usar un camión prestado de otra flota (diferente placa, diferente capacidad). Debe actualizar la asignación.
**Precondiciones:** Camión original en taller, camión alternativo disponible
**Pasos:**
1. Rutero llega y le asignan camión #8 (prestado de la flota de León)
2. El camión tiene placa diferente: LE-1234 en vez de MN-5678
3. Rutero registra en la app: "Cambio de vehículo — uso camión #8 placa LE-1234"
4. Verifica capacidad: 3.5 ton — suficiente para su ruta (2.8 ton)
5. Bodegueros cargan el camión
6. Rutero sale con el nuevo vehículo
7. Durante la ruta, el GPS reporta correctamente la ubicación
8. Los clientes no notan la diferencia
9. Al final del día, devuelve el camión #8 a la flota de León
10. Reporta kilometraje y combustible usado
**Resultado esperado:** Ruta completada con vehículo alternativo, asignación temporal registrada
**Variante:** El camión prestado tiene una caja de carga más pequeña; algunos pedidos grandes no caben y deben separarse

---

## R-034: Ruta con entrega de muestras gratis a clientes potenciales
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** La empresa lanzó un producto nuevo (Frijoles Negros Seda) y quiere dejar muestras gratis a clientes potenciales en la ruta. El rutero debe identificar candidatos y registrar la entrega.
**Precondiciones:** Muestras disponibles, clientes potenciales identificados por zona
**Pasos:**
1. Rutero recibe 20 muestras de Frijoles Negros Seda (1 lb cada una)
2. Dispatcher indica: "Deja muestras en pulperías que no compran frijoles con nosotros"
3. En la ruta, identifica 3 pulperías que no son clientes de Los Pinos
4. Pulpería 1: "Le traigo una muestra de nuestros nuevos Frijoles Negros, para que los pruebe"
5. Cliente: "Ah, gracias, los voy a probar"
6. Rutero registra en la app: "Muestra entregada a cliente potencial — Pulpería El Nuevo Amigo"
7. Pulpería 2: mismo proceso
8. Pulpería 3: mismo proceso
9. Al final del día: 3 muestras entregadas
10. Reporta al supervisor para seguimiento de ventas
**Resultado esperado:** Muestras entregadas, clientes potenciales registrados, seguimiento programado
**Variante:** Un cliente se interesa y quiere comprar directamente; rutero toma el pedido de preventa en el momento

---

## R-035: Ruta con cierre de día y devolución de sobrantes
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** Al finalizar la ruta, el rutero regresa a bodega con productos no entregados (clientes ausentes), efectivo cobrado, y devoluciones. Debe cerrar su ruta formalmente.
**Precondiciones:** Ruta completada, todos los pedidos gestionados
**Pasos:**
1. Rutero regresa a bodega a las 5:30 PM
2. Selecciona "Cerrar ruta" en la app
3. Sistema muestra resumen:
   - Pedidos entregados: 10
   - No entregados: 2 (ausentes)
   - Efectivo cobrado: C$28,500
   - Devoluciones recogidas: 3
   - Muestras entregadas: 3
4. Rutero entrega efectivo al administrador: C$28,500
5. Administrador verifica y firma recibo
6. Rutero entrega los productos no entregados al bodeguero
7. Bodeguero escanea y registra devolución de inventario
8. Rutero entrega las devoluciones recogidas
9. Sistema cierra la ruta
10. Rutero firma su hoja de ruta del día
**Resultado esperado:** Ruta cerrada, efectivo entregado, productos devueltos a inventario
**Variante:** Efectivo no cuadra (sobran C$200); se registra como diferencia positiva y se investiga
