# Escenarios de Vehículos y Flota — Pino2 Los Pinos Central

---

## VH-001: Camión requiere mantenimiento programado
**Rol:** Despachador / Administrador
**Duración:** 1 hora
**Descripción:** El camión Nissan NP300 (placa M 1234) tiene 5,000 km desde el último mantenimiento. El sistema debe alertar y programar el servicio.
**Precondiciones:** Camión registrado, kilometraje tracking activo
**Pasos:**
1. Sistema alerta: "Mantenimiento preventivo vencido para camión M 1234"
2. Despachador programa el servicio con el taller
3. Marca el camión como "NO DISPONIBLE" el día del servicio
4. Reasigna las rutas del camión a otro vehículo
5. Registra el costo del mantenimiento en el sistema
6. Actualiza el próximo kilometraje de mantenimiento
**Resultado esperado:** Camión marcado no disponible, rutas reasignadas, costo registrado
**Variante:** El mantenimiento se atrasa y el camión se daña en ruta → costos mayores

---

## VH-002: Camión sufre avería mecánica en ruta
**Rol:** Rutero / Despachador
**Duración:** 2 horas
**Descripción:** El camión se sobrecalienta en la ruta de Matagalpa. El rutero queda varado con 15 entregas pendientes.
**Precondiciones:** Camión en ruta cliente, avería mecánica
**Pasos:**
1. Rutero reporta: "Camión sobrecalentado, no puede continuar"
2. Despachador recibe la llamada de auxilio
3. Coordina mecánico móvil para reparación en carretera
4. Si la reparación toma más de 2 horas, busca camión de respaldo
5. Prioriza entregas urgentes (hospitales, escuelas)
6. Las entregas no realizadas se reagendan para el día siguiente
7. Registra la incidencia en el sistema
**Resultado esperado:** Avería gestionada, entregas repriorizadas
**Variante:** No hay camión de respaldo → se alquila un camión externo

---

## VH-003: Control de combustible y rendimiento
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Fin de mes, se revisa el consumo de combustible de la flota. El camión M 5678 (Nissan) consumió más de lo esperado: 12 km/galón vs 15 km/galón esperado.
**Precondiciones:** Registro de combustible por vehículo
**Pasos:**
1. Administrador genera reporte de combustible mensual
2. Revisa consumo por vehículo
3. Detecta anomalía: M 5678 consume 12 km/galón vs 15 esperado
4. Investiga: posible fuga, robo o mal uso
5. Si es fuga, programa reparación
6. Si es robo, inicia investigación interna
**Resultado esperado:** Anomalía detectada y acción correctiva tomada
**Variante:** El chofer está usando el camión para uso personal → medida disciplinaria

---

## VH-004: Accidente de tránsito del camión repartidor
**Rol:** Rutero / Administrador
**Duración:** 3 horas
**Descripción:** El camión chocó contra una moto en el Mercado Oriental. Hay daños materiales y el producto se derramó. Se debe reportar el accidente.
**Precondiciones:** Camión involucrado en accidente, productos dañados
**Pasos:**
1. Rutero reporta el accidente inmediatamente
2. Administrador activa el seguro del vehículo
3. Registra el accidente en el sistema
4. Evalúa daños: C$15,000 vehículo, C$3,500 producto
5. Tramita reclamo al seguro
6. Los productos dañados se registran como merma por accidente
7. Programa reparación del camión
8. Asigna vehículo de reemplazo para no interrumpir rutas
**Resultado esperado:** Accidente reportado, seguro tramitado, merma registrada
**Variante:** Hay heridos → se debe reportar a la policía de tránsito y al MINSA

---

## VH-005: Revisión técnica y marchamo
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** Vence la revisión técnica y el marchamo (circulación) de 3 camiones de la flota. Se deben gestionar los pagos y las citas.
**Precondiciones:** Vehículos con documentos por vencer
**Pasos:**
1. Sistema alerta: "Documentos por vencer para 3 camiones"
2. Administrador programa citas para revisión técnica
3. Realiza pagos de marchamo en línea
4. Actualiza fechas de vencimiento en el sistema
5. Los camiones no pueden circular si no tienen documentos al día
6. Si un camión no pasa la revisión, programa reparaciones
**Resultado esperado:** Documentos actualizados, camiones en regla
**Variante:** Un camión no pasa revisión por frenos → se repara y se repite la revisión

---

## VH-006: Asignación de camión a ruta
**Rol:** Despachador
**Duración:** 15 minutos
**Descripción:** Se asigna el camión Nissan NP300 (placa M 1234) a la ruta de Masaya para el día de hoy con 22 entregas programadas.
**Precondiciones:** Camión disponible, ruta configurada con 22 entregas
**Pasos:**
1. Despachador selecciona ruta de Masaya
2. Asigna camión M 1234
3. Sistema verifica capacidad: 22 entregas = 1.5 toneladas, capacidad del camión 2 toneladas ✅
4. Asigna al rutero Carlos Martínez
5. Imprime hoja de ruta y facturas
6. Marca ruta como "LISTA PARA CARGAR"
**Resultado esperado:** Ruta asignada con camión y rutero
**Variante:** Peso excede capacidad → se dividen entregas en dos viajes o se usa camión más grande
