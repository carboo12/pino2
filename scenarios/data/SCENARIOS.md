# Escenarios de Datos — Pino2 Los Pinos Central

---

## D-001: Producto duplicado en el sistema
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se descubre que el producto "Arroz Faisán 1lb" existe dos veces en el catálogo con códigos diferentes (FAISAN1LB y FAISAN-1LB). Tienen precios e inventarios separados.
**Precondiciones:** Producto duplicado, códigos diferentes, inventarios inconsistentes
**Pasos:**
1. Cajero reporta: "Hay dos Arroz Faisán en el catálogo con diferente precio"
2. Administrador revisa:
   - FAISAN1LB: C$32, stock 150, código 744100123456
   - FAISAN-1LB: C$33, stock 80, código 744100123457
3. Confirma: es el mismo producto, duplicado por error de carga
4. Decide: unificar bajo FAISAN1LB (el código correcto)
5. En Pino2, selecciona "Unificar productos duplicados"
6. Producto destino: FAISAN1LB
7. Producto a eliminar: FAISAN-1LB
8. Sistema suma inventarios: 150 + 80 = 230
9. Precio se unifica al más reciente: C$32
10. Historial de ventas se consolida
11. Producto FAISAN-1LB se desactiva (no se elimina para mantener integridad)
**Resultado esperado:** Productos unificados, inventario consolidado, duplicado desactivado
**Variante:** Los precios son diferentes (C$32 vs C$33); se debe decidir cuál usar basado en el precio de compra más reciente

---

## D-002: Cliente duplicado en el sistema
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** "Comedor Santa Ana" está registrado dos veces con diferentes números de cliente: "COMEDOR01" y "COMEDOR02". Cada uno tiene saldos de crédito separados.
**Precondiciones:** Cliente duplicado, facturas en ambos registros, saldos separados
**Pasos:**
1. Administrador detecta: mismo nombre, misma dirección, dos cuentas
2. Revisa:
   - COMEDOR01: saldo C$5,000, ventas totales C$120,000
   - COMEDOR02: saldo C$3,000, ventas totales C$80,000
3. Confirma duplicidad (mismo RUC, mismo teléfono)
4. En Pino2, selecciona "Fusionar clientes"
5. Cuenta principal: COMEDOR01
6. Cuenta a fusionar: COMEDOR02
7. Sistema consolida:
   - Saldo: C$5,000 + C$3,000 = C$8,000
   - Límite: se mantiene el mayor
   - Historial: todo en una cuenta
8. COMEDOR02 se desactiva
9. Se notifica al cliente que se unificaron sus cuentas
**Resultado esperado:** Clientes fusionados, saldo consolidado, duplicado desactivado
**Variante:** Los límites de crédito son diferentes (C$50,000 y C$30,000); se consolida al límite mayor

---

## D-003: Precio incorrecto en el sistema
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El precio del Aceite Patrona 1L aparece como C$55 (precio de costo) en vez de C$85 (precio de venta). Se vendieron 20 unidades a precio incorrecto.
**Precondiciones:** Precio mal configurado, ventas ya realizadas al precio incorrecto
**Pasos:**
1. Cajero nota: "El Aceite Patrona está muy barato"
2. Administrador verifica: precio C$55 (costo) en vez de C$85 (venta)
3. Investiga: se cargó archivo con precios de costo en lugar de venta
4. Corrige precio inmediatamente: C$55 → C$85
5. Revisa ventas afectadas: 20 unidades vendidas a C$55 hoy
6. Pérdida: 20 x (C$85 - C$55) = C$600
7. Registra: "Ajuste por precio incorrecto — pérdida C$600"
8. Se investiga cómo se cargó el archivo incorrecto
9. Se implementa validación: alerta si precio de venta < costo + margen mínimo
**Resultado esperado:** Precio corregido, pérdida documentada, control implementado
**Variante:** Precio incorrecto era mayor (C$100 en vez de C$85); clientes pagaron de más — se debe reembolsar la diferencia

---

## D-004: Stock incorrecto en el sistema
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El sistema muestra 200 unidades de Huevos San Felipe pero físicamente hay 300. Hubo un error en la última recepción (se registraron 100 menos).
**Precondiciones:** Stock en sistema diferente al físico, error de recepción
**Pasos:**
1. Conteo cíclico detecta diferencia: sistema 200, físico 300
2. Diferencia: +100
3. Administrador investiga causa
4. Última recepción: factura del proveedor por 300, se registraron 200
5. Error: bodeguero ingresó 200 en vez de 300
6. Administrador corrige: ajuste de +100 unidades
7. Motivo: "Error en recepción — se registraron 200 de 300 reales"
8. Stock actualizado a 300
9. Se capacita al bodeguero para verificar cantidades al recibir
**Resultado esperado:** Stock corregido, diferencia documentada, causa identificada
**Variante:** El proveedor facturó 300 pero envió 200; se registraron 200 correctamente pero el sistema dice 200 cuando en realidad hay 300 — error de otro pedido

---

## D-005: Pedido duplicado
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Se generaron dos pedidos idénticos para el mismo cliente por error (el administrador hizo clic dos veces en "Generar pedido").
**Precondiciones:** Pedido duplicado creado, mismo cliente, mismos productos, mismo día
**Pasos:**
1. Administrador revisa pedidos del día
2. Encuentra: #ORD-2026-060 y #ORD-2026-061, exactamente iguales
3. Mismo cliente (Cooperativa San Miguel), mismos productos, mismos montos
4. Confirma: error de doble clic
5. El segundo pedido (#ORD-2026-061) ya se envió a bodega
6. Bodeguero ya empezó a preparar ambos
7. Administrador cancela el pedido duplicado #ORD-2026-061
8. Motivo: "Pedido duplicado — error de usuario"
9. Bodeguero notificado: detener preparación del segundo pedido
10. Productos del segundo pedido vuelven a inventario
**Resultado esperado:** Pedido duplicado cancelado, inventario no afectado, cliente no recibe doble pedido
**Variante:** Ambos pedidos ya se prepararon y están en el camión; el rutero debe regresar uno a bodega

---

## D-006: Venta duplicada
**Rol:** Adminstrador
**Duración:** 10 minutos
**Descripción:** Un cliente pagó dos veces la misma compra por error (el datáfono procesó dos veces la misma tarjeta). El sistema registró dos ventas.
**Precondiciones:** Venta duplicada por error del datáfono, cliente reclama
**Pasos:**
1. Cliente: "Me cobraron dos veces la misma compra"
2. Muestra estado de cuenta: dos cargos de C$3,500
3. Administrador busca en el sistema: dos ventas #V-789 y #V-790
4. Misma hora, mismo monto, misma tarjeta
5. Confirma: error de datáfono (doble transmisión)
6. Administrador anula una de las ventas (#V-790)
7. Motivo: "Duplicada por error del datáfono"
8. Se genera reverso bancario
9. Cliente recibirá el reembolso en 3-5 días hábiles
10. Se emite carta de aclaración al cliente
**Resultado esperado:** Venta duplicada anulada, reverso bancario iniciado, cliente notificado
**Variante:** El banco no puede reversar la transacción (ya pasaron 24 horas); se debe emitir reembolso en efectivo

---

## D-007: Usuario con permisos incorrectos
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Un bodeguero tiene permisos de administrador por error (configuración incorrecta al crearlo). Puede modificar precios y ver datos sensibles.
**Precondiciones:** Usuario con permisos excesivos, riesgo de seguridad
**Pasos:**
1. Dueño nota que el bodeguero "jramirez" modificó un precio ayer
2. Revisa: "jramirez" tiene rol de "Administrador" en vez de "Bodeguero"
3. Error de creación de usuario
4. Administrador accede a gestión de usuarios
5. Busca "jramirez"
6. Cambia rol de "Administrador" a "Bodeguero"
7. Permisos se actualizan:
   - Inventario: acceso completo
   - Precios: solo lectura
   - Ventas: sin acceso
   - Reportes: sin acceso
8. Guarda cambios
9. Se registra en auditoría: "Permisos corregidos — 25/07/2026"
10. Se revisa si hubo cambios no autorizados por este usuario
**Resultado esperado:** Permisos corregidos, riesgo de seguridad mitigado, auditoría de cambios realizados
**Variante:** El bodeguero ya realizó cambios maliciosos (modificó precios a favor de un amigo); se deben revertir y tomar acciones disciplinarias

---

## D-008: Fecha incorrecta en el sistema
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** La fecha del servidor está mal (25/07/2025 en vez de 25/07/2026). Todas las transacciones se registran con fecha incorrecta.
**Precondiciones:** Fecha del sistema incorrecta, transacciones con fecha errónea
**Pasos:**
1. Administrador genera reporte del día
2. Reporte muestra fecha: 25/07/2025 (un año atrás)
3. Verifica fecha del servidor: incorrecta
4. Causa: batería CMOS del servidor agotada
5. Corrección de fecha afecta:
   - Facturas electrónicas (fecha incorrecta = rechazo del SAT)
   - Reportes contables
   - Fechas de vencimiento de créditos
6. Administrador corrige fecha del servidor: 25/07/2026
7. Reinicia servicios de Pino2
8. Verifica que las transacciones de hoy se registren con la fecha correcta
9. Las transacciones ya registradas con fecha incorrecta deben corregirse
10. Administrador ejecuta script de corrección masiva de fechas
**Resultado esperado:** Fecha corregida, transacciones actualizadas, facturas re-timbradas si es necesario
**Variante:** El SAT rechazó 20 facturas por fecha incorrecta; se deben anular y reemitir

---

## D-009: Tipo de cambio incorrecto
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El tipo de cambio en el sistema está desactualizado (C$35.00 del mes pasado en vez de C$36.50 actual). Las ventas en dólares se convierten mal.
**Precondiciones:** Tipo de cambio desactualizado, ventas en dólares durante el día
**Pasos:**
1. Cajero procesa pago en dólares
2. Sistema convierte: USD $100 x C$35.00 = C$3,500
3. Tipo de cambio real del BCN: C$36.50
4. Debieron ser: C$3,650
5. Diferencia: -C$150 (la tienda pierde)
6. Administrador detecta: TC no se actualizó desde el mes pasado
7. Actualiza TC en sistema: C$36.50
8. Fecha efectiva: hoy
9. Revisa ventas afectadas del día: 5 ventas en dólares, pérdida total C$450
10. Registra: "Pérdida por tipo de cambio desactualizado — C$450"
11. Configura actualización automática diaria del TC
**Resultado esperado:** Tipo de cambio actualizado, pérdida documentada, automatización configurada
**Variante:** Tipo de cambio era mayor (C$38.00 en vez de C$36.50); clientes pagaron de más — se debe reembolsar

---

## D-010: Producto en categoría equivocada
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El Jabón Rey Lavandería está clasificado como "Cuidado personal" cuando debería ser "Limpieza del hogar". Esto afecta los reportes de ventas por categoría.
**Precondiciones:** Categoría incorrecta, reportes de ventas distorsionados
**Pasos:**
1. Dueño revisa reporte de ventas por categoría
2. "Cuidado personal" tiene ventas altas (por el jabón Rey)
3. "Limpieza del hogar" tiene ventas bajas
4. Dueño: "Algo está mal, el jabón Rey no es cuidado personal"
5. Administrador revisa categoría del producto
6. Jabón Rey Lavandería: categoría "Cuidado personal" (incorrecto)
7. Categoría correcta: "Limpieza del hogar"
8. Administrador cambia categoría
9. Reportes se actualizan automáticamente
10. Ventas de limpieza ahora reflejan la realidad
**Resultado esperado:** Producto reclasificado, reportes corregidos, análisis de ventas fiable
**Variante:** El cambio de categoría afecta el cálculo de IVA (diferentes tasas por categoría); se debe verificar

---

## D-011: Proveedor con datos incorrectos
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El proveedor "Aceitera Patrona" tiene el RUC incorrecto en el sistema. Esto causa que las facturas de compra no se puedan registrar fiscalmente.
**Precondiciones:** Proveedor con datos erróneos, facturas de compra no válidas fiscalmente
**Pasos:**
1. Administrador intenta registrar factura de compra de Aceitera Patrona
2. Sistema: "RUC del proveedor no válido — verifique con el SAT"
3. Administrador revisa datos del proveedor:
   - RUC registrado: J123456780 (incorrecto)
   - RUC real según factura: J123456789
4. Corrige el RUC en el sistema
5. Verifica otros datos: teléfono, dirección, correo
6. Actualiza datos faltantes
7. Intenta registrar la factura de compra nuevamente
8. Sistema acepta: RUC válido
9. Factura registrada correctamente
10. Se revisan facturas anteriores con RUC incorrecto para corregirlas
**Resultado esperado:** Datos del proveedor corregidos, factura registrada, cumplimiento fiscal restablecido
**Variante:** El RUC incorrecto ya se usó en compras anteriores; esas facturas no son deducibles de impuestos — se debe solicitar corrección al SAT

---

## D-012: Cliente con datos desactualizados
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El cliente "Pulpería Los Amigos" cambió de teléfono hace 3 meses pero no lo actualizó en el sistema. El rutero no puede contactarlo para una entrega.
**Precondiciones:** Datos de contacto desactualizados, entrega necesita confirmación
**Pasos:**
1. Rutero necesita contactar al cliente para confirmar entrega
2. Llama al número registrado: "El número no existe"
3. Reporta al administrador
4. Administrador busca datos del cliente
5. Teléfono: 8888-5678 (ya no funciona)
6. No hay otro medio de contacto
7. Rutero va a la dirección física para notificar
8. Cliente actualiza su teléfono en ese momento: 8888-9999
9. Administrador actualiza el teléfono en el sistema
10. Entrega se realiza
11. Se programa revisión periódica de datos de clientes
**Resultado esperado:** Datos actualizados, entrega realizada, proceso de actualización periódica implementado
**Variante:** Cliente se mudó y no actualizó dirección; el rutero va a la dirección antigua y no lo encuentra

---

## D-013: Historial de precios inconsistente
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El historial de precios del Arroz Faisán muestra cambios sin registro de quién los hizo ni cuándo exactamente. Auditoría incompleta.
**Precondiciones:** Historial de precios sin trazabilidad, cambios no registrados en auditoría
**Pasos:**
1. Dueño revisa historial de precio del Arroz Faisán
2. Precio cambió de C$30 a C$32 hace 2 meses
3. No hay registro de quién hizo el cambio ni por qué
4. Dueño: "Necesito saber quién autorizó este cambio"
5. Administrador revisa logs de auditoría
6. Logs de ese período están incompletos (falló el registro)
7. No se puede determinar quién cambió el precio
8. Se implementa: registro obligatorio de motivo y usuario en cambios de precio
9. Se refuerza bitácora de auditoría
10. Para este caso, se asume que fue un cambio legítimo basado en costo
**Resultado esperado:** Historial inconsistente identificado, controles implementados para futuros cambios
**Variante:** Se descubre que un empleado cambió precios sin autorización durante ese período; se toman acciones disciplinarias

---

## D-014: Unidad de medida incorrecta
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** El producto "Aceite Patrona 1L" está configurado con unidad de medida "kg" en vez de "L". No afecta el precio pero causa confusión en reportes.
**Precondiciones:** Unidad de medida incorrecta, producto líquido configurado como sólido
**Pasos:**
1. Administrador revisa reporte de inventario
2. Aceite Patrona aparece con unidad "kg"
3. Es un producto líquido: debería ser "L" o "unidad"
4. Error de configuración inicial
5. Administrador corrige unidad: de "kg" a "L"
6. Verifica que la conversión a bultos sigue correcta
7. Bulto = 6 unidades x 1L = 6L
8. Guarda cambios
9. Reportes futuros mostrarán la unidad correcta
10. Historial queda con la unidad antigua (no se modifica para consistencia)
**Resultado esperado:** Unidad de medida corregida, reportes precisos, sin impacto en precios o inventario
**Variante:** El error de unidad afecta el cálculo de flete (el flete se cobra por peso, no por volumen); se deben ajustar facturas de flete

---

## D-015: Conversión bulto/unidad incorrecta
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El sistema tiene configurado que 1 bulto de Aceite Patrona = 4 unidades, pero en realidad cada bulto contiene 6 unidades.
**Precondiciones:** Factor de conversión incorrecto, inventario distorsionado
**Pasos:**
1. Bodeguero recibe 10 bultos de Aceite Patrona (60 unidades reales)
2. Registra en sistema como bultos: 10 bultos
3. Sistema convierte: 10 bultos x 4 unidades/bulto = 40 unidades (incorrecto)
4. Deberían ser: 10 x 6 = 60 unidades
5. Diferencia: faltan 20 unidades en el sistema
6. Al vender, el inventario se agota más rápido de lo real
7. Administrador detecta: al vender 5 bultos, sistema descuenta 20 unidades
8. Pero realmente se vendieron 30 unidades
9. Investigación: factor de conversión incorrecto
10. Corrige factor: 1 bulto = 6 unidades
11. Ajusta inventario actual: +20 unidades (la diferencia acumulada)
**Resultado esperado:** Factor de conversión corregido, inventario ajustado, ventas futuras precisas
**Variante:** El error está en todos los productos con presentación bulto/unidad; se debe hacer corrección masiva
