# Escenarios de Supervisión — Pino2 Los Pinos Central

---

## SU-001: Supervisor realiza arqueo sorpresa de caja
**Rol:** Supervisor
**Duración:** 20 minutos
**Descripción:** El supervisor llega sin avisar a media mañana para hacer un arqueo sorpresa a una cajera. Debe contar el efectivo y conciliarlo contra el sistema.
**Precondiciones:** Supervisor con permisos de auditoría, cajera operando normalmente
**Pasos:**
1. Supervisor se acerca a Caja #2 — Cajera María López
2. Supervisor: "María, voy a hacer un arqueo sorpresa"
3. Cajera cierra su lote temporal en el sistema
4. Sistema imprime reporte de caja del turno hasta el momento
5. Cuenta física del efectivo:
   - Billetes y monedas en caja
   - Vouchers de tarjeta
   - Notas de crédito
6. Supervisor ingresa conteo en la app de supervisión
7. Sistema compara: efectivo físico C$14,850 vs sistema C$14,850 — exacto
8. Vouchers de tarjeta: 3 transacciones por C$3,200 — coinciden
9. Supervisor: "Todo en orden, María. Sigue así"
10. Firma el arqueo y lo registra en el sistema
**Resultado esperado:** Arqueo exitoso, caja cuadrada, supervisión documentada
**Variante:** Diferencia de C$200 negativa; supervisor investiga y encuentra que la cajera dio vuelto de más

---

## SU-002: Supervisor revisa rendimiento de ruteros
**Rol:** Supervisor
**Duración:** 30 minutos
**Descripción:** El supervisor revisa los reportes de rutas de la semana para evaluar eficiencia de cada rutero: entregas por hora, combustible usado, kilómetros recorridos.
**Precondiciones:** Reportes de rutas disponibles en sistema, GPS data registrada
**Pasos:**
1. Supervisor accede a "Reportes de rutas" en Pino2
2. Selecciona período: Última semana (7 días)
3. Sistema muestra tabla comparativa de ruteros:
   - Pedro: 8 entregas/día, 12 km/entrega, 15 L combustible/día
   - Juan: 7 entregas/día, 14 km/entrega, 18 L combustible/día
   - Carlos: 9 entregas/día, 10 km/entrega, 13 L combustible/día
4. Supervisor nota: Juan tiene el peor rendimiento (más km y más combustible por entrega)
5. Revisa rutas de Juan: detecta que toma rutas largas por evitar tráfico
6. Supervisor programa reunión con Juan para optimizar rutas
7. Exporta reporte a Excel
8. Envía a administrador con recomendaciones
9. Crea plan de mejora: "Capacitación a Juan en optimización de rutas GPS"
10. Programa seguimiento en 2 semanas
**Resultado esperado:** Reporte de rendimiento analizado, rutero con bajo rendimiento identificado, plan de mejora creado
**Variante:** Todos los ruteros tienen bajo rendimiento; supervisor revisa si el problema es la planificación de rutas (dispatcher)

---

## SU-003: Supervisor atiende queja de cliente por mal servicio
**Rol:** Supervisor
**Duración:** 20 minutos
**Descripción:** Un cliente importante (Cooperativa San Miguel) llama al supervisor para quejarse de que el vendedor no los visitó la semana pasada. El supervisor debe resolver.
**Precondiciones:** Cliente con queja formal, vendedor asignado a la cuenta
**Pasos:**
1. Supervisor recibe llamada: "Soy de Cooperativa San Miguel, Don Freddy no vino la semana pasada y nos quedamos sin inventario"
2. Supervisor: "Lamento el inconveniente, voy a investigar"
3. Revisa el historial de visitas del vendedor Don Freddy
4. Sistema muestra: la última visita fue hace 10 días (cuando debía ser semanal)
5. Supervisor llama a Don Freddy: "¿Por qué no visitaste a Cooperativa San Miguel?"
6. Don Freddy: "Se me pasó, tuve mucha carga esa semana"
7. Supervisor: "Es un cliente importante, no puede fallar"
8. Supervisor coordina: Don Freddy irá mañana a disculparse y tomar pedido urgente
9. Supervisor confirma al cliente: "Mañana Don Freddy estará ahí con una disculpa y su pedido"
10. Registra la queja en el sistema para seguimiento
**Resultado esperado:** Queja atendida, vendedor corregido, cliente satisfecho con la respuesta
**Variante:** El vendedor ha fallado varias veces; supervisor debe emitir llamado de atención formal

---

## SU-004: Supervisor detecta diferencia en inventario durante inspección
**Rol:** Supervisor
**Duración:** 30 minutos
**Descripción:** Durante una inspección de rutina en bodega, el supervisor encuentra que el inventario físico de Aceite Patrona no coincide con el sistema (diferencia de 10 cajas).
**Precondiciones:** Inspección programada, supervisor con acceso a inventario
**Pasos:**
1. Supervisor llega a bodega para inspección de rutina
2. Solicita conteo rápido de Aceite Patrona
3. Bodeguero cuenta: 45 cajas físicas
4. Supervisor consulta sistema: debe haber 55 cajas
5. Diferencia: -10 cajas (faltan)
6. Supervisor: "¿A qué se debe esta diferencia?"
7. Bodeguero no sabe
8. Supervisor revisa movimientos recientes:
   - Se vendieron 20 cajas (correcto)
   - Se transfirieron 5 a Norte (correcto)
   - Pero hay un ajuste de -10 sin motivo registrado
9. Supervisor investiga: el ajuste lo hizo el bodeguero nocturno sin autorización
10. Supervisor: "Esto es grave. Vamos a revisar cámaras"
**Resultado esperado:** Diferencia detectada, ajuste no autorizado identificado, investigación iniciada
**Variante:** Las cámaras muestran que el bodeguero nocturno cargó 10 cajas a su vehículo personal; se procede a despido y denuncia

---

## SU-005: Supervisor capacita a nuevo empleado en Pino2
**Rol:** Supervisor
**Duración:** 1 hora
**Descripción:** Llega un cajero nuevo (Carlos). El supervisor debe capacitarlo en el uso del POS, creación de clientes, y manejo de efectivo.
**Precondiciones:** Nuevo empleado contratado, sistema configurado con usuario de prueba
**Pasos:**
1. Supervisor lleva a Carlos a la sala de capacitación
2. Explica el sistema Pino2: módulos principales
3. Crea un usuario de prueba "ccarlos_training"
4. Muestra cómo iniciar sesión y abrir caja
5. Práctica 1: Escanear productos y procesar venta (5 ventas simuladas)
6. Práctica 2: Manejar devolución (con producto de prueba)
7. Práctica 3: Aplicar descuento y precio especial
8. Práctica 4: Cerrar caja y cuadrar
9. Práctica 5: Crear cliente nuevo en el sistema
10. Supervisor evalúa y aprueba: "Listo para operar con supervisión la primera semana"
**Resultado esperado:** Nuevo empleado capacitado, prácticas completadas, listo para trabajar
**Variante:** Carlos tiene dificultad con el módulo de devoluciones; supervisor programa refuerzo al día siguiente

---

## SU-006: Supervisor revisa reportes de ventas semanales
**Rol:** Supervisor
**Duración:** 20 minutos
**Descripción:** Fin de semana, el supervisor revisa los reportes de ventas para identificar tendencias, productos más vendidos y oportunidades de mejora.
**Precondiciones:** Semana cerrada, datos de ventas disponibles
**Pasos:**
1. Supervisor accede a "Reportes de ventas semanales"
2. Selecciona semana: 19/07/2026 al 25/07/2026
3. Sistema muestra dashboard:
   - Ventas totales: C$287,500
   - Transacciones: 1,245
   - Ticket promedio: C$231
   - Producto más vendido: Arroz Faisán (320 unidades)
   - Producto menos vendido: Jabón Rey (12 unidades)
4. Supervisor analiza: ticket promedio bajo (C$231)
5. Identifica oportunidad: aumentar venta cruzada (sugerir complementos)
6. Compara con semana anterior: ventas subieron 5%
7. Exporta reporte para reunión semanal
8. Prepara presentación para el equipo: "Logros y áreas de mejora"
9. Destaca a la cajera María: mayor ticket promedio (C$350)
10. Sube reporte al drive compartido
**Resultado esperado:** Reporte semanal analizado, insights identificados, presentación preparada
**Variante:** Ventas bajaron 10% vs semana anterior; supervisor investiga si hubo quiebre de stock o promociones no activas

---

## SU-007: Supervisor media conflicto entre empleados
**Rol:** Supervisor
**Duración:** 20 minutos
**Descripción:** Un bodeguero y un rutero tienen un conflicto porque el rutero acusa al bodeguero de preparar mal los pedidos. El supervisor debe mediar.
**Precondiciones:** Conflicto entre empleados reportado
**Pasos:**
1. Bodeguero (Luis) y rutero (Pedro) llegan donde el supervisor discutiendo
2. Pedro: "Luis preparó mal mi ruta, faltaban 3 bultos en 3 entregas diferentes"
3. Luis: "Yo preparé todo bien, el que no revisa es él antes de salir"
4. Supervisor escucha a ambos
5. Revisa el historial de pedidos de la semana
6. Encuentra: 2 reclamos por pedidos incompletos en la ruta de Pedro
7. Pero también: Luis tiene 1 error de preparación registrado
8. Supervisor: "Ambos tienen parte de razón. Pedro, debes revisar antes de salir. Luis, debes ser más cuidadoso"
9. Propone solución: "Vamos a implementar un check list de verificación conjunta antes de cada salida"
10. Ambos aceptan y firman acuerdo de mejora
**Resultado esperado:** Conflicto resuelto, ambos responsables de mejora, nuevo proceso implementado
**Variante:** El conflicto es más grave (insultos); supervisor aplica llamado de atención por escrito a ambos

---

## SU-008: Supervisor verifica cumplimiento de horarios
**Rol:** Supervisor
**Duración:** 15 minutos
**Descripción:** El supervisor revisa los registros de entrada y salida de la semana. Detecta que un cajero ha llegado tarde 3 veces en la semana.
**Precondiciones:** Sistema de marcaje de horarios activo, registros disponibles
**Pasos:**
1. Supervisor accede a "Reporte de asistencia semanal"
2. Sistema muestra tabla de todos los empleados
3. Identifica: Cajero José Pérez ha llegado tarde:
   - Lunes: 8:15 AM (15 min tarde)
   - Miércoles: 8:20 AM (20 min tarde)
   - Viernes: 8:10 AM (10 min tarde)
4. José debe entrar a las 7:30 AM (apertura de caja)
5. Supervisor cita a José para conversar
6. José: "Es que el bus me deja mal, estoy teniendo problemas de transporte"
7. Supervisor: "Necesitas buscar una solución. Si continúa, tendré que descontar de tu salario"
8. José propone: "Puedo venirme en la bici, me ahorro tiempo"
9. Supervisor: "De acuerdo, te doy una semana para regularizar"
10. Registra la conversación en el sistema
**Resultado esperado:** Empleado con retrasos identificado, advertencia verbal, plan de mejora acordado
**Variante:** José sigue llegando tarde; supervisor aplica descuento salarial según política de la empresa

---

## SU-009: Supervisor implementa nueva política de precios
**Rol:** Supervisor
**Duración:** 30 minutos
**Descripción:** La gerencia decide aumentar el precio del Arroz Faisán de C$32 a C$34 (6.25% de aumento). El supervisor debe actualizar los precios en el sistema y comunicar al equipo.
**Precondiciones:** Autorización de gerencia para cambio de precio, nueva lista de precios
**Pasos:**
1. Supervisor recibe correo de gerencia: "Nuevos precios desde el 01/08/2026"
2. Arroz Faisán 1lb: C$32 → C$34
3. Supervisor accede a "Gestión de precios" en Pino2
4. Busca producto: "Arroz Faisán 1lb"
5. Ingresa nuevo precio: C$34
6. Fecha efectiva: 01/08/2026
7. Sistema programa el cambio automático a la medianoche del 31/07
8. Supervisor agrega motivo: "Ajuste por incremento de costo de proveedor"
9. Comunica al equipo de ventas: "A partir del lunes, el Arroz Faisán sube a C$34"
10. Prepara volantes informativos para clientes
**Resultado esperado:** Precio actualizado en sistema con fecha efectiva, equipo informado, clientes notificados
**Variante:** Sistema no permite precios futuros (solo cambio inmediato); supervisor debe hacer el cambio manual el 01/08 a las 6 AM

---

## SU-010: Supervisor gestiona emergencia por robo en tienda
**Rol:** Supervisor
**Duración:** 1 hora
**Descripción:** Durante la madrugada, alguien forzó la puerta trasera de la tienda. El supervisor es llamado para gestionar la emergencia.
**Precondiciones:** Alarma de seguridad activada, supervisor de turno
**Pasos:**
1. Supervisor recibe llamada a las 3 AM: alarma de la tienda activada
2. Llega a la tienda en 20 minutos
3. Policía ya está en el lugar: puerta trasera forzada
4. Supervisor abre la tienda para que la policía inspeccione
5. Se llevaron: 20 cajas de Aceite Patrona, C$5,000 de caja chica
6. Supervisor documenta todo con fotos
7. Reporta en el sistema: "Robo — inventario afectado"
8. Realiza ajuste de inventario de las 20 cajas (motivo: robo)
9. Notifica al administrador y al dueño
10. Coordina con técnico para reparar la puerta y mejorar seguridad
**Resultado esperado:** Robo documentado, inventario ajustado, autoridades notificadas, medidas correctivas iniciadas
**Variante:** El responsable es un empleado con acceso; supervisor revisa cámaras y encuentra evidencia para proceder legalmente

---

## SU-011: Supervisor realiza evaluación de desempeño mensual
**Rol:** Supervisor
**Duración:** 45 minutos por empleado
**Descripción:** Fin de mes, el supervisor debe evaluar el desempeño de los empleados a su cargo usando los datos del sistema.
**Precondiciones:** Datos de desempeño disponibles en sistema, formato de evaluación definido
**Pasos:**
1. Supervisor accede al módulo de "Evaluación de desempeño"
2. Selecciona empleado: María López (cajera)
3. Sistema muestra indicadores:
   - Transacciones/día: 85 (promedio 70)
   - Ticket promedio: C$320 (promedio C$280)
   - Errores: 1 devolución mal procesada (0.01%)
   - Puntualidad: 98%
4. Supervisor agrega notas cualitativas: "María es eficiente, buena con clientes, pero necesita mejorar en devoluciones"
5. Califica: 4.2/5
6. Programa reunión con María para dar feedback
7. Establece meta: "Reducir errores de devolución a 0"
8. María firma la evaluación
9. Evaluación queda registrada en el sistema
10. Supervisor envía copia a RH
**Resultado esperado:** Evaluación completada, feedback dado, metas establecidas, registro en sistema
**Variante:** Empleado no está de acuerdo con la evaluación; supervisor debe escuchar y ajustar si hay evidencia

---

## SU-012: Supervisor coordina inventario físico general
**Rol:** Supervisor
**Duración:** 4 horas
**Descripción:** Se realiza el inventario físico general de fin de mes. El supervisor coordina a los bodegueros, asigna zonas y supervisa el conteo.
**Precondiciones:** Fin de mes, inventario bloqueado para movimientos, personal asignado
**Pasos:**
1. Supervisor reúne al equipo de bodega a las 6 AM
2. Asigna zonas: Luis (A - Abarrotes), Carlos (B - Lácteos), María (C - Limpieza)
3. Imprime hojas de conteo para cada zona
4. Explica método: contar dos veces, si hay diferencia contar una tercera
5. Inicia el conteo (3 horas)
6. Supervisor supervisa que todos cuenten correctamente
7. Bodegueros ingresan conteos en terminales móviles
8. Sistema compara con stock teórico
9. Supervisor revisa diferencias mayores a 1%
10. Decide si ajustar automáticamente o investigar más
**Resultado esperado:** Inventario físico completado, diferencias ajustadas, reporte de precisión generado
**Variante:** Una zona tiene muchas diferencias; supervisor investiga in situ antes de cerrar

---

## SU-013: Supervisor aplica medida disciplinaria
**Rol:** Supervisor
**Duración:** 30 minutos
**Descripción:** Un cajero fue sorprendido usando su celular en horario laboral (prohibido) y además dejó la caja abierta sin supervisión. Es la tercera falta.
**Precondiciones:** Falta grave documentada, historial de faltas del empleado
**Pasos:**
1. Supervisor revisa reporte: Cajero José Pérez — 3ra falta
   - Falta 1: Llegar tarde (advertencia verbal)
   - Falta 2: No cerrar caja al salir (advertencia escrita)
   - Falta 3: Celular en horario + caja abierta
2. Supervisor cita a José a su oficina
3. Presenta evidencia: foto del celular en la caja y caja abierta
4. José no puede negarlo
5. Supervisor: "Es tu tercera falta. Según el reglamento, corresponde suspensión de 3 días sin goce de salario"
6. José firma la notificación de suspensión
7. Sistema registra la suspensión en el expediente
8. José se va a su casa
9. Supervisor notifica a RH
10. Programa reunión post-suspensión para evaluar comportamiento
**Resultado esperado:** Suspensión aplicada, empleado notificado, expediente actualizado, reglamento cumplido
**Variante:** José pide otra oportunidad; supervisor puede reducir a 1 día si es la primera vez de este tipo

---

## SU-014: Supervisor revisa y aprueba solicitudes de permiso
**Rol:** Supervisor
**Duración:** 15 minutos
**Descripción:** Varios empleados han enviado solicitudes de permiso para la próxima semana. El supervisor debe revisar, aprobar o rechazar según la cobertura necesaria.
**Precondiciones:** Solicitudes de permiso registradas en sistema, calendario de personal
**Pasos:**
1. Supervisor accede a "Solicitudes de permiso pendientes"
2. Ve 4 solicitudes:
   - María (cajera): permiso médico jueves — adjunta cita
   - Pedro (rutero): día personal viernes
   - Luis (bodeguero): vacaciones 5 días la próxima semana
   - Carlos (cajero): permiso sin goce lunes
3. Revisa cobertura: jueves solo habrá 2 cajeros (normal 3)
4. Aprueba permiso de María (con cita médica)
5. Pedido de vacaciones de Luis: rechaza porque el otro bodeguero también pidió vacaciones la misma semana
6. Sugiere a Luis: "Puedes tomar vacaciones la siguiente semana"
7. Aprueba día personal de Pedro (hay suficiente cobertura de ruteros)
8. Aprueba permiso sin goce de Carlos
9. Asigna cobertura: entrenará a un cajero de medio tiempo para cubrir jueves
10. Notifica a cada empleado el resultado
**Resultado esperado:** Solicitudes procesadas, permisos aprobados/rechazados con justificación, cobertura asegurada
**Variante:** María no adjuntó la cita médica; supervisor la rechaza hasta que presente el documento

---

## SU-015: Supervisor prepara reporte mensual para la gerencia
**Rol:** Supervisor
**Duración:** 1 hora
**Descripción:** Fin de mes, el supervisor debe preparar un reporte ejecutivo con los indicadores clave de la tienda: ventas, productividad, incidencias, metas.
**Precondiciones:** Mes cerrado, datos disponibles en sistema, formato de reporte definido
**Pasos:**
1. Supervisor accede al módulo de "Reportes ejecutivos"
2. Selecciona período: Julio 2026
3. Sistema genera dashboard con indicadores:
   - Ventas del mes: C$1,245,800 (meta C$1,200,000 ✓)
   - Cumplimiento de meta: 103.8%
   - Productividad empleados: 92%
   - Incidencias: 3 (2 quejas, 1 robo menor)
   - Rotación de inventario: 4.2
   - Clientes nuevos: 12
4. Supervisor agrega análisis:
   - "Las ventas superaron la meta gracias a las promociones de azúcar"
   - "Se recomienda capacitar al personal en manejo de quejas"
   - "El robo menor está bajo investigación"
5. Exporta reporte a PDF
6. Envía por correo al gerente general
7. Prepara presentación para reunión de gerencia
8. Archiva en drive corporativo
9. Establece metas para agosto: ventas C$1,300,000
10. Cierra el reporte
**Resultado esperado:** Reporte mensual generado, enviado a gerencia, metas para próximo mes establecidas
**Variante:** Meta de ventas no se cumplió (95%); supervisor debe incluir plan de acción correctivo para el próximo mes
