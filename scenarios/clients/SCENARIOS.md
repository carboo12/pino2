# Escenarios de Clientes — Pino2 Los Pinos Central

---

## CL-001: Cliente nuevo con crédito
**Rol:** Administrador
**Duración:** 20 minutos
**Descripción:** Un nuevo cliente (Don Pedro, dueño de "Pulpería El Chino" en Ciudad Sandino) solicita abrir cuenta de crédito. Se debe evaluar y registrar.
**Precondiciones:** Cliente no existe en el sistema, solicita crédito, presenta documentos
**Pasos:**
1. Cliente llega con documentos: cédula, RUC, referencia comercial
2. Administrador verifica documentos
3. En Pino2, selecciona "Nuevo cliente"
4. Ingresa datos personales:
   - Nombre: Pedro José Martínez
   - Negocio: Pulpería El Chino
   - Cédula: 001-150880-1234Y
   - RUC: J123456789
   - Dirección: Ciudad Sandino, Managua
   - Teléfono: 8888-1234
5. Solicita crédito de C$15,000
6. Administrador evalua:
   - Referencia comercial: Distribuidora doña Mary (buena referencia)
   - Fotos del negocio: aceptable
7. Aprueba crédito: C$10,000 (conservador por ser nuevo)
8. Configura plazo: 30 días
9. Cliente firma contrato digital
10. Cliente activado para compras a crédito
**Resultado esperado:** Cliente registrado, crédito de C$10,000 aprobado, contrato firmado
**Variante:** Cliente no tiene RUC; se registra como consumidor final (sin factura fiscal)

---

## CL-002: Cliente con historial de pagos puntual
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** La Cooperativa San Miguel tiene 2 años pagando puntualmente. Se le puede aumentar el límite de crédito como beneficio.
**Precondiciones:** Cliente existente, 24 meses de pagos puntuales, límite actual C$50,000
**Pasos:**
1. Administrador revisa reporte de "Clientes puntuales"
2. Sistema lista Cooperativa San Miguel: 24 meses sin mora
3. Administrador inicia revisión de aumento de límite
4. Evalúa: ventas promedio mensual C$35,000, pagos antes de fecha
5. Decide aumentar límite de C$50,000 a C$75,000
6. En Pino2, modifica límite de crédito
7. Ingresa motivo: "Historial de pagos puntual — 24 meses"
8. Sistema registra cambio en auditoría
9. Se notifica al cliente
**Resultado esperado:** Límite incrementado a C$75,000, cliente notificado, buen historial recompensado
**Variante:** Cliente no quiere aumento porque "no se confía en deber tanto"; se respeta su decisión

---

## CL-003: Cliente moroso (30+ días)
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** La Licorería El Chele tiene C$18,500 vencido desde hace 35 días. No ha pagado ni respondido llamadas.
**Precondiciones:** Cliente con saldo vencido, 30+ días, gestión de cobro iniciada
**Pasos:**
1. Sistema genera alerta automática: "Cliente moroso — 35 días"
2. Administrador abre el caso
3. Revisa historial: pagó puntual 6 meses, luego empezó a atrasarse
4. Último pago: hace 40 días (C$5,000)
5. Saldo actual: C$18,500 vencido
6. Administrador intenta llamar — no contesta
7. En Pino2, cambia estatus: "Moroso — gestión de cobro"
8. Activa restricción: "No vender a crédito"
9. Envía mensaje de cobro automático al cliente
10. Programa visita de cobro para mañana
**Resultado esperado:** Cliente marcado como moroso, bloqueo de crédito activado, gestión de cobro iniciada
**Variante:** Cliente contesta y se compromete a pagar C$10,000 mañana y el resto en 15 días; se registra el acuerdo

---

## CL-004: Cliente con límite de crédito excedido
**Rol:** Cajero
**Duración:** 3 minutos
**Descripción:** Cliente (Comedor Santa Ana) quiere comprar C$6,000 a crédito pero su límite es C$50,000 y ya tiene saldo de C$47,000. Solo dispone de C$3,000.
**Precondiciones:** Cliente con crédito, saldo actual C$47,000, límite C$50,000, nueva compra C$6,000
**Pasos:**
1. Cajero inicia venta a crédito
2. Sistema calcula: saldo C$47,000 + nueva C$6,000 = C$53,000 > C$50,000
3. Sistema bloquea: "Límite de crédito excedido"
4. Cajero informa al cliente
5. Cliente puede:
   a. Reducir la compra a C$3,000 (cabe en el límite)
   b. Pagar C$3,000 en efectivo y el resto a crédito
   c. Pagar saldo pendiente primero
6. Cliente decide: paga C$3,000 efectivo y C$3,000 a crédito
7. Venta procesada: efectivo C$3,000 + crédito C$3,000
**Resultado esperado:** Venta parcial a crédito, parcial efectivo, dentro del límite disponible
**Variante:** Administrador autoriza exceder temporalmente el límite (cliente confiable); se registra autorización especial

---

## CL-005: Cliente que paga antes de la fecha
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** La Escuela Rubén Darío paga su factura de C$12,000 antes de la fecha de vencimiento. Tiene derecho a descuento por pronto pago.
**Precondiciones:** Factura con vencimiento en 20 días, cliente paga anticipado, política de pronto pago del 2%
**Pasos:**
1. Cliente llega a pagar factura #FAC-2026-320 (C$12,000)
2. Factura vence en 20 días (15/08/2026), hoy es 25/07/2026
3. Cajero busca la factura en "Cuentas por cobrar"
4. Sistema muestra: "Pago anticipado — aplica 2% descuento"
5. Descuento: C$12,000 x 2% = C$240
6. Total a pagar: C$11,760
7. Cajero procesa pago: efectivo C$11,760
8. Sistema registra descuento por pronto pago
9. Factura marcada como "Pagada con descuento"
10. Cliente ahorró C$240
**Resultado esperado:** Factura pagada antes de fecha, descuento aplicado, cliente beneficiado
**Variante:** Cliente paga antes pero no solicita descuento; cajero debe informarle del beneficio si aplica

---

## CL-006: Cliente que paga después de la fecha
**Rol:** Cajero
**Duración:** 5 minutos
**Descripción:** Cliente paga su factura con 10 días de retraso. Se aplican intereses por mora.
**Precondiciones:** Factura vencida, política de mora del 1.5% mensual
**Pasos:**
1. Cliente llega a pagar factura #FAC-2026-300 (C$8,500)
2. Vencimiento: 15/07/2026, hoy: 25/07/2026 (10 días de retraso)
3. Cajero busca la factura
4. Sistema muestra: "Vencida — recargo por mora aplicable"
5. Cálculo: C$8,500 x 1.5% / 30 días x 10 días = C$42.50
6. Total a pagar: C$8,542.50
7. Cajero informa al cliente del recargo
8. Cliente paga: C$8,542.50
9. Sistema registra pago con mora
10. Factura marcada como "Pagada con mora"
**Resultado esperado:** Factura pagada, recargo por mora cobrado, cliente actualizado
**Variante:** Cliente se queja del recargo y pide que se lo condonen; administrador puede autorizar condonación por única vez

---

## CL-007: Cliente que no paga (incobrable)
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Un cliente (Distribuidora Pérez) acumuló C$45,000 en deuda, no responde llamadas, no se le encuentra en la dirección registrada. Se declara incobrable.
**Precondiciones:** Deuda de 120+ días, múltiples gestiones fallidas, cliente ilocalizable
**Pasos:**
1. Administrador genera reporte de cuentas incobrables
2. Sistema lista: Distribuidora Pérez, C$45,000, 120 días vencido
3. Administrador verifica: 3 visitas de cobro sin éxito
4. Dirección: casa cerrada, vecinos dicen que se mudó
5. En Pino2, cambia estatus: "Incobrable — castigo contable"
6. Sistema provisiona la deuda como pérdida
7. Bloquea al cliente para futuras ventas
8. Genera reporte para contabilidad (castigo)
9. Si aplica, envía caso a abogados para cobro judicial
10. Se reporta a la central de riesgos (SINIR)
**Resultado esperado:** Deuda castigada contablemente, cliente bloqueado, caso reportado
**Variante:** Cliente aparece después de 1 año a pagar (herencia, venta de propiedad); se reactiva la cuenta

---

## CL-008: Cliente con grupo económico
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El dueño de "Pulpería Los Amigos" también es dueño de "Licorería El Chele" y "Bodega San Miguel". Se deben agrupar como un solo grupo económico para control de crédito unificado.
**Precondiciones:** Múltiples clientes con el mismo dueño, sistema debe consolidar riesgo crediticio
**Pasos:**
1. Administrador detecta que 3 clientes comparten el mismo dueño (Don Carlos)
2. En Pino2, selecciona "Grupo económico"
3. Crea grupo: "Grupo Don Carlos"
4. Agrega clientes:
   - Pulpería Los Amigos (límite C$30,000, saldo C$15,000)
   - Licorería El Chele (límite C$25,000, saldo C$20,000)
   - Bodega San Miguel (límite C$20,000, saldo C$8,000)
5. Sistema consolida: límite total C$75,000, saldo total C$43,000
6. Nuevo límite consolidado: C$60,000 (reducido para controlar riesgo)
7. Cada cliente hereda el límite consolidado
8. Don Carlos acepta la nueva condición
**Resultado esperado:** Grupo económico creado, límite consolidado, riesgo crediticio controlado
**Variante:** Un cliente del grupo se atrasa; afecta la capacidad de crédito de los otros clientes del grupo

---

## CL-009: Cliente que cambia de dirección
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Doña Elena (Pulpería Los Amigos) se mudó del Mercado Oriental a un local en el Mercado Iván Montenegro. Se debe actualizar su dirección.
**Precondiciones:** Cliente existente, notifica cambio de dirección
**Pasos:**
1. Doña Elena llama: "Me mudé al Mercado Iván Montenegro, local 42"
2. Administrador busca al cliente en el sistema
3. Selecciona "Editar cliente"
4. Actualiza dirección:
   - Anterior: Mercado Oriental, módulo 5, Managua
   - Nueva: Mercado Iván Montenegro, local 42, Managua
5. Actualiza teléfono de contacto
6. Guarda cambios
7. Sistema registra: "Dirección actualizada — 25/07/2026"
8. Rutas de entrega se actualizan automáticamente
**Resultado esperado:** Dirección actualizada, rutas recalculadas, entregas futuras van a la nueva dirección
**Variante:** Cliente cambia de dirección pero no lo reporta; el rutero llega a la dirección antigua y no encuentra al cliente

---

## CL-010: Cliente que cierra su cuenta
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Don Toño (Pulpería Los Amigos) cierra su negocio porque se jubila. Solicita cerrar su cuenta. Tiene saldo pendiente de C$3,500.
**Precondiciones:** Cliente existente, saldo pendiente, solicitud de cierre
**Pasos:**
1. Don Toño llega: "Voy a cerrar el negocio, necesito cerrar mi cuenta"
2. Administrador verifica saldo pendiente: C$3,500
3. Cliente paga el saldo completo
4. En Pino2, selecciona "Cerrar cuenta de cliente"
5. Motivo: "Cierre de negocio por jubilación"
6. Sistema bloquea al cliente para nuevas ventas
7. Archiva el historial de transacciones
8. Genera carta de cierre de cuenta
9. Cliente firma conformidad
10. Cuenta cerrada — datos conservados para contabilidad
**Resultado esperado:** Cuenta cerrada, saldo liquidado, historial archivado
**Variante:** Cliente tiene saldo a favor (C$500); se le reembolsa en efectivo

---

## CL-011: Cliente con múltiples tiendas
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** La Cooperativa San Miguel tiene 3 sucursales (Masaya, Granada, Managua). Cada sucursal compra por separado pero comparten el mismo crédito.
**Precondiciones:** Cliente con múltiples sucursales, cada una puede pedir independientemente
**Pasos:**
1. Administrador configura "Sucursales" para Cooperativa San Miguel
2. Crea sucursales:
   - Sucursal Masaya — dirección: Masaya, frente al mercado
   - Sucursal Granada — dirección: Granada, costado de la catedral
   - Sucursal Managua — dirección: Managua, Los Pinos
3. Todas comparten el límite de crédito: C$200,000
4. Cada sucursal puede hacer pedidos independientes
5. Sistema muestra saldo consolidado en tiempo real
6. Sucursal Masaya pide C$20,000 — saldo disponible baja a C$180,000
7. Sucursal Granada pide C$30,000 — saldo baja a C$150,000
8. Administrador monitorea el uso consolidado
**Resultado esperado:** Sucursales configuradas, crédito compartido, pedidos independientes gestionados
**Variante:** Una sucursal se excede sin avisar a las otras; se implementa alerta cuando se usa 80% del límite consolidado

---

## CL-012: Cliente referido por otro cliente
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Don Miguel (Comedor Santa Ana) refiere a su primo que abre una nueva pulpería. Se le da un beneficio especial por la referencia.
**Precondiciones:** Cliente existente refiere a nuevo cliente, programa de referidos activo
**Pasos:**
1. Don Miguel llega con su primo: "Él quiere abrir cuenta"
2. Administrador registra nuevo cliente: "Pulpería El Buen Gusto"
3. Marca: "Referido por: Comedor Santa Ana (Don Miguel)"
4. Programa de referidos: el referido recibe C$500 de crédito inicial adicional
5. Don Miguel recibe C$300 de descuento en su próxima compra
6. Administrador configura:
   - Cliente nuevo: límite C$5,000 + C$500 (referido) = C$5,500
   - Descuento a Don Miguel: C$300 en próxima compra
7. Nuevo cliente activado
8. Ambos clientes notificados
**Resultado esperado:** Nuevo cliente registrado con beneficio, cliente existente recompensado
**Variante:** El primo no califica para crédito (mal historial en otro lado); se le ofrece crédito menor o solo contado

---

## CL-013: Cliente con descuento especial
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** La Escuela Rubén Darío tiene un acuerdo de descuento del 5% en todas sus compras por ser institución educativa.
**Precondiciones:** Cliente institucional, acuerdo de descuento aprobado
**Pasos:**
1. Administrador selecciona cliente "Escuela Rubén Darío"
2. Va a "Configuración de descuento"
3. Agrega descuento especial: 5% sobre todas las compras
4. Tipo: "Institucional — educativo"
5. Fecha de vigencia: indefinida (hasta nuevo aviso)
6. Configuración guardada
7. Cuando el cliente compre, el descuento se aplica automáticamente
8. Sistema registra quién autorizó y cuándo
**Resultado esperado:** Descuento configurado, aplicación automática en ventas futuras, auditoría registrada
**Variante:** Descuento especial está cerca del precio de costo; administrador debe verificar margen antes de activar

---

## CL-014: Cliente con facturación electrónica
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Comercial Gómez, S.A. solicita que todas sus facturas se envíen automáticamente por correo en formato electrónico (CFDI).
**Precondiciones:** Cliente con RUC, sistema de facturación electrónica configurado
**Pasos:**
1. Administrador selecciona cliente "Comercial Gómez, S.A."
2. Activa "Facturación electrónica automática"
3. Configura correo: facturas@comercialgomez.com
4. Configura copia: contabilidad@comercialgomez.com
5. Configura formato: PDF + XML
6. Configura envío automático al timbrar factura
7. Guarda configuración
8. A partir de ahora, todas las facturas de este cliente se envían automáticamente
**Resultado esperado:** Facturación electrónica automática configurada, cliente recibe CFDI sin solicitarlo
**Variante:** El correo del cliente rebota (buzón lleno); el sistema reintenta 3 veces y luego alerta al administrador

---

## CL-015: Cliente que reclama por producto dañado
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Doña Rosa recibió un pedido y 3 botellas de Aceite Patrona llegaron rotas. Reclama en la tienda. Quiere que le repongan o le devuelvan el dinero.
**Precondiciones:** Cliente con pedido entregado, producto dañado en transporte
**Pasos:**
1. Doña Rosa llega con 3 botellas rotas de Aceite Patrona
2. Administrador verifica: son del pedido entregado ayer
3. Revisa nota de envío: no se reportaron daños en la entrega
4. Cliente: "Las saqué de la caja y estaban rotas"
5. Administrador evalúa:
   - Producto: C$85 c/u x 3 = C$255
   - Es cliente recurrente
6. Decide: reponer las 3 botellas
7. En Pino2, genera nota de crédito por C$255
8. Entrega 3 botellas nuevas al cliente
9. Cliente firma conformidad
10. Las botellas rotas se registran como merma en ruta
**Resultado esperado:** Cliente compensado, nota de crédito emitida, producto repuesto
**Variante:** Cliente reclama pero no trae el producto dañado (dice que lo botó); no se puede procesar sin evidencia

---

## CL-016: Cliente que solicita nota de crédito
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** El cliente devolvió productos y solicita nota de crédito en lugar de reembolso en efectivo. La nota de crédito se usará en compras futuras.
**Precondiciones:** Cliente con devolución aprobada, elige nota de crédito
**Pasos:**
1. Cliente devuelve 5 bultos de Frijoles Seda (C$380 c/u = C$1,900)
2. Motivo: "Exceso de inventario" (cliente pidió más de lo que necesitaba)
3. Devolución aceptada (productos en buen estado)
4. Cliente: "Deme nota de crédito, no efectivo"
5. Administrador selecciona "Generar nota de crédito"
6. Ingresa datos de la devolución
7. Sistema genera #NC-2026-050 por C$1,900
8. Configura vencimiento: 90 días
9. Imprime nota de crédito
10. Cliente firma
11. Nota de crédito queda disponible para uso futuro
**Resultado esperado:** Nota de crédito generada por C$1,900, vigencia 90 días, cliente firmó
**Variante:** Cliente pierde la nota de crédito; se puede reimprimir si el cliente presenta cédula (se anula la anterior)

---

## CL-017: Cliente con deuda en dólares
**Rol:** Administrador
**Duración:** 5 minutos
**Descripción:** Un cliente (Distribuidora Internacional) tiene facturas en dólares. Se deben registrar y cobrar en dólares o al tipo de cambio del día.
**Precondiciones:** Cliente autorizado para operar en dólares, tipo de cambio aplicable
**Pasos:**
1. Administrador revisa cuenta de Distribuidora Internacional
2. Factura #FAC-2026-400: USD $1,500, vence 15/08/2026
3. Cliente paga hoy: USD $1,500 en efectivo
4. Cajero registra pago en dólares
5. Sistema verifica: cliente configurado para operar en USD
6. Si el cliente paga en Córdobas, se usa tipo de cambio del día
7. Opción A: paga USD $1,500 → factura cancelada en USD
8. Opción B: paga C$54,750 (USD $1,500 x C$36.50)
9. Cliente elige pagar en dólares
10. Factura cancelada, saldo en USD actualizado
**Resultado esperado:** Pago en dólares registrado, factura cancelada en USD, tipo de cambio no afecta
**Variante:** Cliente quiere pagar en Córdobas el equivalente del TC del mes pasado (C$35.00); se debe cobrar al TC del día según política

---

## CL-018: Cliente con pagos en parcialidades
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Un cliente grande (Cooperativa San Miguel) solicita pagar una factura de C$100,000 en 3 parcialidades (30, 30 y 40 días).
**Precondiciones:** Factura grande, cliente confiable, acuerdo de pago en parcialidades
**Pasos:**
1. Cliente: "Necesito pagar en 3 partes: 30, 60 y 90 días"
2. Administrador revisa política: permite parcialidades para montos > C$50,000
3. En Pino2, selecciona la factura
4. Configura "Pago en parcialidades"
5. Primera cuota: C$35,000 a 30 días
6. Segunda cuota: C$35,000 a 60 días
7. Tercera cuota: C$30,000 a 90 días
8. Sistema registra las 3 cuotas con fechas
9. Se genera cronograma de pagos
10. Cliente firma acuerdo
**Resultado esperado:** Factura dividida en 3 parcialidades, cronograma generado, acuerdo firmado
**Variante:** Cliente paga una cuota atrasada; se aplica recargo por mora sobre esa cuota específica

---

## CL-019: Cliente con contrato de crédito
**Rol:** Administrador
**Duración:** 15 minutos
**Descripción:** Se formaliza un contrato de crédito con la Cooperativa San Miguel. El contrato establece límite, plazo, tasa de interés y garantías.
**Precondiciones:** Cliente con historial, aprobación de crédito, contrato legal
**Pasos:**
1. Administrador accede a "Contratos de crédito"
2. Selecciona "Nuevo contrato"
3. Cliente: Cooperativa San Miguel
4. Configura:
   - Límite: C$200,000
   - Plazo máximo: 45 días
   - Tasa de interés moratorio: 1.5% mensual
   - Garantía: prenda sobre inventario
5. Sistema genera documento de contrato
6. Administrador y cliente revisan términos
7. Ambas partes firman digitalmente
8. Contrato registrado con número y fecha
9. Cliente activado bajo este contrato
10. Sistema aplica términos automáticamente en cada operación
**Resultado esperado:** Contrato de crédito registrado, términos aplicados, firma digital capturada
**Variante:** Cliente quiere modificar un término (plazo de 45 a 60 días); se debe hacer addendum al contrato

---

## CL-020: Cliente que fallece
**Rol:** Administrador
**Duración:** 10 minutos
**Descripción:** Don Miguel (Comedor Santa Ana) falleció. Su familia notifica a la tienda. El saldo pendiente es de C$8,000. Se debe gestionar el cierre de cuenta con los herederos.
**Precondiciones:** Cliente registrado, saldo pendiente, familiar notifica fallecimiento
**Pasos:**
1. Familiar llega con acta de defunción
2. Administrador verifica documento
3. En Pino2, bloquea la cuenta del cliente
4. Cambia estatus: "Cliente fallecido"
5. Revisa saldo pendiente: C$8,000
6. Familiar solicita: "No podemos pagar la deuda"
7. Administrador consulta política:
   - Si tiene seguro: se cobra al seguro
   - Si no tiene: se condona por compasión
8. Decide condonar la deuda
9. En Pino2, registra: "Condonación por fallecimiento del titular"
10. Cuenta cerrada, saldo condonado
11. Familiar firma conformidad
**Resultado esperado:** Cuenta bloqueada, deuda condonada (o cobrada al seguro), proceso documentado
**Variante:** La familia quiere continuar el negocio (herederos); se transfiere la cuenta a nombre del heredero con nuevo crédito

---

## CL-021: Cliente fallece, deuda pasa a familiares
**Rol:** Administrador
**Duración:** 2 horas
**Descripción:** Don José, dueño de Pulpería Los Amigos, falleció. Dejó una deuda de C$34,500 en la tienda. Su hijo quiere seguir el negocio pero no reconoce la deuda completa.
**Precondiciones:** Cliente con saldo pendiente superior a C$30,000
**Pasos:**
1. Administrador se entera del fallecimiento
2. Revisa el historial de crédito del cliente
3. Congela la cuenta (no más ventas a crédito)
4. Contacta a la familia para negociar la deuda
5. Si el hijo acepta, se transfiere la deuda a un nuevo cliente
6. Si no acepta, se castiga la cuenta como incobrable
**Resultado esperado:** Cuenta congelada, deuda transferida o castigada
**Variante:** No hay familiares que respondan → deuda pasa a cobro judicial

---

## CL-022: Cliente declara quiebra/cierra negocio
**Rol:** Administrador
**Duración:** 1 hora
**Descripción:** "Licorería El Chele" cierra definitivamente. Debe C$12,000 y no tiene activos para pagar.
**Precondiciones:** Cliente con deuda activa
**Pasos:**
1. Se notifica cierre del negocio
2. Administrador congela cuenta
3. Intenta cobro con el dueño
4. Si no hay pago, se castiga la cuenta
5. Se genera nota de crédito fiscal por deuda incobrable
6. Se reporta a central de riesgo si aplica
**Resultado esperado:** Cuenta cerrada, saldo castigado como pérdida
**Variante:** El cliente ofrece pagar 30% para cerrar la deuda → se negocia quita
