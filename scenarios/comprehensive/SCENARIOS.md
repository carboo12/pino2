# Escenarios Integrales — Pino2 Los Pinos Central

---

## X-001: Día completo de un bodeguero
**Rol:** Bodeguero
**Duración:** 8 horas (6:00 AM - 2:00 PM)
**Descripción:** Siga a Don Luis, bodeguero de Los Pinos Central, durante un día completo de trabajo: desde recibir mercancía hasta el cierre de bodega.
**Precondiciones:** Bodega operativa, inventario con productos, pedidos pendientes
**Pasos:**

**6:00 AM — Apertura de bodega**
1. Don Luis llega, abre la bodega
2. Verifica que no hubo robos (precintos intactos)
3. Enciende el terminal de bodega
4. Revisa pedidos del día: 5 pedidos para preparar
5. Verifica temperatura de congeladores: -18°C (OK)

**6:30 AM — Preparación de pedidos (Ruta Norte)**
6. Prepara pedido #1: 20 bultos Arroz Faisán, 10 Aceite Patrona
7. Usa FIFO: toma lotes más antiguos primero
8. Escanea cada producto para confirmar
9. Coloca en tarima con etiqueta de destino
10. Prepara pedido #2: 15 bultos Frijoles Seda, 5 Azúcar Sulí

**8:00 AM — Carga de camión**
11. Ayuda al chofer a cargar los pedidos
12. Productos frágiles (aceite) van arriba, asegurados
13. Firma nota de envío el chofer
14. Camión sale a las 8:15 AM

**9:00 AM — Recepción de mercancía**
15. Llega camión de Cargill con 200 bultos Arroz
16. Cuenta: 198 bultos (faltan 2)
17. Registra recepción con diferencia
18. Etiqueta productos con lote y fecha de vencimiento
19. Ubica en bodega según rotación

**10:30 AM — Conteo cíclico**
20. Realiza conteo cíclico de la sección de limpieza
21. 30 productos contados, 2 diferencias menores ajustadas

**12:00 PM — Almuerzo**
22. Toma su hora de almuerzo

**1:00 PM — Preparación de pedidos (Ruta Sur)**
23. Prepara 3 pedidos para la ruta de la tarde

**2:00 PM — Cierre de bodega**
24. Verifica que todas las órdenes del día están preparadas
25. Cierra sesión en el terminal
26. Asegura la bodega
27. Reporta novedades al administrador

**Resultado esperado:** Día productivo: 5 pedidos preparados, 1 recepción procesada, 1 conteo cíclico, inventario actualizado
**Variante:** Error en la recepción (faltaron 10 bultos que no se reportaron); se descubre una semana después

---

## X-002: Día completo de un cajero
**Rol:** Cajero
**Duración:** 8 horas (6:30 AM - 2:30 PM)
**Descripción:** Siga a María, cajera de Los Pinos Central, durante un turno completo en una de las cajas más ocupadas de la tienda.
**Precondiciones:** Caja aperturada, fondo inicial C$5,000, tienda abierta
**Pasos:**

**6:30 AM — Apertura**
1. María inicia sesión en POS
2. Cuenta fondo: C$5,000 exacto
3. Apertura caja #1
4. Prepara cambio (billetes pequeños)

**7:00 AM — Hora pico matutina**
5. Primer cliente: Café Presto + Azúcar (C$158) — efectivo
6. Segundo: Leche Klim + Huevos (C$200) — tarjeta, datáfono ok
7. Tercero: Arroz + Frijoles + Aceite (C$145) — efectivo
8. Flujo constante por 2 horas: 25 transacciones

**9:00 AM — Venta a crédito**
9. Cliente conocido: Pulpería Los Amigos, compra C$2,500 a crédito
10. Verifica límite: disponible C$12,000 — OK
11. Procesa factura a crédito

**10:30 AM — Problema técnico**
12. Datáfono falla: sin señal
13. Cliente quiere pagar con tarjeta (C$1,200)
14. María sugiere efectivo o esperar
15. Cliente paga efectivo

**12:00 PM — Corte parcial**
16. María hace corte para cambio de turno
17. Ventas: C$18,500
18. Cuadre exacto
19. Entrega a cajero de la tarde

**12:30 PM - 2:30 PM — Turno extendido**
20. Ayuda en bodega con etiquetado de nuevos productos

**Resultado esperado:** 47 transacciones, C$18,500 en ventas, cuadre exacto, datafono falla manejada
**Variante:** En la hora pico, se acaba el papel térmico; María debe cambiar el rollo en medio de la fila

---

## X-003: Día completo de un rutero
**Rol:** Rutero
**Duración:** 10 horas (7:00 AM - 5:00 PM)
**Descripción:** Siga a Pedro, rutero de Los Pinos Central, en una ruta completa hacia Masaya y Granada con 8 entregas programadas.
**Precondiciones:** Camión cargado, ruta asignada, 8 entregas, herramientas de cobro
**Pasos:**

**7:00 AM — Salida**
1. Pedro llega a la bodega
2. Verifica carga: 8 pedidos, 45 bultos totales
3. Firma manifiesto de carga
4. Enciende la app de ruta en su móvil
5. Sale de la bodega

**7:45 AM — Entrega 1: Pulpería Los Amigos (Managua)**
6. Llega, descarga 5 bultos Arroz
7. Cliente firma digitalmente
8. Cobra C$2,400 contra entrega
9. Registra pago en la app

**9:00 AM — Entrega 2: Comedor Santa Ana (Managua)**
10. Llega, descarga 10 bultos Arroz + 5 Aceite
11. Cliente paga con tarjeta — datáfono funciona
12. Registra pago

**10:30 AM — Carretera a Masaya**
13. Tráfico pesado (carretera en construcción)
14. Retraso de 20 minutos

**11:00 AM — Entrega 3: Cooperativa San Miguel (Masaya)**
15. 15 bultos Frijoles + 10 Azúcar
16. Entrega a crédito (ya autorizado)
17. Firma conformidad

**12:00 PM — Almuerzo**
18. Pedro almuerza en Masaya

**1:00 PM — Entrega 4-5: Masaya centro**
19. Dos entregas en el mismo barrio
20. Completadas en 30 minutos

**2:00 PM — Carretera a Granada**
21. Clima: nublado, posible lluvia
22. Cubre productos con plástico

**2:30 PM — Entrega 6: Escuela Rubén Darío (Granada)**
23. 8 bultos Arroz + 3 Leche Klim
24. Entrega exitosa

**3:30 PM — Entrega 7-8: Granada**
25. Últimas dos entregas en Granada
26. Un cliente rechaza por producto dañado (1 bulto arroz roto)
27. Pedro registra devolución parcial

**5:00 PM — Regreso a base**
28. Pedro regresa a la tienda
29. Entrega efectivo cobrado: C$8,200
30. Entrega devoluciones
31. Reporta novedades del día

**Resultado esperado:** 8 entregas, 1 devolución parcial, efectivo conciliado, ruta completada con retrasos mínimos
**Variante:** En la carretera Masaya-Granada, encuentra un árbol caído por la lluvia; debe esperar 1 hora a que lo remuevan

---

## X-004: Día completo de un administrador
**Rol:** Administrador
**Duración:** 10 horas (6:00 AM - 4:00 PM)
**Descripción:** Siga a Don Javier, administrador de Los Pinos Central, quien debe coordinar todas las operaciones del día.
**Precondiciones:** Sistema operativo, empleados presentes, operaciones del día por coordinar
**Pasos:**

**6:00 AM — Apertura general**
1. Don Javier abre la tienda
2. Verifica que todos los empleados llegaron
3. Asigna cajas y fondos
4. Revisa pedidos pendientes del día anterior
5. Planifica rutas del día

**7:00 AM — Gestión de personal**
6. Un bodeguero llamó enfermo
7. Reasigna tareas: el ayudante de bodega cubre
8. Aprueba permiso personal de un cajero

**8:00 AM — Revisión de inventario**
9. Revisa reporte de productos agotados
10. Genera órdenes de compra para reposición
11. Contacta a proveedores

**9:30 AM — Atención a cliente**
12. Cliente reclama por producto dañado
13. Autoriza devolución de C$1,200
14. Genera nota de crédito

**10:00 AM — Arqueo sorpresa**
15. Realiza arqueo de caja #2
16. Cuadre exacto
17. Registra: "Arqueo sin novedad"

**11:00 AM — Reunión con vendedor**
18. Nuevo proveedor ofrece productos
19. Evalúa muestras y precios
20. Solicita registro sanitario (no lo tiene) — rechaza

**12:00 PM — Reportes**
21. Genera reporte de ventas matutino
22. Ventas: C$22,000 (vs C$20,000 meta) — OK
23. Envía a dueño por WhatsApp

**1:00 PM — Gestión de crédito**
24. Revisa cuentas por cobrar
25. Identifica cliente moroso de 35 días
26. Envía mensaje de cobro

**2:00 PM — Cierre administrativo**
27. Apruega compras del día
28. Revisa diferencias de caja
29. Firma reportes

**3:00 PM — Planificación del día siguiente**
30. Revisa pedidos programados para mañana
31. Confirma disponibilidad de vehículos
32. Asigna rutas preliminares

**4:00 PM — Cierre**
33. Verifica que todas las cajas cerraron
34. Asegura bóveda
35. Cierra la tienda

**Resultado esperado:** Día completo gestionado: personal, clientes, inventario, finanzas, proveedores
**Variante:** Corte de energía a las 10 AM desvía todo el plan; activa plan de contingencia

---

## X-005: Semana completa de operaciones
**Rol:** Administrador
**Duración:** 7 días (lunes a domingo)
**Descripción:** Gestión de una semana típica en Los Pinos Central, incluyendo días de alta y baja demanda.
**Precondiciones:** Semana operativa normal, inventario suficiente, personal completo
**Pasos:**

**Lunes — Inicio de semana**
1. Revisión de inventario post-fin de semana
2. Reposición de productos agotados
3. Reunión semanal con el equipo (15 min)
4. Ventas del día: C$32,000 (bajo — normal los lunes)

**Martes — Día regular**
5. Recepción de Cargill (200 bultos Arroz)
6. Preparación de rutas
7. Ventas: C$35,000

**Miércoles — Día de pagos**
8. Muchos clientes vienen a pagar facturas
9. Alta actividad de cobranza
10. Ventas: C$38,000 + cobranza C$25,000

**Jueves — Día de pedidos**
11. Mayoría de pedidos para fin de semana
12. Bodega a máxima capacidad
13. Ventas: C$40,000

**Viernes — Día fuerte**
14. Ventas altas: C$48,000
15. Dos rutas completas
16. Preparación para fin de semana

**Sábado — Pico semanal**
17. Mayor venta de la semana: C$55,000
18. Tienda llena toda la mañana
19. Bodega preparando pedidos para entrega express

**Domingo — Medio día**
20. Tienda abre solo medio día (8 AM - 12 PM)
21. Ventas: C$18,000
22. Cierre semanal
23. Reporte semanal consolidado
24. Total semana: C$266,000

**Resultado esperado:** Semana gestionada, ventas consolidadas C$266,000, inventario rotado, cobranza realizada
**Variante:** El viernes hubo un problema con el servidor que afectó 2 horas de ventas (C$8,000 perdidos)

---

## X-006: Corte de mes completo
**Rol:** Administrador + Dueño
**Duración:** 3 días (últimos 3 días del mes)
**Descripción:** Cierre de mes completo: inventario, caja, cuentas por cobrar, reportes financieros.
**Precondiciones:** Mes completo de operaciones, todos los movimientos registrados
**Pasos:**

**Día 1 — Preparación**
1. Administrador anuncia: "Cierre de mes en 3 días"
2. Último día para recepciones de proveedores
3. Último día para notas de crédito
4. Congela recepción de mercancía nueva
5. Notifica a todos los departamentos

**Día 2 — Conteo de inventario**
6. Se suspenden preparaciones de pedidos (solo ventas)
7. Todo el personal cuenta inventario por secciones
8. Sección A: Carlos, 45 min, 0 diferencias
9. Sección B: María, 50 min, 3 diferencias menores
10. Sección C: Pedro, 40 min, 1 diferencia mayor (investigar)
11. Administrador investiga la diferencia mayor
12. Causa: error de recepción de la semana pasada
13. Ajuste registrado con justificación
14. Inventario final del mes: 2,847 productos, precisión 99.2%

**Día 3 — Cierre financiero**
15. Administrador cierra todas las cajas del mes
16. Revisa cada diferencia diaria
17. Genera reportes:
    - Ventas del mes: C$1,245,800
    - Margen bruto: 20.5%
    - Gastos: C$185,000
    - Cuentas por cobrar: C$280,000
    - Cuentas por pagar: C$195,000
18. Exporta datos para contador
19. Dueño revisa y aprueba
20. Cierre de mes oficial

**Resultado esperado:** Mes cerrado: inventario preciso, reportes generados, datos enviados al contador
**Variante:** Una diferencia mayor de inventario no se pudo explicar (C$15,000); se reporta como pérdida y se investigará en el próximo mes

---

## X-007: Preparación para temporada navideña
**Rol:** Administrador
**Duración:** 2 semanas (noviembre - diciembre)
**Descripción:** Preparación para la temporada más alta del año: Navidad en Nicaragua, donde las ventas se triplican y hay productos especiales.
**Precondiciones:** Noviembre, planificación de temporada alta, inventario especial
**Pasos:**

**Semana 1 — Planificación**
1. Administrador revisa ventas de navidad pasada
2. Identifica productos de mayor demanda: Aceite, Arroz, Huevos, Leche
3. Calcula cantidades necesarias: 50% más que mes normal
4. Contacta a proveedores para asegurar stock
5. Negocia precios especiales por volumen
6. Contrata personal temporal (2 cajeros extra)

**Semana 2 — Ejecución**
7. Recibe inventario navideño: productos especiales (canastas, vinos)
8. Configura promociones navideñas en el sistema
9. 10% descuento en compras mayores a C$10,000
10. Canastas navideñas armadas (Arroz, Aceite, Café, Leche, Azúcar)
11. Prepara horario extendido: 6 AM - 9 PM (vs normal 7 AM - 7 PM)
12. Configura recargo de días festivos (24, 25, 31 dic, 1 ene)
13. Coordina rutas extra para entregas de temporada

**Diciembre — Operación navideña**
14. Ventas se duplican desde el 15 de diciembre
15. Bodega al 95% de capacidad
16. Personal trabajando horas extra
17. Todos los días son horas pico
18. 24 de diciembre: venta masiva hasta las 2 PM

**Resultado esperado:** Temporada navideña gestionada exitosamente, ventas 50% sobre lo normal, clientes satisfechos
**Variante:** El proveedor de huevos no entregó a tiempo (escasez de diciembre); se debe racionar: máximo 20 bultos por cliente

---

## X-008: Recuperación después de un desastre natural
**Rol:** Administrador + Dueño
**Duración:** 1 semana
**Descripción:** El Huracán "Julia" azotó Nicaragua. La bodega de Los Pinos Central sufrió inundación. Se debe recuperar la operación.
**Precondiciones:** Desastre natural ocurrido, bodega dañada, inventario parcialmente perdido
**Pasos:**

**Día 1 — Evaluación de daños**
1. Administrador llega después de la tormenta
2. Evalúa daños: bodega inundada 30cm de agua
3. Productos dañados: 200 bultos en la sección baja
4. Servidor funcionó con UPS toda la noche (datos intactos)
5. Estructura: sin daños mayores
6. Reporta al dueño

**Día 2 — Ajuste de inventario**
7. Clasifica productos: salvados vs dañados
8. En Pino2, realiza ajuste masivo por desastre
9. 150 bultos Arroz dañados → pérdida total
10. 50 bultos Azúcar dañados → pérdida total
11. Productos salvados: se limpian y reevalúan
12. Reporte de pérdida para el seguro: C$95,000

**Día 3 — Limpieza y reapertura parcial**
13. Personal limpia la bodega
14. Fumigación preventiva
15. Tienda reabre (productos secos en sección alta)
16. Ventas limitadas: C$8,000 (vs normal C$35,000)

**Día 4-5 — Reposición**
17. Pedidos urgentes a proveedores
18. Llega reposición: 300 bultos Arroz, 100 Azúcar
19. Inventario se recupera al 60%

**Día 6-7 — Operación normal**
20. Inventario al 90% de capacidad
21. Ventas se normalizan
22. Se presenta reclamo formal al seguro
23. Se documentan lecciones aprendidas

**Resultado esperado:** Recuperación exitosa en 1 semana, pérdida de C$95,000 asegurada, operación normalizada
**Variante:** El seguro no cubre inundaciones (letra pequeña); la pérdida total es absorbida por la empresa

---

## X-009: Migración de sistema antiguo a nuevo
**Rol:** Administrador + Soporte Técnico
**Duración:** 1 semana
**Descripción:** Se migra del sistema legacy (un sistema viejo en DOS) a Pino2. Se deben migrar todos los datos: clientes, productos, inventario, historial.
**Precondiciones:** Sistema antiguo operativo, Pino2 instalado en paralelo, backup de datos legacy
**Pasos:**

**Día 1 — Exportación de datos legacy**
1. Técnico exporta datos del sistema antiguo
2. Clientes: 2,500 registros
3. Productos: 3,000 registros
4. Inventario: con corte al día anterior
5. Historial de ventas: 2 años
6. Datos exportados a CSV

**Día 2 — Limpieza y transformación**
7. Se revisan datos: clientes duplicados (80), productos duplicados (45)
8. Se limpian y unifican
9. Se transforman formatos
10. Se cargan a Pino2

**Día 3 — Validación**
11. Se comparan datos migrados vs legacy
12. Clientes: 2,420 únicos (80 duplicados eliminados) ✓
13. Productos: 2,955 únicos (45 duplicados eliminados) ✓
14. Inventario: cuadra con físico ✓
15. Historial: 24 meses de ventas ✓

**Día 4 — Capacitación**
16. Todo el personal recibe capacitación de Pino2
17. 4 horas de entrenamiento práctico
18. Pruebas en ambiente de pruebas

**Día 5 — Corte y puesta en producción**
19. Viernes 6 PM: se cierra sistema legacy
20. Backup final de legacy
21. 7 PM: Pino2 entra en producción
22. Sábado: operación real con Pino2
23. Soporte técnico presente todo el fin de semana

**Día 6-7 — Seguimiento**
24. Se monitorea el sistema continuamente
25. Se corrigen incidencias menores
26. Usuarios reportan todo OK
27. Sistema legacy se retira definitivamente

**Resultado esperado:** Migración exitosa, datos íntegros, personal capacitado, sistema legacy retirado
**Variante:** Datos de inventario no cuadran (diferencia de C$50,000 en valor); se debe hacer conteo físico completo antes de dar por terminada la migración

---

## X-010: Auditoría completa de fin de año
**Rol:** Administrador + Dueño + Auditor Externo
**Duración:** 1 semana
**Descripción:** Auditoría externa de fin de año. Un auditor independiente revisa todos los procesos: inventario, caja, cuentas, facturación, cumplimiento fiscal.
**Precondiciones:** Año completo de operaciones, todos los reportes generados, sistema íntegro
**Pasos:**

**Día 1 — Apertura de auditoría**
1. Auditor externo llega a la tienda
2. Reunión inicial con administrador y dueño
3. Alcance: inventario, caja, facturación, cumplimiento
4. Auditor solicita documentación:
   - Reportes mensuales de todo el año
   - Facturas de compra y venta
   - Conciliaciones bancarias
   - Declaraciones fiscales

**Día 2 — Auditoría de inventario**
5. Auditor selecciona 100 productos al azar
6. Realiza conteo físico de esos productos
7. Compara con sistema:
   - 95 productos: exactos
   - 4 productos: diferencia menor (<1%)
   - 1 producto: diferencia significativa (Jabón Rey: -10 unidades)
8. Auditor investiga: se encontró que 10 unidades estaban mal ubicadas (en área de devoluciones no registrada)
9. Diferencia explicada — OK

**Día 3 — Auditoría de caja**
10. Auditor revisa cortes de caja del año
11. Selecciona 10 días al azar
12. Verifica que todas las diferencias están justificadas
13. Revisa conciliación de pagos electrónicos
14. Verifica depósitos bancarios vs ventas
15. Todo OK

**Día 4 — Auditoría fiscal**
16. Auditor revisa facturación electrónica
17. Verifica que todas las facturas están timbradas
18. Revisa cálculo de IVA
19. Revisa cálculo de IR
20. Encuentra 2 facturas sin timbrar (error de sistema)
21. Se corrigen inmediatamente
22. Se pagan multas correspondientes (C$5,000)

**Día 5 — Cierre de auditoría**
23. Auditor presenta hallazgos:
    - Fortalezas: control de inventario, cuadre de caja, personal capacitado
    - Debilidades: 2 facturas sin timbrar, proceso de recibos no digitalizado
    - Recomendaciones: digitalizar recibos, automatizar alertas de timbrado
24. Dueño acepta recomendaciones
25. Plan de acción para próximo año
26. Informe final firmado

**Resultado esperado:** Auditoría completada, hallazgos documentados, plan de mejora implementado
**Variante:** Auditor encuentra discrepancias graves (facturas falsas, evasión fiscal); caso pasa a la unidad de delitos económicos de la Policía
