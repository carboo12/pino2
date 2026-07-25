# Escenarios de Empleados — Pino2 Los Pinos Central

---

## E-001: Bodeguero prepara pedido correctamente
**Rol:** Bodeguero
**Duración:** 20 minutos
**Descripción:** El bodeguero recibe una orden de preparación y prepara el pedido completo y correctamente, siguiendo el método FIFO (primero en entrar, primero en salir).
**Precondiciones:** Orden de preparación asignada, productos disponibles en bodega
**Pasos:**
1. Bodeguero recibe notificación en terminal: "Preparar pedido #ORD-2026-050"
2. Revisa lista: 20 bultos Arroz Faisán, 10 bultos Frijoles Seda, 5 cajas Aceite Patrona
3. Sistema indica ubicaciones: Pasillo A2, Pasillo B1, Pasillo C3
4. Bodeguero selecciona lotes por FIFO (el más antiguo primero)
5. Arroz: lote L2301 (vence 15/08) — correcto, es el más viejo
6. Cuenta: 20 bultos, los coloca en tarima
7. Frijoles: lote L2302 (vence 20/08) — 10 bultos
8. Aceite: lote L2298 (vence 10/08) — 5 cajas
9. Escanea cada producto para confirmar
10. Sistema verifica cantidades y lotes
11. Marca pedido como "Preparado"
12. Coloca etiqueta con destino y número de pedido
**Resultado esperado:** Pedido preparado con FIFO, cantidades correctas, listo para carga
**Variante:** Bodeguero usa lote equivocado (nuevo en vez de viejo); el producto se vencerá antes de venderse

---

## E-002: Bodeguero prepara pedido con error
**Rol:** Bodeguero
**Duración:** 15 minutos
**Descripción:** El bodeguero comete un error al preparar: pone 15 bultos de Arroz en vez de 20. El error se detecta al cargar el camión.
**Precondiciones:** Orden de preparación, error humano
**Pasos:**
1. Bodeguero prepara pedido de 20 bultos Arroz
2. Se distrae, solo coloca 15 bultos en la tarima
3. Marca pedido como "Preparado" (no verificó bien)
4. Chofer llega a cargar
5. Cuenta: 15 bultos en vez de 20
6. Reporta diferencia
7. Bodeguero verifica: efectivamente faltan 5
8. Busca los 5 bultos faltantes en bodega
9. Los agrega a la tarima
10. Corrige en sistema: "Ajuste post-preparación"
**Resultado esperado:** Error detectado antes de salir a ruta, corregido inmediatamente
**Variante:** Error no se detecta hasta que el cliente reclama; se debe enviar pedido adicional urgente

---

## E-003: Cajero procesa venta correctamente
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** El cajero atiende a un cliente de manera eficiente y correcta, procesando la venta de principio a fin sin errores.
**Precondiciones:** Caja aperturada, cliente con productos
**Pasos:**
1. Cajero saluda al cliente
2. Escanea productos eficientemente
3. Confirma total con el cliente
4. Recibe el pago
5. Calcula vuelto correctamente
6. Entrega ticket
7. Entrega productos
8. Despide al cliente
9. Tiempo total: 2 minutos 30 segundos
10. Venta registrada correctamente en el sistema
**Resultado esperado:** Transacción rápida y correcta, cliente satisfecho, caja cuadra al final
**Variante:** Cajero fue demasiado rápido y no verificó edad del cliente para producto restringido

---

## E-004: Cajero procesa venta con error
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** El cajero comete un error al seleccionar un producto (escanea el código equivocado) y el precio es incorrecto. El cliente reclama.
**Precondiciones:** Caja operativa, error de escaneo
**Pasos:**
1. Cliente compra Detergente Ariel 500g (C$40)
2. Cajero escanea rápido, sale Detergente Ariel 1kg (C$80)
3. Total: C$180 (cuando debió ser C$140)
4. Cliente: "Eso está caro, el detergente es el pequeño"
5. Cajero verifica: escaneó el código equivocado
6. Corrige: elimina línea incorrecta
7. Busca producto correcto: "Detergente Ariel 500g"
8. Vuelve a totalizar: C$140
9. Cliente paga conforme
**Resultado esperado:** Error corregido, cliente paga el precio correcto, cajero aprende a verificar
**Variante:** Cajero no se da cuenta del error; el cliente paga de más y reclama después; se debe devolver diferencia

---

## E-005: Rutero entrega en dirección equivocada
**Rol:** Rutero
**Duración:** 20 minutos
**Descripción:** El rutero confunde direcciones y entrega en la casa de al lado. Se da cuenta cuando el cliente real reclama.
**Precondiciones:** Ruta asignada, error de lectura de dirección
**Pasos:**
1. Rutero busca "Casa #124, Villa Fontana"
2. Ve casa #122, asume que #124 es la siguiente
3. Entrega en #126 (vecino) — la persona recibe los productos
4. 1 hora después, cliente real (#124) llama reclamando
5. Rutero regresa a Villa Fontana
6. Va a #126, pide los productos de vuelta
7. Vecino devuelve (o no)
8. Rutero entrega en #124
9. Se disculpa con el cliente real
10. Reporta el error
**Resultado esperado:** Error corregido, productos recuperados, cliente real atendido, rutero reporta incidente
**Variante:** El vecino de #126 ya consumió parte de los productos (arroz cocinado); se debe reclamar reposición al rutero

---

## E-006: Rutero cobra de menos
**Rol:** Rutero
**Duración:** 10 minutos
**Descripción:** El rutero cobra C$3,500 a un cliente cuando el pedido es de C$4,200. Error de cálculo. El efectivo no cuadra al final del día.
**Precondiciones:** Pedido de pago contra entrega, error de cobro
**Pasos:**
1. Pedido: C$4,200
2. Cliente da C$5,000
3. Rutero calcula mal: cree que son C$4,500
4. Da vuelto de C$500 (cuando debió ser C$800)
5. Pero cobró C$4,500, no C$4,200 — error doble
6. Cliente: "Me cobró de más"
7. Rutero corrige: da C$300 adicionales
8. Ahora cobró C$4,200 — correcto
9. Al final del día, cuenta el efectivo: faltan C$300
10. No cuadra con lo que registró en la app
11. Administrador detecta la inconsistencia
12. Rutero debe pagar la diferencia
**Resultado esperado:** Error de cobro detectado, diferencia de C$300 descontada al rutero
**Variante:** Cliente no se da cuenta que le cobraron de menos; la tienda pierde dinero y el rutero es responsable

---

## E-007: Administrador crea usuario nuevo
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se contrata un nuevo cajero (María López). El administrador debe crear su usuario en el sistema con los permisos adecuados.
**Precondiciones:** Administrador con permisos de gestión de usuarios, nuevo empleado contratado
**Pasos:**
1. Administrador accede a "Gestión de usuarios" en Pino2
2. Selecciona "Nuevo usuario"
3. Ingresa datos:
   - Nombre: María López
   - Cédula: 001-250600-5678Z
   - Rol: Cajero
   - Sucursal: Los Pinos Central
4. Configura permisos:
   - POS: activo
   - Devoluciones: hasta C$500
   - Reportes: no
   - Administración: no
5. Genera usuario: "mlopez" y contraseña temporal
6. Configura vigencia de contraseña: 30 días
7. Guarda usuario
8. Usuario queda activo
9. Entrega credenciales a María
10. María cambia contraseña al primer inicio
**Resultado esperado:** Nuevo usuario creado con permisos de cajero, listo para operar
**Variante:** Administrador asigna permisos de administrador por error; María puede modificar precios y hacer cambios no autorizados

---

## E-008: Administrador desactiva usuario
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un empleado (bodeguero nocturno) fue despedido por robo. Se debe desactivar su usuario inmediatamente para evitar accesos no autorizados.
**Precondiciones:** Empleado despedido, usuario activo en el sistema
**Pasos:**
1. Administrador recibe confirmación de despido
2. Accede a "Gestión de usuarios"
3. Busca usuario: "jramirez" (Juan Ramírez, bodeguero)
4. Selecciona "Desactivar usuario"
5. Motivo: "Despido — robo interno"
6. Fecha efectiva: inmediata
7. Confirma desactivación
8. Sistema bloquea el ingreso inmediatamente
9. La sesión activa de Juan (si existe) se cierra forzadamente
10. Se registra en auditoría: "Usuario desactivado por [admin] — 25/07/2026"
**Resultado esperado:** Usuario desactivado inmediatamente, sin posibilidad de acceso futuro
**Variante:** El empleado se reincorpora (apeló el despido y ganó); se reactiva el usuario con contraseña nueva

---

## E-009: Empleado olvida su contraseña
**Rol:** Empleado (Cajero)
**Duración:** 5 minutos
**Descripción:** El cajero llega a trabajar y no recuerda su contraseña. Debe solicitar restablecimiento al administrador.
**Precondiciones:** Usuario existente, contraseña olvidada
**Pasos:**
1. Cajero intenta iniciar sesión: "mlopez", contraseña incorrecta
2. Reintenta 2 veces más — bloqueado por 15 minutos
3. Cajero solicita ayuda al administrador
4. Administrador accede a "Restablecer contraseña"
5. Busca usuario "mlopez"
6. Selecciona "Generar nueva contraseña temporal"
7. Sistema genera: "TempML2026!"
8. Configura: "Obligar cambio en próximo inicio"
9. Entrega contraseña temporal a María
10. María inicia sesión, sistema obliga a cambiar
11. María establece nueva contraseña
**Resultado esperado:** Contraseña restablecida, empleado puede trabajar, cambio obligatorio en primer inicio
**Variante:** Cajero intenta 10 veces y el usuario se bloquea permanentemente; solo el administrador puede desbloquear

---

## E-010: Empleado cambia su contraseña
**Rol:** Empleado
**Duración:** 3 minutos
**Descripción:** Por política de seguridad, cada 30 días el empleado debe cambiar su contraseña. El sistema lo fuerza al iniciar sesión.
**Precondiciones:** Contraseña vencida, política de cambio cada 30 días
**Pasos:**
1. Cajero inicia sesión
2. Sistema muestra: "Su contraseña ha expirado. Debe cambiarla."
3. Cajero ingresa contraseña actual: *****
4. Ingresa nueva contraseña: Nuev@Pass123
5. Confirma: Nuev@Pass123
6. Sistema valida:
   - Mínimo 8 caracteres ✓
   - Mayúscula ✓
   - Minúscula ✓
   - Número ✓
   - Carácter especial ✓
   - No igual a las últimas 5 contraseñas ✓
7. Contraseña actualizada
8. Sesión iniciada exitosamente
9. Cajero continúa su trabajo
**Resultado esperado:** Contraseña cambiada exitosamente, política de seguridad cumplida
**Variante:** Cajero intenta usar la misma contraseña de los últimos 5 cambios; sistema rechaza y pide una diferente

---

## E-011: Dueño revisa reportes generales
**Rol:** Dueño
**Duración:** 15 minutos
**Descripción:** El dueño (Don Carlos) llega a la tienda a revisar los reportes del mes. Quiere ver ventas, gastos, rentabilidad y morosidad.
**Precondiciones:** Dueño con permisos de administración total, datos del mes disponibles
**Pasos:**
1. Dueño inicia sesión con su usuario especial
2. Accede a "Reportes generales"
3. Selecciona período: "Julio 2026"
4. Sistema muestra dashboard:
   - Ventas totales: C$1,245,800
   - Costo de ventas: C$996,640
   - Margen bruto: 20%
   - Gastos operativos: C$180,000
   - Utilidad neta: C$69,160
5. Dueño revisa desglose por categoría
6. Revisa clientes morosos (10 clientes)
7. Revisa productos más vendidos
8. Exporta reporte a PDF
9. Comenta con administrador: "Las ventas subieron 8% vs mes pasado"
10. Cierra sesión
**Resultado esperado:** Dueño informado del estado del negocio, reportes revisados, decisiones pueden tomarse
**Variante:** Dueño encuentra que el margen bajó del 22% al 20%; solicita revisión de precios y promociones

---

## E-012: Dueño exporta datos para contador
**Rol:** Dueño
**Duración:** 10 minutos
**Descripción:** Fin de mes, el dueño necesita exportar los datos de ventas, compras e inventario para enviar al contador externo.
**Precondiciones:** Mes cerrado, datos disponibles para exportación
**Pasos:**
1. Dueño accede a "Exportar datos"
2. Selecciona datos a exportar:
   - Ventas del mes (detallado)
   - Compras del mes
   - Gastos operativos
   - Inventario final
   - Cuentas por cobrar
   - Cuentas por pagar
3. Selecciona formato: "Excel + CSV"
4. Período: 01/07/2026 al 31/07/2026
5. Sistema genera archivos
6. Descarga: 6 archivos
7. Envía por correo al contador: "contador@estudiofiscal.com"
8. Confirma envío
9. Sistema registra: "Datos exportados por [dueño] — 25/07/2026"
**Resultado esperado:** Datos exportados y enviados al contador para declaraciones fiscales
**Variante:** Contador reporta que los datos no cuadran con sus registros; se debe investigar diferencias

---

## E-013: Empleado intenta acceder a función no autorizada
**Rol:** Cajero
**Duración:** 2 minutos
**Descripción:** Un cajero intenta modificar un precio de producto (función de administrador) pero el sistema bloquea la acción por permisos insuficientes.
**Precondiciones:** Cajero con permisos limitados, intenta acción no autorizada
**Pasos:**
1. Venta normal en curso
2. Cliente: "¿Me puede hacer descuento?"
3. Cajero intenta modificar precio manualmente
4. Sistema muestra: "No tiene permisos para modificar precios"
5. Cajero insiste: cambia a otra pantalla
6. Sistema bloquea: "Acceso denegado — esta función requiere permisos de administrador"
7. Cajero reporta al administrador
8. Administrador aplica descuento si aplica
9. Cajero continúa con la venta
10. Sistema registra: "Intento de acceso no autorizado — mlopez — 25/07/2026"
**Resultado esperado:** Acceso bloqueado, registro de auditoría, administrador debe autorizar
**Variante:** Cajero conoce la contraseña del administrador (la vio cuando la tecleó); la usa para autorizar; se registra como auditoría no válida

---

## E-014: Dos cajeros en la misma caja
**Rol:** Cajero (2 personas)
**Duración:** 5 minutos
**Descripción:** Dos cajeros están compartiendo la misma caja registradora (uno cobra, otro guarda el dinero). El sistema rechaza dos sesiones en la misma caja.
**Precondiciones:** Caja ocupada por un cajero, segundo cajero intenta usar la misma
**Pasos:**
1. Cajero 1 (María) tiene sesión activa en Caja #1
2. Cajero 2 (Pedro) intenta iniciar sesión en Caja #1
3. Sistema: "Caja #1 ya está en uso por mlopez. ¿Desea cerrar su sesión?"
4. Pedro: "No" (no quiere cerrar sesión de María)
5. Pedro usará una caja diferente
6. Pedro inicia sesión en Caja #2
7. Cada cajero opera su propia caja
8. Al final del día, cada uno cierra su caja por separado
**Resultado esperado:** Sistema previene dos sesiones en la misma caja, cada cajero tiene su caja
**Variante:** Es hora pico y solo hay una caja disponible; se permite usar la misma caja pero en turnos (alternando)

---

## E-015: Empleado trabaja después de su turno
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Son las 6:30 PM, el turno del cajero terminó a las 5:00 PM pero sigue trabajando. Se debe registrar como horas extra.
**Precondiciones:** Turno terminado, cajero continúa operando, horas extra permitidas
**Pasos:**
1. Cajero inició a las 6:30 AM, debía salir a las 5:00 PM
2. A las 5:30 PM hay mucha fila
3. Cajero decide quedarse para ayudar
4. Sistema registra: "Jornada extendida — 11 horas continuas"
5. A las 6:30 PM, administrador nota que el cajero sigue
6. Administrador: "Ya vete, te voy a pagar horas extra"
7. Cajero cierra sesión
8. Sistema registra: "Jornada: 6:30 AM — 6:30 PM (12 horas)"
9. Reporte de horas extra generado
10. Se pagarán como tiempo extra (1.5x según ley)
**Resultado esperado:** Jornada registrada, horas extra documentadas, pago correspondiente
**Variante:** Empleado trabaja después de turno sin autorización; se registra como tiempo no autorizado y no se paga

---

## E-016: Administrador asigna permisos a nuevo rol
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se crea un nuevo rol en el sistema: "Supervisor de rutas". El administrador debe configurar los permisos específicos para este rol.
**Precondiciones:** Nuevo rol definido, permisos a configurar
**Pasos:**
1. Administrador accede a "Gestión de roles" en Pino2
2. Selecciona "Crear nuevo rol"
3. Nombre del rol: "Supervisor de rutas"
4. Configura permisos:
   - Módulo de rutas: acceso total
   - Módulo de empleados: solo lectura
   - Módulo de ventas: reportes
   - Módulo de inventario: solo lectura
   - Administración: no
5. Asigna acceso a reportes de rendimiento de ruteros
6. Configura límite de autorización de descuentos: hasta 5%
7. Guarda el nuevo rol
8. Asigna el rol al empleado Carlos Mendoza (nuevo supervisor)
9. Carlos inicia sesión con su nuevo rol
10. Verifica que solo ve los módulos asignados
**Resultado esperado:** Nuevo rol creado con permisos específicos, empleado asignado, accesos verificados
**Variante:** Administrador asigna permisos de más (puede modificar precios); se debe corregir inmediatamente

---

## E-017: Bodeguero realiza conteo cíclico programado
**Rol:** Bodeguero
**Duración:** 20 minutos
**Descripción:** El sistema programa un conteo cíclico de la sección de lácteos. El bodeguero debe contar 30 productos y reportar diferencias.
**Precondiciones:** Conteo cíclico asignado, terminal móvil disponible
**Pasos:**
1. Bodeguero recibe notificación: "Conteo cíclico asignado — Sección Lácteos"
2. Toma la terminal móvil y va a la sección
3. Sistema muestra lista de 30 productos a contar
4. Bodeguero cuenta Leche Klim 400g: sistema dice 120, físico 118 (diferencia -2)
5. Cuenta Leche Klim 800g: sistema 45, físico 46 (+1)
6. Cuenta Yogurt: sistema 30, físico 30 (exacto)
7. Ingresa cada conteo en la terminal
8. Sistema marca diferencias mayores al 2% para revisión
9. Leche Klim 400g tiene diferencia de 1.67% — dentro del margen, ajuste automático
10. Bodeguero completa los 30 productos y cierra el conteo
**Resultado esperado:** Conteo completado, diferencias registradas, ajustes automáticos aplicados
**Variante:** Una diferencia es mayor al 5%; el sistema bloquea el ajuste y requiere autorización del supervisor

---

## E-018: Cajero maneja billete de alta denominación sin cambio
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Un cliente paga un producto de C$38 con un billete de C$1,000. El cajero no tiene suficiente cambio en caja. Debe gestionar la situación.
**Precondiciones:** Caja con cambio limitado, cliente con billete grande
**Pasos:**
1. Cliente compra Azúcar Sulí 1kg (C$38)
2. Paga con billete de C$1,000
3. Cajero revisa su caja: no tiene suficientes billetes pequeños para dar C$962 de vuelto
4. Cajero: "Disculpe, no tengo suficiente cambio para ese billete. ¿Tiene uno más pequeño?"
5. Cliente busca: tiene C$50
6. Cliente paga con C$50, vuelto C$12
7. Cajero da vuelto de C$12
8. Transacción completada
9. Cajero registra incidente: "Cliente con billete grande — sin cambio suficiente"
10. Al final del día, reporta necesidad de más denominaciones pequeñas
**Resultado esperado:** Transacción completada con billete más pequeño, cliente atendido, necesidad reportada
**Variante:** Cliente insiste en pagar con C$1,000; cajero llama al administrador para que le cambien el billete en la caja fuerte

---

## E-019: Rutero sufre pinchazo en la ruta
**Rol:** Rutero
**Duración:** 30 minutos
**Descripción:** El camión del rutero sufre un pinchazo en una llanta en la carretera a Granada. Debe cambiarla él mismo para no esperar grúa.
**Precondiciones:** Llanta de repuesto disponible, herramientas en el camión
**Pasos:**
1. Rutero siente que el camión se desvía — llanta trasera izquierda desinflada
2. Se detiene a un lado seguro de la carretera
3. Coloca triángulos de seguridad
4. Saca la llanta de repuesto y las herramientas
5. Cambia la llanta (20 minutos)
6. Reporta al dispatcher: "Pinchazo en carretera a Granada, ya cambié la llanta"
7. Dispatcher: "¿Estás bien? ¿Necesitas ayuda?"
8. Rutero: "No, ya quedó. Continuo la ruta"
9. Llega a la próxima entrega 25 minutos tarde
10. Al regresar, lleva la llanta dañada al taller
**Resultado esperado:** Llanta cambiada por el rutero, ruta continuada con retraso mínimo, incidente reportado
**Variante:** No hay llanta de repuesto; rutero debe esperar grúa (1 hora) y la ruta se retrasa significativamente

---

## E-020: Administrador configura alerta de stock mínimo
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El administrador configura alertas de stock mínimo para productos críticos. Cuando el stock baje de cierto nivel, el sistema debe notificar automáticamente.
**Precondiciones:** Productos críticos identificados, configuración de alertas disponible
**Pasos:**
1. Administrador accede a "Configuración de alertas de inventario"
2. Selecciona producto: Arroz Faisán 1lb
3. Configura punto de reorden: 200 bultos
4. Configura cantidad mínima: 100 bultos (alerta crítica)
5. Configura notificaciones: enviar alerta a administrador y a compras
6. Repite para: Aceite Patrona (punto reorden 50 cajas)
7. Repite para: Huevos San Felipe (punto reorden 30 bultos)
8. Guarda configuración
9. Sistema confirma: "Alertas configuradas para 3 productos"
10. Programa revisión semanal de puntos de reorden
**Resultado esperado:** Alertas configuradas, sistema notificará cuando el stock baje del punto de reorden
**Variante:** Punto de reorden configurado muy alto; sistema alerta constantemente — se debe ajustar

---

## E-021: Administrador fusiona dos cuentas de cliente duplicadas
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se descubre que "Pulpería Doña Mary" y "Pulpería Mary" son el mismo cliente pero están registrados como dos cuentas separadas. El administrador debe fusionarlas.
**Precondiciones:** Cliente duplicado identificado, admin con permisos de fusión
**Pasos:**
1. Administrador accede a "Gestión de clientes"
2. Busca "Pulpería Doña Mary" — encuentra 2 registros similares
3. Revisa direcciones: ambos en Masaya, misma dirección
4. Confirma con el vendedor: son el mismo cliente
5. Selecciona la cuenta principal (la más antigua): "Pulpería Doña Mary" (ID CL-042)
6. Selecciona la cuenta a fusionar: "Pulpería Mary" (ID CL-089)
7. Sistema muestra: CL-089 tiene historial de 5 facturas y saldo C$0
8. Administrador confirma fusión
9. Sistema mueve todo el historial de CL-089 a CL-042
10. CL-089 se desactiva y CL-042 conserva todos los datos
**Resultado esperado:** Cuentas fusionadas, historial consolidado, cliente duplicado eliminado
**Variante:** Las cuentas tienen saldos diferentes; se deben conciliar antes de fusionar

---

## E-022: Empleado solicita cambio de turno
**Rol:** Empleado (Cajero)
**Duración:** 5 minutos
**Descripción:** Un cajero necesita cambiar su turno de la mañana a la tarde por motivos de estudio. Debe solicitar el cambio y que el administrador lo apruebe.
**Precondiciones:** Empleado con turno fijo, solicitud de cambio registrada
**Pasos:**
1. Cajero María accede a "Solicitar cambio de turno" en el sistema
2. Selecciona turno actual: "Matutino (6:30 AM - 2:30 PM)"
3. Selecciona turno deseado: "Vespertino (2:30 PM - 9:30 PM)"
4. Motivo: "Inicio de clases universitarias en la mañana"
5. Adjunta horario de clases como justificación
6. Fecha deseada de cambio: 01/08/2026
7. Envía solicitud
8. Administrador recibe notificación
9. Revisa cobertura: el turno matutino tiene suficientes cajeros
10. Aprueba el cambio
**Resultado esperado:** Solicitud aprobada, turno cambiado, empleado puede estudiar
**Variante:** No hay suficiente personal en el turno matutino; administrador rechaza y negocia medio turno u otra solución

---

## E-023: Administrador genera reporte de comisiones de vendedores
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Fin de mes, el administrador debe generar el reporte de comisiones para los vendedores basado en sus ventas del mes.
**Precondiciones:** Ventas del mes registradas, esquema de comisiones configurado
**Pasos:**
1. Administrador accede a "Reportes → Comisiones de ventas"
2. Selecciona período: Julio 2026
3. Sistema calcula comisiones según reglas:
   - Vendedor Don Freddy: ventas C$280,000 → comisión 3% = C$8,400
   - Vendedor Don Juan: ventas C$195,000 → comisión 2.5% = C$4,875
   - Vendedora Doña Marta: ventas C$310,000 → comisión 3% = C$9,300
4. Administrador revisa y verifica cálculos
5. Ajusta comisión de Doña Marta: superó meta de C$300,000 — bono extra de C$2,000
6. Exporta reporte a PDF
7. Envía a contabilidad para pago de nómina
8. Notifica a cada vendedor su comisión
9. Archiva reporte
10. Prepara metas de ventas para agosto
**Resultado esperado:** Comisiones calculadas, bonos aplicados, reporte enviado a contabilidad
**Variante:** Un vendedor reclama que su comisión está mal calculada; administrador revisa el detalle y corrige si es necesario

---

## E-024: Bodeguero recibe capacitación en uso de terminal móvil
**Rol:** Bodeguero
**Duración:** 30 minutos
**Descripción:** La empresa adquiere nuevas terminales móviles para bodega. El bodeguero debe recibir capacitación sobre su uso para conteos y preparación de pedidos.
**Precondiciones:** Nuevas terminales recibidas, capacitador asignado
**Pasos:**
1. Supervisor reúne a los 3 bodegueros
2. Entrega las nuevas terminales móviles
3. Explica funciones principales:
   - Escanear códigos de barras
   - Registrar conteos cíclicos
   - Confirmar preparación de pedidos
   - Consultar ubicaciones de productos
4. Bodeguero Luis práctica: escanea 5 productos
5. Bodeguero Luis práctica: registra un conteo
6. Bodeguero Luis práctica: confirma preparación de un pedido
7. Supervisor resuelve dudas
8. Bodeguero firma hoja de capacitación
9. Las terminales se asignan nominalmente a cada bodeguero
10. A partir de mañana, solo usarán las nuevas terminales
**Resultado esperado:** Bodegueros capacitados, terminales asignadas, proceso migrado a nuevo equipo
**Variante:** Un bodeguero tiene dificultad con la tecnología; supervisor programa capacitación individual adicional

---

## E-025: Dueño autoriza aumento de límite de crédito a cliente
**Rol:** Dueño
**Duración:** 10 minutos
**Descripción:** La Cooperativa San Miguel solicita aumentar su límite de crédito de C$200,000 a C$300,000 porque ha crecido su negocio. El dueño debe evaluar y autorizar.
**Precondiciones:** Cliente con buen historial de pagos, solicitud formal de aumento
**Pasos:**
1. Dueño recibe solicitud de aumento de crédito de Cooperativa San Miguel
2. Revisa historial del cliente en el sistema:
   - Cliente desde 2023
   - Pagos puntuales: 95%
   - Deuda máxima usada: C$180,000
   - Ventas del último año: C$2,400,000
3. Dueño evalúa: el cliente es confiable y ha crecido
4. Autoriza aumento a C$300,000
5. En el sistema, selecciona el cliente y modifica límite
6. Ingresa nuevo límite: C$300,000
7. Motivo: "Crecimiento del negocio — buen historial de pagos"
8. Guarda cambios
9. Notifica al cliente: "Su límite de crédito ha sido aumentado a C$300,000"
10. Registra la decisión en el sistema
**Resultado esperado:** Límite de crédito actualizado, cliente notificado, decisión documentada
**Variante:** El historial muestra pagos atrasados frecuentes (60% puntualidad); dueño rechaza el aumento y sugiere mantener el límite actual
