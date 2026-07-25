# Escenarios de Tecnología — Pino2 Los Pinos Central

---

## T-001: Corte de energía eléctrica
**Rol:** Todos
**Duración:** Variable (30 min - 4 horas)
**Descripción:** Unión Fenosa (ahora Disnorte) programa un corte de energía en el sector de Los Pinos. Sin electricidad, los equipos dejan de funcionar.
**Precondiciones:** Corte programado o imprevisto, UPS disponible, sistema debe proteger datos
**Pasos:**
1. Se va la luz — todos los equipos de escritorio se apagan
2. UPS emite alerta sonora
3. Servidor queda en UPS (15 min de respaldo)
4. Cajeros no pueden operar POS
5. Bodeguero no puede usar terminal
6. Administrador activa plan de contingencia:
   - Ventas manuales (cuaderno)
   - Clientes pagan y se registran cuando vuelva la luz
7. Servidor inicia apagado seguro a los 10 min (batería baja)
8. 2 horas después, regresa la energía
9. Todos los equipos se encienden
10. Servidor inicia y verifica integridad de datos
11. Ventas manuales se ingresan al sistema
**Resultado esperado:** Corte manejado, datos protegidos, ventas manuales recuperadas al restablecer energía
**Variante:** Corte no programado — el servidor no hizo apagado seguro (data corruption); se debe restaurar desde backup

---

## T-002: Pérdida de conexión a internet
**Rol:** Todos
**Duración:** Variable
**Descripción:** El ISP (Claro Nicaragua) tiene una falla en el sector. No hay internet. El sistema debe operar en modo offline.
**Precondiciones:** Conexión a internet perdida, sistema configurado para modo offline
**Pasos:**
1. Cajero nota: "Sin conexión a internet"
2. Sistema POS entra automáticamente a modo offline
3. Ventas se procesan localmente
4. Datos se almacenan en caché local
5. Cajero continúa operando normal
6. Administrador reporta la falla a Claro
7. Claro: "Falla en el sector, 3 horas para reparar"
8. Sistema sigue operando offline
9. Internet regresa
10. Sistema sincroniza todas las ventas offline
11. No se pierde ninguna transacción
**Resultado esperado:** Operación continua en modo offline, sincronización exitosa al restablecer conexión
**Variante:** Caché local se llena (sin conexión por más de 8 horas); algunas transacciones pueden perderse

---

## T-003: Servidor caído
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** El servidor principal de Pino2 (físico en la tienda) no responde. Pantalla azul / kernel panic. El sistema completo está caído.
**Precondiciones:** Servidor con falla crítica, backup disponible, plan de contingencia
**Pasos:**
1. Administrador intenta acceder al sistema — no responde
2. Verifica físicamente el servidor: pantalla azul
3. Reinicia el servidor — no inicia (disco dañado)
4. Administrador decide restaurar desde backup:
   - Backup de anoche a las 10 PM
   - Se pierden datos de hoy
5. Monta backup en servidor de respaldo
6. Restaura base de datos (2 horas)
7. Sistema vuelve a funcionar con datos de ayer
8. Ventas de hoy se perdieron: C$12,000
9. Se ingresan manualmente con tickets físicos
10. Se solicita reemplazo de disco dañado
**Resultado esperado:** Servidor restaurado desde backup, datos de hoy recuperados manualmente, pérdida mínima
**Variante:** No hay backup reciente (falló el backup automático); se pierden 3 días de datos — desastre operativo

---

## T-004: Base de datos lenta
**Rol:** Todos
**Duración:** 30 minutos
**Descripción:** La base de datos responde muy lento. Las transacciones que toman 2 segundos ahora toman 30 segundos. Las ventas se acumulan en fila.
**Precondiciones:** Base de datos con rendimiento degradado, múltiples usuarios conectados
**Pasos:**
1. Cajero intenta escanear producto — tarda 15 segundos en responder
2. Cliente se impacienta
3. Todos los cajeros reportan lentitud
4. Administrador revisa el servidor
5. Disco duro al 95% de capacidad — causa lentitud extrema
6. Administrador libera espacio: borra logs temporales (5GB)
7. Rendimiento mejora inmediatamente
8. Cajeros pueden operar normal
9. Se programa limpieza automática semanal de logs
**Resultado esperado:** Lentitud resuelta, disco liberado, operaciones normalizadas
**Variante:** Lentitud es por consulta mal optimizada (reporte pesado corriendo en hora pico); se mata el proceso y se reprograma

---

## T-005: Disco duro lleno
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** El disco duro del servidor está al 100%. El sistema no puede escribir nuevos datos: ni ventas, ni inventario, ni facturas.
**Precondiciones:** Almacenamiento crítico, sistema en riesgo de detenerse
**Pasos:**
1. Administrador recibe alerta: "Disco duro al 100% — riesgo de pérdida de datos"
2. Sistema comienza a fallar: ventas no se guardan
3. Administrador accede al servidor (si puede)
4. Identifica archivos grandes:
   - Logs de transacciones: 20GB
   - Backup temporal: 15GB
   - Archivos de reportes: 5GB
5. Elimina logs antiguos (mayores a 30 días) — 15GB liberados
6. Mueve backup a disco externo — 15GB liberados
7. Disco queda en 30% de uso
8. Sistema se restablece
9. Configura alerta temprana al 80% de capacidad
**Resultado esperado:** Disco liberado, sistema restablecido, alertas configuradas para prevención
**Variante:** El crecimiento del disco es por una tabla de base de datos sin índice; se debe optimizar la DB

---

## T-006: Error de sincronización móvil
**Rol:** Rutero
**Duración:** 15 minutos
**Descripción:** La app móvil del rutero no sincroniza los datos de entregas del día. Los pedidos aparecen como "no entregados" en el sistema central.
**Precondiciones:** App móvil con datos offline, sincronización falla
**Pasos:**
1. Rutero completa 10 entregas en modo offline
2. Regresa a zona con cobertura
3. App intenta sincronizar — error: "Fallo de sincronización"
4. Rutero reintenta 3 veces — mismo error
5. Reporta al administrador
6. Administrador verifica: el servidor está OK
7. Problema: token de autenticación expiró en el dispositivo
8. Rutero cierra sesión y vuelve a iniciar
9. App se autentica de nuevo con token fresco
10. Sincronización exitosa — 10 entregas registradas
**Resultado esperado:** Sincronización resuelta, entregas registradas, token renovado
**Variante:** Error de sincronización por duplicados (IDs de transacción conflictivos); se deben resolver manualmente

---

## T-007: Token expirado en medio de operación
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** El token de autenticación del cajero expira en medio de una venta. La sesión se cierra inesperadamente.
**Precondiciones:** Token de sesión con tiempo de vida limitado, vencimiento en medio de operación
**Pasos:**
1. Cajero procesando venta
2. Escanea 5 productos
3. Al presionar "Totalizar" — sesión cerrada: "Token expirado"
4. Cajero no puede completar la venta
5. Cajero inicia sesión de nuevo
6. Sistema recuerda la venta en curso (sesión persistente)
7. Los 5 productos aún están en el carrito
8. Cajero completa la venta
9. Cliente esperó 1 minuto extra
10. Venta procesada correctamente
**Resultado esperado:** Token renovado, venta recuperada, cliente atendido con demora mínima
**Variante:** Sistema no recuerda la venta en curso; cajero debe volver a escanear los 5 productos

---

## T-008: Sesión simultánea en dos dispositivos
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un empleado inicia sesión en dos dispositivos al mismo tiempo (POS y tablet). El sistema debe manejar la sesión concurrente.
**Precondiciones:** Misma cuenta, dos dispositivos diferentes
**Pasos:**
1. Cajero "mlopez" inicia sesión en POS Caja #1
2. Cajero "mlopez" inicia sesión en tablet de bodega
3. Sistema detecta sesión simultánea
4. Alerta: "El usuario mlopez tiene una sesión activa en otro dispositivo"
5. Opciones:
   a. Cerrar sesión anterior
   b. Permitir ambas (si configurado)
6. Política de la empresa: no permitir sesiones simultáneas
7. Sistema cierra la sesión más antigua (POS)
8. Cajero en POS: "Sesión cerrada por inicio en otro dispositivo"
9. Cajero debe decidir qué dispositivo usar
10. Sesión única establecida en el dispositivo más reciente
**Resultado esperado:** Sesión única mantenida, usuario notificado, actividad sospechosa registrada
**Variante:** Es el administrador en dos dispositivos (permitido); el sistema no cierra sesiones si el usuario es administrador

---

## T-009: Navegador incompatible
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Un empleado abre Pino2 en un navegador no soportado (Internet Explorer). La interfaz se ve mal y algunas funciones no funcionan.
**Precondiciones:** Navegador no soportado, sistema Pino2 requiere Chrome/Firefox/Edge
**Pasos:**
1. Empleado abre Pino2 en Internet Explorer
2. Página se ve distorsionada: botones fuera de lugar, texto ilegible
3. Empleado intenta crear un pedido — el botón "Guardar" no funciona
4. Reporta: "El sistema está dañado"
5. Administrador verifica: navegador IE 11 (no soportado)
6. Administrador: "Usa Google Chrome"
7. Empleado abre Chrome
8. Pino2 se ve correctamente
9. Funciones trabajan normal
10. Administrador configura Chrome como navegador predeterminado
**Resultado esperado:** Navegador correcto identificado, empleado usando Chrome, sistema funciona
**Variante:** Empleado no puede instalar Chrome (sin permisos de administrador de Windows); TI debe instalar remotamente

---

## T-010: App móvil se cierra inesperadamente
**Rol:** Rutero
**Duración:** 5 minutos
**Descripción:** La app de Pino2 en el teléfono del rutero se cierra sola en medio de una entrega. Sin la app, no puede procesar la entrega.
**Precondiciones:** App instalada, cierre inesperado (crash)
**Pasos:**
1. Rutero llega a una entrega
2. Abre la app para procesar
3. App se cierra inmediatamente (crash al abrir)
4. Rutero reintenta 2 veces — mismo resultado
5. Rutero cierra la app desde el administrador de tareas
6. Reinicia el teléfono
7. Abre la app nuevamente
8. App funciona correctamente
9. Procesa la entrega (la app recuperó los datos locales)
10. Reporta el incidente al administrador
**Resultado esperado:** App reiniciada, entrega procesada, incidente reportado para mejorar estabilidad
**Variante:** El crash ocurre cada vez que abre la app (bug persistente); el rutero debe usar formulario en papel y el administrador ingresa los datos manualmente

---

## T-011: Error de red WiFi local
**Rol:** Cajero
**Duración:** 10 minutos
**Descripción:** La red WiFi local de la tienda falla. Los POS están conectados por WiFi al servidor local. Sin WiFi, no hay comunicación.
**Precondiciones:** Red WiFi caída, equipos dependen de conectividad local
**Pasos:**
1. Cajero nota: el POS no responde
2. Otros cajeros: mismo problema
3. Administrador revisa: router WiFi sin luz
4. Router se sobrecalentó y se apagó
5. Administrador desconecta y vuelve a conectar el router
6. Router tarda 3 minutos en iniciar
7. WiFi se restablece
8. POS se reconectan automáticamente
9. Operaciones normales reanudadas
10. Se programa ventilación adicional para el router
**Resultado esperado:** Router reiniciado, WiFi restablecido, POS reconectados
**Variante:** Router dañado (no enciende); se usa router de respaldo mientras llega reemplazo

---

## T-012: Cable de red desconectado
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** El cable de red del servidor se desconectó accidentalmente (lo jaló la señora de limpieza). El sistema se cae para todos.
**Precondiciones:** Cable físico desconectado, pérdida total de conectividad
**Pasos:**
1. Todos los POS se quedan sin conexión
2. Cajeros: "Se cayó el sistema"
3. Administrador revisa servidor
4. Cable de red del switch principal está desconectado
5. Lo conecta de nuevo
6. Todos los equipos se reconectan
7. Sistema funciona normal
8. Administrador investiga: la señora de limpieza jaló el cable al pasar la aspiradora
9. Se asegura el cable con cinta adhesiva al piso
10. Se da instrucción de cuidado al personal de limpieza
**Resultado esperado:** Cable reconectado, sistema restablecido, medida preventiva tomada
**Variante:** El conector del cable se dañó al jalarlo; se debe crimpar un nuevo conector RJ45

---

## T-013: UPS activado (respaldo de energía)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Corte de luz, el UPS del servidor entra en acción. El administrador debe monitorear la duración del UPS y apagar servidores de forma segura si es necesario.
**Precondiciones:** Corte de energía, UPS funcionando con batería
**Pasos:**
1. Corte de luz — UPS emite pitido cada 30 segundos
2. Servidor sigue funcionando con batería (30 min estimados)
3. Administrador verifica estado del UPS: batería al 100%
4. Apaga equipos no esenciales (monitores, impresoras) para ahorrar batería
5. Monitorea tiempo restante
6. A los 15 minutos: UPS al 40%
7. Si el corte continúa, inicia apagado seguro del servidor
8. A los 20 minutos: vuelve la luz
9. UPS cambia a modo normal (carga baterías)
10. Servidor sigue funcionando sin interrupción
11. Todo normal
**Resultado esperado:** Corte manejado con UPS, servidor sin interrupción, apagado seguro evitado
**Variante:** Corte dura 45 minutos; UPS se agota, servidor se apaga abruptamente — riesgo de corrupción de datos

---

## T-014: Servidor en mantenimiento programado
**Rol:** Administrador
**Duración:** 1 hora
**Descripción:** Se programa mantenimiento del servidor (actualización de seguridad de Windows, limpieza física). El sistema estará fuera de línea.
**Precondiciones:** Mantenimiento programado, horario de menor actividad (domingo 6 AM), usuarios notificados
**Pasos:**
1. Administrador notifica a todos: "Sistema fuera de servicio domingo 6-7 AM"
2. Domingo 6 AM: Administrador inicia sesión
3. Notifica a todos que el sistema se va a caer
4. Cierra aplicaciones de usuario
5. Detiene servicios de Pino2
6. Aplica actualizaciones de Windows (parches de seguridad)
7. Limpia físicamente el servidor (polvo, ventiladores)
8. Verifica espacio en disco
9. Realiza backup de seguridad
10. Reinicia el servidor
11. Todos los servicios inician correctamente
12. Verifica: sistema funciona
13. Notifica: "Mantenimiento completado"
**Resultado esperado:** Mantenimiento exitoso, sistema actualizado y limpio, tiempo de inactividad mínimo
**Variante:** Actualización de Windows causa conflicto con Pino2; se debe restaurar a estado anterior

---

## T-015: Backup automático en hora pico
**Rol:** Administrador
**Duración:** 30 minutos
**Descripción:** El backup automático está programado para las 8 AM (hora pico). El servidor se pone lento porque el backup consume recursos.
**Precondiciones:** Backup automático mal configurado, hora pico de ventas
**Pasos:**
1. Hora pico: 8 AM, fila de clientes
2. POS se pone lento — transacciones tardan 30 segundos
3. Cajeros reportan lentitud extrema
4. Administrador revisa servidor: backup automático en ejecución
5. Backup consume 80% de CPU y 90% de I/O de disco
6. Administrador detiene el backup
7. Rendimiento se restablece inmediatamente
8. Reprograma backup para las 2 AM
9. Configura backup incremental nocturno y full semanal
10. Reporta a soporte técnico: "Cambiar horario de backup automático"
**Resultado esperado:** Backup detenido, rendimiento restablecido, backup reprogramado para madrugada
**Variante:** Backup no se puede detener (ya está en mitad del proceso); se debe esperar que termine (30 minutos de lentitud)
