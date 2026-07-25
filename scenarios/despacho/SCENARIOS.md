# Escenarios de Despacho — Pino2 Los Pinos Central

---

## DE-001: Dispatcher asigna rutas del día
**Rol:** Dispatcher
**Duración:** 30 minutos
**Descripción:** El dispatcher llega a las 5:30 AM, revisa los pedidos del día y asigna rutas a los camiones disponibles. Hoy hay 45 pedidos para 4 rutas.
**Precondiciones:** Pedidos listos para despacho, camiones disponibles, ruteros asignados
**Pasos:**
1. Dispatcher inicia sesión en Pino2 — módulo de despacho
2. Revisa tabla de pedidos del día: 45 pedidos en estatus "Listo para despacho"
3. Sistema sugiere 4 rutas optimizadas por ubicación:
   - Ruta A (Managua Norte): 12 pedidos
   - Ruta B (Managua Sur): 11 pedidos
   - Ruta C (Masaya-Granada): 12 pedidos
   - Ruta D (León): 10 pedidos
4. Dispatcher ajusta: mueve 2 pedidos pesados de Ruta A a Ruta C (camión con mayor capacidad)
5. Asigna ruteros: Pedro (A), Juan (B), Carlos (C), Miguel (D)
6. Sistema asigna camiones según capacidad
7. Imprime manifiestos de carga
8. Ruteros reciben asignación y firman
9. Carga de camiones comienza a las 6:30 AM
10. Dispatcher monitorea inicio de salidas
**Resultado esperado:** 4 rutas asignadas, camiones cargados, salidas programadas para las 7 AM
**Variante:** Un rutero llama enfermo; dispatcher debe redistribuir sus 12 pedidos entre los otros 3 ruteros

---

## DE-002: Pedido urgente entra en medio del despacho
**Rol:** Dispatcher
**Duración:** 10 minutos
**Descripción:** A las 8 AM, cuando los camiones ya están cargando, entra un pedido urgente de un cliente importante (Comedor Santa Ana) que necesita entrega hoy.
**Precondiciones:** Pedido urgente registrado, camiones en carga, prioridad del cliente
**Pasos:**
1. Dispatcher recibe alerta: "Pedido urgente — Comedor Santa Ana — 8 bultos Arroz, 3 cajas Aceite"
2. Revisa: camiones ya están cargando
3. Evalúa opciones:
   a. Agregar a ruta existente (si hay espacio)
   b. Envío exprés en moto
   c. Reprogramar para mañana
4. Ruta B (Managua Sur) pasa cerca del Comedor Santa Ana
5. Dispatcher contacta al rutero Juan (Ruta B): "¿Cuánto espacio te queda?"
6. Juan: "Todavía cabe"
7. Dispatcher agrega el pedido urgente a Ruta B
8. Bodeguero carga los productos adicionales
9. Manifiesto se actualiza
10. Juan sale con el pedido incluido
**Resultado esperado:** Pedido urgente agregado a ruta existente, cliente atendido, ruta ajustada
**Variante:** Ningún camión tiene espacio; dispatcher asigna motociclista para entrega exprés con costo adicional

---

## DE-003: Dispatcher gestiona sobrepeso en camión
**Rol:** Dispatcher
**Duración:** 15 minutos
**Descripción:** Al cargar el camión de la Ruta C (Masaya-Granada), el sistema alerta que el peso total excede la capacidad del vehículo (3.5 toneladas).
**Precondiciones:** Carga en proceso, sensor de peso en plataforma, alerta de sobrepeso
**Pasos:**
1. Bodeguero termina de cargar Ruta C
2. Camión pasa por báscula — sistema alerta: "Exceso de peso: 3,850 kg (límite 3,500 kg)"
3. Dispatcher revisa manifiesto de Ruta C: 12 pedidos
4. Identifica pedidos más pesados: 20 bultos Arroz (480kg), 15 bultos Azúcar (360kg)
5. Decide: mover 5 bultos de Arroz (120kg) y 5 bultos de Azúcar (120kg) a Ruta B (tiene espacio)
6. Contacta al rutero Carlos (Ruta C): "Vamos a sacar 10 bultos para aligerar la carga"
7. Descarga los 10 bultos del camión de Carlos
8. Los carga en el camión de Juan (Ruta B)
9. Actualiza manifiestos de ambas rutas
10. Ruta C vuelve a pesar: 3,480 kg — dentro del límite
**Resultado esperado:** Carga redistribuida, camiones dentro del límite de peso, rutas ajustadas
**Variante:** No hay otra ruta con espacio; dispatcher debe dividir en dos viajes o enviar un vehículo adicional

---

## DE-004: Camión sufre avería antes de salir
**Rol:** Dispatcher
**Duración:** 20 minutos
**Descripción:** El camión asignado a Ruta D (León) no enciende. Batería descargada. El dispatcher debe reasignar vehículo rápidamente.
**Precondiciones:** Camión con falla mecánica, ruta programada para salir
**Pasos:**
1. Rutero Miguel intenta encender el camión — no arranca
2. Reporta: "Camión #5 no enciende, batería muerta"
3. Dispatcher evalúa opciones:
   a. Cambiar batería (15 min)
   b. Usar camión de respaldo
   c. Usar otro camión disponible
4. Camión de respaldo (#6) está disponible pero tiene capacidad menor (2.5 ton vs 3.5 ton)
5. Dispatcher verifica: Ruta D tiene 10 pedidos, peso total 2.2 ton — cabe en camión #6
6. Decide: usar camión de respaldo
7. Ordena: "Miguel, usa el camión #6. Vamos a transbordar la carga"
8. Bodegueros transfieren la carga del camión #5 al #6
9. Se actualiza asignación de vehículo en el sistema
10. Miguel sale 20 minutos tarde pero completa la ruta
**Resultado esperado:** Camión de respaldo asignado, carga transferida, ruta completada con retraso mínimo
**Variante:** No hay camión de respaldo; se cambia batería del camión #5 (15 minutos) y sale con retraso

---

## DE-005: Dispatcher rastrea ruta en tiempo real
**Rol:** Dispatcher
**Duración:** Continuo (seguimiento de 10 minutos)
**Descripción:** El dispatcher monitorea las rutas en vivo desde el panel de control. Detecta que Ruta A está detenida en un punto por más de 20 minutos.
**Precondiciones:** GPS activo en camiones, panel de monitoreo en línea
**Pasos:**
1. Dispatcher revisa mapa de rutas en vivo
2. Ruta A (Pedro) en Managua Norte: vehículo detenido 20 minutos en mismo punto
3. Dispatcher llama a Pedro: "¿Qué pasó? Te veo detenido"
4. Pedro: "Hay un accidente en la pista, tráfico totalmente parado"
5. Dispatcher evalúa: "¿Puedes tomar la alternativa por la carretera vieja?"
6. Pedro: "Voy a intentarlo"
7. Dispatcher sugiere reordenar entregas: "Deja la entrega de la 4ta calle para el final, pasa primero a Villa Fontana que está más cerca del desvío"
8. Pedro acepta y ajusta orden
9. Dispatcher actualiza el orden en el sistema
10. Ruta A se reanuda con 15 minutos de retraso
**Resultado esperado:** Ruta monitoreada, desvío y reordenamiento aplicados, retraso minimizado
**Variante:** El accidente bloquea totalmente la única vía; la entrega se reprograma para mañana

---

## DE-006: Dispatcher reprograma entrega por mal clima
**Rol:** Dispatcher
**Duración:** 10 minutos
**Descripción:** Lluvias torrenciales en la carretera a Jinotega. El dispatcher decide cancelar las entregas de esa ruta para proteger a los ruteros y los productos.
**Precondiciones:** Alerta meteorológica, carretera en mal estado por lluvia
**Pasos:**
1. Dispatcher recibe alerta de Protección Civil: "Carretera a Jinotega inundada — no transitar"
2. Ruta a Jinotega (Ruta E) tiene 5 entregas programadas
3. Dispatcher contacta al rutero: "Carlos, no vayas a Jinotega, la carretera está inundada"
4. Carlos: "Está bien, ya iba saliendo"
5. Dispatcher reprograma las 5 entregas para mañana
6. Notifica a cada cliente: "Su entrega se reprograma para mañana por lluvias"
7. Los productos de Ruta E se devuelven a bodega
8. Se registran las entregas como "Reprogramado por clima"
9. Dispatcher reasigna a Carlos a rutas urbanas de Managua que aún no han salido
10. Carlos apoya en entregas urbanas
**Resultado esperado:** Entregas de Jinotega reprogramadas, rutero reasignado, clientes notificados, seguridad priorizada
**Variante:** Lluvia cesa a medio día; dispatcher decide enviar ruta exprés a Jinotega por la tarde

---

## DE-007: Dispatcher recibe notificación de producto dañado en carga
**Rol:** Dispatcher
**Duración:** 10 minutos
**Descripción:** Durante la carga, un bodeguero deja caer un bulto de Aceite Patrona. El dispatcher debe decidir si reemplazar el producto o ajustar la entrega.
**Precondiciones:** Producto dañado durante carga, pedido afectado identificado
**Pasos:**
1. Bodeguero reporta: "Se cayó un bulto de Aceite Patrona, 4 botellas rotas"
2. Dispatcher revisa: el pedido es para Pulpería Los Amigos, incluía 3 cajas
3. Evalúa: ¿Hay producto disponible para reemplazar?
4. Consulta inventario: hay 2 cajas extra de Aceite Patrona
5. Decide: "Reemplaza las 4 botellas rotas del inventario extra"
6. Bodeguero saca 4 unidades del inventario extra y las agrega a la carga
7. Sistema registra: "4 unidades reemplazadas por daño en carga"
8. Las botellas rotas se registran como merma
9. Pedido sale completo
10. Dispatcher anota: "Revisar procedimiento de carga para evitar recurrencia"
**Resultado esperado:** Producto reemplazado, pedido completo, merma registrada
**Variante:** No hay producto de reemplazo; dispatcher notifica al cliente que faltarán 4 unidades y se generará nota de crédito

---

## DE-008: Dispatcher consolida pedidos para optimizar ruta
**Rol:** Dispatcher
**Duración:** 20 minutos
**Descripción:** Hay 3 pedidos pequeños para clientes cercanos en el Barrio San Judas. El dispatcher los consolida en una sola entrega para ahorrar tiempo y combustible.
**Precondiciones:** Múltiples pedidos en la misma zona, clientes aceptan consolidación
**Pasos:**
1. Dispatcher revisa pedidos del día: 3 clientes en Barrio San Judas
   - Cliente A: 2 bultos Arroz (total C$960)
   - Cliente B: 1 bulto Frijoles + 1 caja Aceite (total C$538)
   - Cliente C: 3 bultos Azúcar (total C$1,140)
2. Dispatcher decide consolidar en una sola parada
3. Contacta a los 3 clientes: "Vamos a hacer una sola entrega para los 3, ¿está bien?"
4. Clientes aceptan
5. Dispatcher crea un "Pedido consolidado" en el sistema
6. Los 3 pedidos se agrupan bajo una sola orden de entrega
7. El rutero hará una parada, descargará los 3 pedidos juntos
8. Se reduce tiempo de entrega de 45 min a 15 min
9. Se asigna a Ruta B (Juan)
10. Manifiesto actualizado
**Resultado esperado:** 3 pedidos consolidados, ahorro de tiempo y combustible, clientes satisfechos
**Variante:** Un cliente no acepta la consolidación porque paga contra entrega y no tiene el efectivo hasta más tarde; se mantiene separado

---

## DE-009: Dispatcher gestiona devolución de pedido completo
**Rol:** Dispatcher
**Duración:** 15 minutos
**Descripción:** Un cliente (Cooperativa San Miguel) rechazó un pedido completo de 30 bultos porque dice que el arroz está "muy caro". El camión regresa con la carga.
**Precondiciones:** Pedido rechazado en ruta, camión de vuelta con carga
**Pasos:**
1. Rutero Carlos reporta: "Cooperativa San Miguel rechazó todo el pedido"
2. Dispatcher: "¿Motivo?"
3. Carlos: "Dicen que el arroz está muy caro, encontraron más barato en otro lado"
4. Dispatcher registra en sistema: "Pedido PR-2026-050 — rechazado por cliente"
5. Indica a Carlos que regrese con toda la carga
6. Al llegar a bodega, bodeguero recibe la devolución
7. Dispatcher revisa: ¿se puede reasignar esta carga a otro cliente?
8. Consulta pedidos pendientes: no hay pedidos de esa cantidad de arroz
9. Decide: los productos vuelven a inventario general
10. Se notifica al vendedor para que visite al cliente y resuelva la situación
**Resultado esperado:** Pedido devuelto, productos reintegrados a inventario, vendedor notificado para seguimiento
**Variante:** Otro cliente acepta el pedido rechazado (misma cantidad); dispatcher reasigna la carga directamente a ese cliente

---

## DE-010: Dispatcher enfrenta huelga de transporte
**Rol:** Dispatcher
**Duración:** 1 hora
**Descripción:** Los transportistas anuncian un paro nacional. Los camiones no pueden salir a carretera. El dispatcher debe planificar entregas solo urbanas.
**Precondiciones:** Paro de transporte anunciado, solo rutas urbanas posibles
**Pasos:**
1. Dispatcher llega y encuentra a los ruteros: "Hay paro, no podemos salir a carretera"
2. Evalúa: rutas a Masaya, Granada, León, Jinotega canceladas
3. Solo rutas dentro de Managua son posibles
4. Dispatcher separa pedidos:
   - Managua urbano: 18 pedidos (se pueden entregar)
   - Rutas interdepartamentales: 27 pedidos (cancelados)
5. Reasigna los 3 camiones disponibles solo a rutas urbanas
6. Notifica a clientes de rutas canceladas
7. Los pedidos interdepartamentales se marcan como "Reprogramado por fuerza mayor"
8. Dispatcher organiza 3 rutas urbanas compactas
9. Camiones salen solo a Managua
10. Dispatcher monitorea noticias sobre duración del paro
**Resultado esperado:** Rutas urbanas operativas, rutas interdepartamentales reprogramadas, clientes notificados
**Variante:** Paro se extiende 3 días; dispatcher evalúa contratar transporte alternativo (camiones de alquiler no afiliados al sindicato)

---

## DE-011: Dispatcher coordina entrega nocturna especial
**Rol:** Dispatcher
**Duración:** 15 minutos
**Descripción:** Un cliente grande (Supermercado La Colonia) solo recibe mercancía después de las 10 PM (horario de recepción nocturna). El dispatcher debe coordinar una ruta nocturna especial.
**Precondiciones:** Cliente con horario nocturno, pedido grande programado
**Pasos:**
1. Dispatcher tiene pedido de Supermercado La Colonia: 200 bultos Arroz, 100 cajas Aceite
2. Horario de recepción: 10 PM a 6 AM
3. Dispatcher programa ruta especial nocturna
4. Asigna rutero voluntario (pago de horas extra)
5. Coordina con bodega: carga a las 9 PM
6. Camión sale a las 9:30 PM
7. Dispatcher monitorea por GPS durante la noche
8. Camión llega a La Colonia a las 10:05 PM
9. Cliente recibe y descarga (30 minutos)
10. Rutero regresa a base a las 11 PM
**Resultado esperado:** Entrega nocturna exitosa, cliente recibe en su horario, horas extra registradas
**Variante:** Cliente no está listo a las 10 PM (su descarga nocturna se atrasó); rutero espera 30 minutos

---

## DE-012: Dispatcher maneja urgencia médica de un rutero
**Rol:** Dispatcher
**Duración:** 30 minutos
**Descripción:** Un rutero se siente mal (mareos, dolor de cabeza) en medio de su ruta. El dispatcher debe coordinar su reemplazo o devolución a la tienda.
**Precondiciones:** Rutero con problema de salud, ruta en progreso
**Pasos:**
1. Rutero Juan (Ruta B) llama: "Jefe, me siento muy mal, mareado, no puedo seguir"
2. Dispatcher: "¿Dónde estás?"
3. Juan: "En Villa Fontana, Managua"
4. Dispatcher: "Deja el camión en un lugar seguro y tómate un taxi a la clínica"
5. Dispatcher busca quién puede reemplazar a Juan
6. Pedro (Ruta A) ya terminó su ruta — llama a Pedro: "¿Puedes cubrir las entregas que le faltan a Juan?"
7. Pedro acepta
8. Dispatcher da instrucciones: "Ve a Villa Fontana, toma el camión de Juan y termina sus 4 entregas pendientes"
9. Pedro llega, toma el camión y continúa la ruta
10. Dispatcher reporta el incidente a RH
**Resultado esperado:** Rutero recibe atención médica, ruta completada por reemplazo, incidente reportado
**Variante:** No hay rutero disponible para reemplazar; dispatcher debe recoger él mismo el camión y hacer las entregas

---

## DE-013: Dispatcher recibe queja de cliente por entrega incompleta
**Rol:** Dispatcher
**Duración:** 15 minutos
**Descripción:** Un cliente llama directamente al dispatcher porque su pedido llegó incompleto (faltan 5 bultos de Azúcar). El dispatcher debe resolver.
**Precondiciones:** Pedido incompleto reportado, cliente molesto
**Pasos:**
1. Cliente (Licorería El Chele) llama: "Soy Don Toño, me entregaron 10 bultos de Azúcar pero yo pedí 15"
2. Dispatcher verifica el pedido original: efectivamente 15 bultos
3. Revisa manifiesto del rutero: registró entrega de 15
4. Dispatcher contacta al rutero Carlos (Ruta C): "Don Toño dice que le faltan 5 bultos de Azúcar"
5. Carlos: "Según mi factura, le entregué 15"
6. Dispatcher: "Revisa tu camión, puede que se hayan quedado"
7. Carlos revisa: ¡quedaron 5 bultos olvidados en el camión!
8. Carlos: "Tiene razón, se quedaron en el camión. Voy de regreso"
9. Carlos regresa y entrega los 5 bultos faltantes
10. Dispatcher se disculpa con el cliente
**Resultado esperado:** Productos faltantes entregados, cliente compensado, error del rutero documentado
**Variante:** Los productos fueron entregados a otro cliente por error; dispatcher debe coordinar recuperación

---

## DE-014: Dispatcher cierra el día de despacho
**Rol:** Dispatcher
**Duración:** 20 minutos
**Descripción:** Al final del día, el dispatcher debe cerrar el módulo de despacho, verificar que todos los pedidos fueron entregados o gestionados, y generar reportes.
**Precondiciones:** Todas las rutas completadas o gestionadas, última ruta regresó
**Pasos:**
1. Último camión regresa a las 6 PM
2. Dispatcher selecciona "Cerrar jornada de despacho"
3. Sistema muestra resumen del día:
   - Pedidos programados: 45
   - Entregados: 40
   - No entregados: 3 (ausente)
   - Rechazados: 1
   - Reprogramados: 1 (clima)
4. Dispatcher revisa cada pedido no entregado y confirma gestión
5. Registra novedades del día en el sistema
6. Genera reporte de despacho
7. Reporta a administrador: "Hoy entregamos 40 de 45, 5 pendientes"
8. Los pedidos pendientes pasan automáticamente a la lista de mañana
9. Dispatcher imprime resumen para reunión matutina
10. Cierra sesión
**Resultado esperado:** Jornada cerrada, reporte generado, pedidos pendientes pasan al día siguiente
**Variante:** Hay una diferencia entre pedidos entregados en sistema y los reportados por ruteros; dispatcher debe conciliar

---

## DE-015: Dispatcher planifica rutas para día festivo
**Rol:** Dispatcher
**Duración:** 30 minutos
**Descripción:** Mañana es 1 de mayo (Día del Trabajador) y la mayoría de los negocios estarán cerrados. El dispatcher debe planificar solo las entregas a clientes que confirmaron que abren.
**Precondiciones:** Día festivo conocido, clientes deben confirmar apertura
**Pasos:**
1. Dispatcher revisa pedidos para mañana: 38 programados
2. Pero mañana es 1 de mayo — día feriado
3. Dispatcher contacta a cada cliente: "¿Va a abrir mañana?"
4. 15 clientes confirman que abren
5. 23 clientes estarán cerrados
6. Dispatcher separa los 15 pedidos confirmados
7. Reprograma los 23 para el día siguiente
8. Organiza 2 rutas compactas con los 15 pedidos
9. Asigna solo 2 camiones (menos personal disponible)
10. Notifica a ruteros: "Mañana solo 2 rutas, salida a las 8 AM"
**Resultado esperado:** Rutas de día festivo optimizadas, clientes confirmados atendidos, pedidos de cerrados reprogramados
**Variante:** Un cliente confirma que abre pero al llegar el rutero encuentra el negocio cerrado; se cobra penalidad por reprogramación
