# Escenarios de Reportes y Auditoría — Pino2 Los Pinos Central

---

## RP-001: Reporte diario de ventas
**Rol:** Administrador / Dueño
**Duración:** 15 minutos
**Descripción:** Fin del día. Se genera el reporte de ventas del día para revisar totales, métodos de pago y productos más vendidos.
**Precondiciones:** Ventas realizadas durante el día
**Pasos:**
1. Administrador solicita reporte de ventas del día
2. Sistema calcula: total C$234,567, 45 transacciones, 12 a crédito
3. Desglose por método de pago: efectivo C$180,000, tarjeta C$54,567
4. Top 5 productos: Arroz Faisán (120 unid), Aceite Patrona (85 unid), etc.
5. Administrador revisa y compara con el día anterior
6. Exporta a PDF/Excel para enviar al dueño
7. Cierra el día en el sistema
**Resultado esperado:** Reporte generado con totales, tendencias y top productos
**Variante:** Una venta no cuadra con el arqueo de caja → se investiga la diferencia

---

## RP-002: Corte semanal de ventas por ruta
**Rol:** Supervisor
**Duración:** 30 minutos
**Descripción:** Fin de semana. Se revisa el desempeño de cada ruta: ventas, cobros, devoluciones y eficiencia.
**Precondiciones:** Rutas completadas durante la semana
**Pasos:**
1. Supervisor solicita reporte semanal por ruta
2. Sistema muestra: Ruta Masaya C$45,000 (5 devoluciones), Ruta León C$52,000 (2 devoluciones)
3. Calcula eficiencia: Masaya 90%, León 95%
4. Identifica rutas con alta devolución
5. Programa reunión con el rutero de Masaya
6. Exporta reporte para gerencia
**Resultado esperado:** Reporte semanal por ruta con indicadores clave
**Variante:** Una ruta tuvo 0% de cobro → se investiga si el rutero no cobró o hubo problemas

---

## RP-003: Auditoría de inventario mensual
**Rol:** Administrador / Bodeguero
**Duración:** 4 horas
**Descripción:** Fin de mes. Se realiza conteo físico de todos los productos en bodega. El sistema debe tener 0 diferencias contra el conteo físico.
**Precondiciones:** Productos en bodega, sistema con registros del mes
**Pasos:**
1. Bodeguero imprime hoja de conteo (lista de productos con stock esperado)
2. Equipo de 2 personas realiza conteo físico (uno cuenta, otro anota)
3. Ingresa resultados en el sistema
4. Sistema compara: stock en sistema vs stock físico
5. Genera reporte de diferencias
6. Para cada diferencia, investiga causa (venta no registrada, robo, error)
7. Ajusta inventario con aprobación del administrador
**Resultado esperado:** Inventario ajustado, diferencias investigadas y documentadas
**Variante:** Diferencia mayor a C$50,000 → se requiere autorización del dueño para ajustar

---

## RP-004: Reporte de cuentas por cobrar (antigüedad de saldos)
**Rol:** Administrador / Cobrador
**Duración:** 20 minutos
**Descripción:** Se genera el reporte de antigüedad de saldos para identificar clientes morosos y priorizar cobros.
**Precondiciones:** Clientes con saldos pendientes
**Pasos:**
1. Administrador solicita reporte de antigüedad de saldos
2. Sistema clasifica: 0-30 días (C$120,000), 31-60 días (C$45,000), 61-90 días (C$12,000), +90 días (C$3,000)
3. Identifica clientes en cada categoría
4. Asigna prioridad de cobro: +90 días primero
5. Programa visitas de cobro para la próxima semana
6. Envía reporte a gerencia
**Resultado esperado:** Reporte de antigüedad generado, cobros priorizados
**Variante:** Cliente en +90 días desaparece → se inicia proceso de castigo de cuenta

---

## RP-005: Auditoría de precios (cumplimiento de lista)
**Rol:** Supervisor
**Duración:** 2 horas
**Descripción:** El dueño sospecha que algunos vendedores están dando descuentos no autorizados. Se revisan las últimas 100 ventas para verificar precios.
**Precondiciones:** Ventas registradas en el sistema
**Pasos:**
1. Supervisor solicita reporte de ventas con precio vs lista
2. Sistema muestra 100 transacciones
3. Filtra: ventas donde priceLevel usado ≠ 1 (nivel regular)
4. Encuentra 12 ventas con priceLevel 3 y 2 con priceLevel 4
5. Verifica que cada priceLevel 4 tenga autorización
6. Las 2 ventas con priceLevel 4 no tienen autorización
7. Cita a los vendedores involucrados para investigación
**Resultado esperado:** Auditoría completa, descuentos no autorizados identificados
**Variante:** Se descubre que un vendedor daba descuentos a cambio de comisiones ilegales → medida disciplinaria

---

## RP-006: Reporte de productos de lenta rotación
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se genera el reporte de productos que no se han vendido en los últimos 60 días para planificar liquidaciones o devoluciones al proveedor.
**Precondiciones:** Productos con ventas = 0 en últimos 60 días
**Pasos:**
1. Administrador solicita reporte de productos lentos
2. Sistema identifica 23 productos sin ventas en 60 días
3. Valor total de inventario lento: C$128,000
4. Decide: 15 productos se ponen en promoción (20% descuento)
5. 5 productos se devuelven al proveedor
6. 3 productos se donan (próximos a vencer)
7. Programa acciones en el sistema
**Resultado esperado:** Productos lentos identificados, plan de acción creado
**Variante:** Un producto lento es de temporada (ejemplo: útiles escolares) → se mantiene en inventario
