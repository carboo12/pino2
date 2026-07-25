# Escenarios de Comisiones e Incentivos de Venta — Pino2 Los Pinos Central

---

## CM-001: Configuración de tasa de comisión por categoría de producto
**Rol:** Administrador / Dueño
**Duración:** 10 minutos
**Descripción:** Se establece una comisión del 3% para los vendedores de ruta en la categoría "Abarrotes" y 5% en "Bebidas".
**Precondiciones:** Categorías de producto configuradas
**Pasos:**
1. Administrador entra al módulo de Finanzas -> Comisiones -> Configuración
2. Crea una regla: Rol "vendedor", Categoría "Bebidas", Porcentaje 5%
3. Crea segunda regla: Rol "vendedor", Categoría "Abarrotes", Porcentaje 3%
4. Sistema activa las reglas para todas las ventas posteriores
**Resultado esperado:** Reglas de comisión almacenadas en `commission_rates` y activas

---

## CM-002: Cálculo automático de comisión al completar una venta
**Rol:** Sistema / Vendedor
**Duración:** Automático (<1 segundo)
**Descripción:** Vendedor realiza una venta por C$ 10,000 en bebidas. El sistema calcula automáticamente C$ 500 de comisión (5%).
**Precondiciones:** Tasa de comisión activa configurada
**Pasos:**
1. Vendedor procesa la venta en el POS o App Móvil
2. Al confirmarse el pago y crearse el registro en `sales`, el hook de comisiones se ejecuta
3. Sistema busca la tasa correspondiente (5%) y calcula: 10,000 * 0.05 = C$ 500.00
4. Registra entrada en `sales_commissions` con estado `PENDING`
**Resultado esperado:** Comisión asignada al vendedor en estado pendiente

---

## CM-003: Comisión condicionada a venta mínima alcanzada
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Regla de comisión requiere que la venta individual sea mayor o igual a C$ 2,000 para aplicar el 4%.
**Precondiciones:** Regla con `min_sale_amount = 2000`
**Pasos:**
1. Cliente realiza compra de C$ 1,500
2. Sistema evalúa la regla: 1,500 < 2,000 → No aplica comisión
3. Siguiente cliente compra C$ 2,500
4. Sistema evalúa la regla: 2,500 >= 2,000 → Aplica 4% (C$ 100)
**Resultado esperado:** Incentivo aplicado únicamente a ventas que superan la meta mínima

---

## CM-004: Liquidación y pago de comisiones quincenales
**Rol:** Administrador / Contador
**Duración:** 20 minutos
**Descripción:** Fin de quincena. Se revisan las comisiones acumuladas del vendedor Pedro Martínez (Total: C$ 4,200) y se procede al pago.
**Precondiciones:** Registros de comisiones en estado `PENDING`
**Pasos:**
1. Administrador abre el reporte de comisiones por cobrar del período
2. Selecciona al vendedor Pedro Martínez
3. Sistema muestra el desglose de 25 ventas con comisión aprobada
4. Administrador hace clic en "Marcar como Pagadas" o "Generar Pago"
5. Sistema actualiza el estado de los registros a `PAID` y fija `paid_at = NOW()`
**Resultado esperado:** Comisiones liquidadas y reflejadas como pagadas en la cuenta del empleado

---

## CM-005: Anulación de comisión por devolución total de venta
**Rol:** Administrador / Sistema
**Duración:** 5 minutos
**Descripción:** Un cliente devuelve un pedido completo de C$ 8,000 que ya había generado C$ 400 de comisión al vendedor.
**Precondiciones:** Venta previa con comisión en estado `PENDING`
**Pasos:**
1. Administrador o cajero procesa la devolución total de la venta en el módulo de Devoluciones
2. El sistema identifica que la venta tenía un registro en `sales_commissions`
3. Cambia el estado de la comisión asociada a `CANCELLED`
4. Se descuenta del balance de comisiones por cobrar del vendedor
**Resultado esperado:** Comisión anulada para evitar pago sobre ventas canceladas

---

## CM-006: Consulta de comisiones acumuladas desde la App Móvil
**Rol:** Vendedor / Preventista
**Duración:** 2 minutos
**Descripción:** El vendedor consulta desde su teléfono inteligente el total de comisiones que ha ganado en el mes actual.
**Precondiciones:** Usuario vendedor autenticado en Flutter App
**Pasos:**
1. Vendedor abre el menú de Mi Rendimiento / Comisiones en la App Móvil
2. La app consulta el endpoint `/commissions?storeId=X&userId=Y`
3. Muestra el resumen: C$ 6,800.00 Ganadas en el mes (C$ 5,200 pagadas, C$ 1,600 pendientes)
**Resultado esperado:** Vendedor visualiza su ganancia acumulada en tiempo real
