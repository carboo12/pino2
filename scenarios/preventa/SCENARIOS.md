# Escenarios de Preventa — Pino2 Los Pinos Central

---

## PR-001: Vendedor toma pedido de pulpería habitual
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Don Freddy, vendedor de la ruta de Masaya, visita la Pulpería Doña Mary. Es cliente fijo que pide todas las semanas. Hoy necesita su despacho normal más extra de Aceite Patrona.
**Precondiciones:** Vendedor tiene ruta asignada, cliente registrado con historial de compras
**Pasos:**
1. Vendedor llega a Pulpería Doña Mary, Masaya
2. Abre la app de preventa en su tablet, busca cliente por nombre
3. Sistema muestra historial del cliente y sugiere pedido semanal: 5 bultos Arroz Faisán, 3 bultos Frijoles Seda, 2 cajas Aceite Patrona
4. Doña Mary confirma: "Sí, lo de siempre, pero agrégueme 1 caja extra de Aceite Patrona"
5. Vendedor ajusta: Aceite Patrona a 3 cajas
6. Pregunta si necesita algo más: "No, está bien"
7. Vendedor confirma pedido en la app
8. Sistema calcula total estimado: C$4,215
9. Programó entrega para mañana 10 AM
10. Cliente firma digitalmente
**Resultado esperado:** Pedido registrado en sistema con productos correctos, fecha de entrega asignada, listo para despacho
**Variante:** Doña Mary quiere pagar contra entrega pero tiene saldo pendiente de C$2,300 del mes pasado; el sistema alerta y vendedor debe cobrar primero

---

## PR-002: Vendedor toma pedido de cliente nuevo sin historial
**Rol:** Vendedor
**Duración:** 20 minutos
**Descripción:** En la ruta de Jinotega, Don Freddy encuentra una nueva pulpería llamada "La Económica". Debe registrar al cliente y tomar el primer pedido.
**Precondiciones:** Cliente no existe en el sistema, vendedor tiene permisos para crear clientes
**Pasos:**
1. Vendedor entra a la pulpería, se presenta como vendedor de Los Pinos
2. Dueño (Don Javier) se interesa: "Necesito arroz, aceite y azúcar"
3. Vendedor selecciona "Nuevo cliente" en la app
4. Ingresa datos del negocio: Pulpería La Económica, Dirección: Jinotega, contiguo a la Alcaldía
5. Ingresa datos personales: Don Javier Gutiérrez, cédula 441-150875-1234X, teléfono 8765-4321
6. Cliente solicita crédito: "Pago a los 15 días"
7. Vendedor configura crédito por C$10,000 (límite estándar para clientes nuevos)
8. Registra primer pedido: 5 bultos Arroz Faisán, 3 bultos Frijoles Seda, 2 bultos Azúcar Sulí
9. Total estimado: C$3,940
10. Confirma pedido, cliente firma digital
**Resultado esperado:** Cliente creado en sistema con datos completos, pedido registrado, crédito asignado
**Variante:** Don Javier no tiene identificación oficial; vendedor no puede completar el registro — se deja como cliente "pendiente de verificación"

---

## PR-003: Vendedor negocia precio especial en preventa
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** La Cooperativa San Miguel de Masaya pide 100 bultos de Arroz Faisán pero quiere precio especial de C$440 por bulto (precio lista C$480). El vendedor tiene autorización de precio nivel 2.
**Precondiciones:** Vendedor con permisos para negociar precios especiales dentro de su rango, cliente registrado
**Pasos:**
1. Vendedor visita Cooperativa San Miguel
2. Gerente de la cooperativa: "Necesito 100 bultos de Arroz Faisán pero al precio que me diste la semana pasada, C$440"
3. Vendedor abre el pedido en la app
4. Agrega 100 bultos Arroz Faisán — sistema muestra precio lista C$480
5. Vendedor modifica precio a C$440 por bulto
6. Sistema verifica: vendedor tiene permiso nivel 2 (descuento hasta 10%)
7. Descuento autorizado automáticamente: 8.33% de descuento
8. Total: 100 x C$440 = C$44,000
9. Se registra pedido con precio especial
10. Se programa entrega para el jueves
**Resultado esperado:** Pedido con precio especial registrado, descuento dentro del rango del vendedor, cliente satisfecho
**Variante:** Cooperativa pide C$420 por bulto (descuento 12.5%); vendedor no tiene permiso nivel 3 — debe llamar al administrador para autorización

---

## PR-004: Vendedor sugiere productos complementarios
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Durante la visita a un cliente, el vendedor nota que al cliente le falta Café Presto y Leche Klim en su inventario. Sugiere agregarlos al pedido como venta cruzada.
**Precondiciones:** Cliente habitual, vendedor observa inventario del cliente
**Pasos:**
1. Vendedor llega a Comedor Santa Ana en Managua
2. Doña Elena pide su pedido semanal: 3 bultos Arroz, 2 bultos Frijoles, 1 caja Aceite
3. Vendedor nota: en la cocina no ven Café Presto ni Leche Klim
4. Vendedor: "Doña Elena, ¿ya no está vendiendo café con leche? Veo que no tiene"
5. Cliente: "Ah, es cierto, se me acabaron, pero no los pedí"
6. Vendedor: "Le puedo agregar 1 caja de Café Presto (12 unidades) y 1 caja de Leche Klim (12 unidades)"
7. Cliente: "Está bien, agregue"
8. Vendedor agrega al pedido: Café Presto x12 (C$1,320) y Leche Klim x12 (C$1,140)
9. Total con agregado: C$7,615
10. Cliente agradece: "Qué bien que te fijaste"
**Resultado esperado:** Pedido incrementado con productos adicionales, cliente satisfecho por la sugerencia
**Variante:** Cliente dice "No, está muy caro"; vendedor debe respetar la decisión sin presionar

---

## PR-005: Cliente no tiene efectivo para abono
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** El vendedor visita a un cliente que tiene un saldo pendiente de C$4,500. Para tomar nuevo pedido, el cliente debe abonar al menos C$2,000. El cliente no trajo efectivo.
**Precondiciones:** Cliente con saldo vencido, política de abono mínimo para nuevos pedidos
**Pasos:**
1. Vendedor llega a Licorería El Chele en Granada
2. Sistema muestra: cliente con saldo pendiente C$4,500 (15 días vencido)
3. Vendedor: "Don Toño, tiene un saldito pendiente. Para tomar pedido nuevo necesita abonar al menos C$2,000"
4. Don Toño: "Ay, no traje efectivo, ¿puedo pagar con tarjeta?"
5. Vendedor activa datáfono móvil
6. Cliente paga C$2,000 con tarjeta de débito
7. Sistema registra el abono y libera al cliente para nuevo pedido
8. Vendedor toma nuevo pedido: 5 bultos Arroz, 3 cajas Aceite
9. Cliente firma
10. Nuevo pedido registrado con saldo actualizado
**Resultado esperado:** Abono procesado con tarjeta, saldo reducido a C$2,500, nuevo pedido registrado
**Variante:** Cliente insiste en que no puede pagar; el sistema bloquea el nuevo pedido y el vendedor debe reportar al supervisor

---

## PR-006: Vendedor registra pedido y cobra en efectivo en preventa
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Cliente pequeño (Pulpería Los Amigos) paga su pedido en efectivo directamente al vendedor. El vendedor debe registrar el pago y entregar recibo.
**Precondiciones:** Pedido de preventa, cliente prefiere pagar contra entrega al vendedor
**Pasos:**
1. Vendedor toma pedido: 2 bultos Arroz Faisán, 1 bulto Frijoles Seda, 1 bulto Azúcar Sulí
2. Total: C$1,578
3. Cliente: "Te pago ahorita para que no tenga que estar esperando al rutero"
4. Vendedor selecciona "Cobrar ahora" en la app
5. Recibe C$1,600 en efectivo
6. Ingresa monto recibido en la app
7. Sistema calcula vuelto: C$22
8. Vendedor entrega vuelto al cliente
9. Se imprime recibo de pago (impresora térmica portátil)
10. Pedido queda marcado como "Pagado"
**Resultado esperado:** Pago registrado en preventa, pedido pagado, cliente con recibo, vendedor entrega efectivo al final del día
**Variante:** Vendedor no tiene cambio; cliente paga con C$2,000 y queda un saldo a favor del cliente de C$422 que se aplica al próximo pedido

---

## PR-007: Cliente cancela pedido después de tomado
**Rol:** Vendedor
**Duración:** 5 minutos
**Descripción:** Un cliente que pidió ayer llama al vendedor para cancelar el pedido porque encontró mejores precios en otro distribuidor. El vendedor debe procesar la cancelación.
**Precondiciones:** Pedido registrado, aún no ha salido a despacho
**Pasos:**
1. Vendedor recibe llamada de Doña María (Pulpería El Buen Gusto)
2. Cliente: "Don Freddy, cancéleme el pedido de ayer, encontré más barato en La Colonia"
3. Vendedor abre el pedido en la app — estatus: "Pendiente de despacho"
4. Selecciona "Cancelar pedido"
5. Motivo: "Cliente desistió — encontró mejor precio"
6. Sistema solicita confirmación: "¿Está seguro de cancelar el pedido PR-2026-0423?"
7. Vendedor confirma cancelación
8. Pedido cambia a estatus "Cancelado por cliente"
9. Se liberan los productos reservados en inventario
10. Vendedor llama a administrador para reportar la baja
**Resultado esperado:** Pedido cancelado, inventario liberado, motivo registrado en el sistema
**Variante:** Cliente cancela después de que el pedido ya salió a ruta; se debe desviar el camión o devolver a bodega

---

## PR-008: Vendedor no encuentra al cliente en la dirección
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** El vendedor tiene una cita para toma de pedido en Estelí, pero al llegar a la dirección, el negocio no está. La dirección parece incorrecta.
**Precondiciones:** Cita agendada, vendedor en la ubicación indicada
**Pasos:**
1. Vendedor llega a "Costado este del Mercado de Estelí, contiguo a farmacia"
2. No hay ningún negocio con ese nombre
3. Pregunta a vecinos: "¿Dónde queda Pulpería San Miguel?"
4. Vecino: "Ah, eso está en el costado oeste, no este"
5. Vendedor camina 5 minutos al costado oeste
6. Encuentra la pulpería
7. Cliente: "Pensé que no iba a venir"
8. Vendedor se disculpa: "La dirección estaba mal, la corregimos"
9. Toma el pedido normalmente: 3 bultos Arroz, 2 bultos Frijoles
10. Corrige la dirección en el sistema
**Resultado esperado:** Cliente encontrado, pedido tomado, dirección corregida en sistema
**Variante:** Después de 20 minutos buscando, no encuentra el negocio; reporta como "Cliente no ubicado" y programa nueva visita

---

## PR-009: Cliente solicita productos que no están en catálogo
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente pide un producto que Los Pinos no distribuye (Harina de Maíz Nicaragüense "Minsa"). El vendedor debe manejar la solicitud.
**Precondiciones:** Producto no existe en catálogo de Pino2
**Pasos:**
1. Cliente: "¿Me puede traer Harina Minsa de 1kg?"
2. Vendedor busca en catálogo — no encuentra
3. Vendedor: "No manejamos Minsa, pero tengo Harina Fantur"
4. Cliente: "No, yo quiero Minsa"
5. Vendedor registra "Solicitud de nuevo producto" en la app
6. Ingresa: Harina de Maíz Minsa 1kg, proveedor sugerido: Minsa Nicaragua
7. Sistema guarda solicitud para revisión del administrador
8. Vendedor: "Voy a consultar con mi supervisor si podemos incluirla"
9. Ofrece alternativa: "Mientras tanto, ¿le sirve Fantur?"
10. Cliente acepta Fantur como alternativa temporal
**Resultado esperado:** Solicitud de nuevo producto registrada, cliente atendido con alternativa
**Variante:** Cliente insiste solo en Minsa; se registra la solicitud pero no hay venta en esta visita

---

## PR-010: Vendedor reorganiza ruta del día
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Un cliente urgente llama pidiendo que el vendedor pase hoy porque necesita pedido para mañana. El vendedor debe reorganizar su ruta del día.
**Precondiciones:** Ruta del día ya planificada, cliente urgente no programado
**Pasos:**
1. Vendedor recibe llamada a las 8 AM: "Don Freddy, soy de Comedor Santa Ana, necesito pedido urgente, ¿puede venir hoy?"
2. Vendedor revisa su ruta del día: 8 clientes programados en Masaya
3. Comedor Santa Ana está en Managua, no en la ruta de hoy
4. Vendedor busca un espacio: "¿Puedo ir mañana temprano?"
5. Cliente: "No, tiene que ser hoy, se me acaba el arroz"
6. Vendedor decide: irá después de su último cliente en Masaya
7. Reordena la ruta: mantiene los 8 de Masaya, agrega al final: Comedor Santa Ana
8. Confirma al cliente: "Voy como a las 4 PM"
9. Completa ruta en Masaya
10. 4 PM: visita Comedor Santa Ana, toma pedido urgente
**Resultado esperado:** Ruta reorganizada, cliente urgente atendido, pedido registrado
**Variante:** No hay espacio en la ruta (demasiados clientes); el vendedor debe pedir a otro vendedor que cubra la visita

---

## PR-011: Vendedor detecta cliente con crédito vencido
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Al intentar tomar un pedido, el sistema alerta que el cliente tiene 45 días de mora. El vendedor debe cobrar antes de tomar nuevo pedido.
**Precondiciones:** Cliente con crédito vencido, sistema bloquea nuevos pedidos
**Pasos:**
1. Vendedor visita Distribuidora Pérez en León
2. Abre cliente en la app — alerta roja: "Cliente en mora — 45 días vencido"
3. Saldo pendiente: C$18,500
4. Vendedor: "Don Pérez, tiene un saldo pendiente de C$18,500 desde hace mes y medio"
5. Cliente: "Ah, se me pasó, ¿cuánto hay que pagar?"
6. Vendedor: "Para tomar pedido nuevo debe ponerse al corriente"
7. Cliente paga C$18,500 en efectivo
8. Vendedor registra el pago en la app
9. Sistema libera al cliente
10. Vendedor toma nuevo pedido: 10 bultos Arroz, 5 cajas Aceite
**Resultado esperado:** Cobro realizado, saldo en cero, nuevo pedido registrado
**Variante:** Cliente solo puede pagar C$10,000; el vendedor debe consultar al administrador si acepta pago parcial y nuevo pedido

---

## PR-012: Vendedor toma pedido en zona sin internet
**Rol:** Vendedor
**Duración:** 20 minutos
**Descripción:** El vendedor está en una zona rural de Matagalpa sin cobertura de datos. Debe tomar pedidos en modo offline y sincronizar después.
**Precondiciones:** App de preventa con modo offline, datos locales almacenados
**Pasos:**
1. Vendedor llega a la zona rural de Matagalpa — sin señal
2. App entra automáticamente a modo offline
3. Toma pedido de cliente 1: 2 bultos Arroz, 1 bulto Frijoles (datos guardados localmente)
4. Toma pedido de cliente 2: 3 bultos Arroz, 2 cajas Aceite (datos guardados)
5. Toma pedido de cliente 3: 5 bultos Azúcar (datos guardados)
6. Termina la ruta rural
7. Regresa a carretera principal — recupera señal
8. App sincroniza automáticamente los 3 pedidos
9. Sistema muestra: "3 pedidos sincronizados exitosamente"
10. Vendedor verifica que todos los datos están completos
**Resultado esperado:** Pedidos tomados sin conexión, sincronizados al recuperar señal, sin pérdida de datos
**Variante:** App se cierra antes de sincronizar y pierde los pedidos locales; vendedor debe reingresar los pedidos manualmente

---

## PR-013: Vendedor aplica promoción especial del mes
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Este mes hay promoción de Azúcar Sulí: "Lleve 10 bultos y pague 9". El vendedor debe informar y aplicar la promoción a los clientes.
**Precondiciones:** Promoción activa en el sistema, fechas de vigencia correctas
**Pasos:**
1. Vendedor visita Pulpería Los Amigos en Granada
2. Cliente pide su pedido normal: 8 bultos Arroz, 5 bultos Frijoles, 4 bultos Azúcar Sulí
3. Vendedor: "Don Nacho, este mes hay promo de Azúcar Sulí: lleva 10 bultos y paga 9"
4. Cliente: "¿Ah sí? Entonces póngame 10 en vez de 4"
5. Vendedor ajusta: Azúcar Sulí a 10 bultos
6. Sistema aplica promoción automáticamente: 10 bultos, paga 9
7. Ahorro: C$420 (precio de 1 bulto)
8. Total ajustado con descuento
9. Cliente: "Buen negocio"
10. Pedido registrado con promoción aplicada
**Resultado esperado:** Promoción aplicada, cliente compra más, ahorro visible en el pedido
**Variante:** Cliente quiere combinar promoción con descuento por volumen; sistema debe validar si las promociones son acumulables

---

## PR-014: Vendedor recibe reclamo de cliente por entrega anterior
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Un cliente reclama que en la entrega anterior le faltaron 2 bultos de Arroz. El vendedor debe investigar y resolver.
**Precondiciones:** Cliente tiene pedido anterior con diferencia reportada
**Pasos:**
1. Vendedor llega a Pulpería El Buen Gusto en Jinotega
2. Cliente: "Don Freddy, la semana pasada me entregaron 8 bultos de Arroz pero yo pedí 10"
3. Vendedor abre el historial del cliente en la app
4. Revisa pedido anterior: efectivamente se pidieron 10 bultos
5. Revisa factura de entrega: el rutero registró entrega de 10
6. Vendedor llama al administrador para reportar la discrepancia
7. Administrador revisa: el rutero marcó 10 pero en bodega solo cargaron 8
8. Se confirma error de preparación
9. Vendedor: "Tiene razón, fue error nuestro. Le vamos a incluir los 2 bultos faltantes en el próximo pedido sin costo"
10. Se genera nota de crédito por 2 bultos de Arroz
**Resultado esperado:** Reclamo resuelto, nota de crédito generada, cliente compensado
**Variante:** Cliente no tiene razón (el pedido original era de 8); vendedor muestra evidencia y cliente acepta

---

## PR-015: Vendedor gestiona devolución de producto dañado en preventa
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente muestra al vendedor un producto que recibió dañado en la entrega anterior (una caja de Aceite Patrona con botellas rotas).
**Precondiciones:** Producto dañado en entrega anterior, cliente conserva evidencia
**Pasos:**
1. Cliente: "Mire, esta caja de Aceite Patrona llegó con 3 botellas rotas"
2. Vendedor inspecciona: efectivamente, 3 botellas de vidrio rotas
3. Toma fotos como evidencia desde la app
4. Selecciona "Devolución por daño" en el sistema
5. Asocia al pedido anterior
6. Ingresa: 3 unidades Aceite Patrona dañadas
7. Sistema genera nota de crédito por C$255 (3 x C$85)
8. Vendedor: "Le vamos a reponer esas 3 unidades en el próximo pedido"
9. Cliente acepta
10. El producto dañado se queda con el cliente para destrucción o se recoge
**Resultado esperado:** Devolución registrada, nota de crédito generada, cliente compensado
**Variante:** Cliente exige devolución en efectivo inmediato; vendedor no maneja efectivo — debe remitir a la tienda

---

## PR-016: Vendedor modifica pedido ya registrado
**Rol:** Vendedor
**Duración:** 5 minutos
**Descripción:** Cliente llama al vendedor para agregar productos a un pedido que ya está registrado pero aún no ha salido a despacho.
**Precondiciones:** Pedido existente en estatus "Pendiente de despacho"
**Pasos:**
1. Vendedor recibe llamada de Cooperativa San Miguel
2. Cliente: "Don Freddy, al pedido de ayer, agréguele 10 bultos de Azúcar Sulí"
3. Vendedor busca el pedido en la app
4. Selecciona "Modificar pedido"
5. Agrega 10 bultos Azúcar Sulí (C$3,800)
6. Sistema actualiza el total: C$44,000 + C$3,800 = C$47,800
7. Cliente confirma
8. Sistema guarda la modificación con nota: "Modificado por solicitud del cliente"
9. Pedido actualizado queda listo para despacho
10. Vendedor notifica a despacho sobre el cambio
**Resultado esperado:** Pedido modificado exitosamente, cantidades y total actualizados
**Variante:** Pedido ya está en proceso de carga; vendedor no puede modificar — debe crear nota urgente para despacho

---

## PR-017: Vendedor cierra su ruta diaria
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Al final del día, el vendedor debe cerrar su ruta, reportar pedidos tomados, efectivo cobrado y novedades.
**Precondiciones:** Ruta completada, todos los pedidos registrados
**Pasos:**
1. Vendedor termina su último cliente a las 5 PM
2. Selecciona "Cerrar ruta" en la app
3. Sistema muestra resumen del día:
   - Clientes visitados: 10
   - Pedidos tomados: 8
   - Efectivo cobrado: C$15,200
   - Pagos con tarjeta: C$8,500
4. Vendedor confirma que los datos son correctos
5. Ingresa novedades: "Cliente Pulpería Los Amigos no estaba, reprogramado para mañana"
6. Sistema cierra la ruta
7. Vendedor entrega efectivo al administrador en la tienda
8. Administrador verifica: C$15,200 coincide con lo reportado
9. Se imprime recibo de entrega de efectivo
10. Ruta cerrada exitosamente
**Resultado esperado:** Ruta cerrada, efectivo entregado, reporte diario generado
**Variante:** Efectivo no cuadra (faltan C$500); vendedor debe revisar transacciones del día para encontrar el error

---

## PR-018: Vendedor atiende cliente que compra para eventos especiales
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Se acerca Semana Santa y un cliente (comedor popular) pide cantidades mayores para la temporada. Necesita entregas programadas.
**Precondiciones:** Cliente registrado, evento especial próximo
**Pasos:**
1. Vendedor visita Comedor Popular "San Benito" en Managua
2. Cliente: "Se acerca Semana Santa, voy a necesitar el doble de todo"
3. Vendedor revisa historial: pedido normal 5 bultos Arroz/semana
4. Cliente pide: 10 bultos Arroz, 5 bultos Frijoles, 4 cajas Aceite, 3 bultos Azúcar
5. Además: "Necesito que me entreguen mitad esta semana y mitad la otra"
6. Vendedor configura entrega dividida: 50% el jueves, 50% el jueves siguiente
7. Sistema calcula disponibilidad de producto
8. Verifica stock suficiente para ambas entregas
9. Registra pedido con dos líneas de entrega
10. Cliente firma
**Resultado esperado:** Pedido con entrega dividida registrado, fechas programadas, stock verificado
**Variante:** Stock insuficiente para cubrir ambas entregas; vendedordor debe negociar cantidades menores o fechas alternativas

---

## PR-019: Vendedor detecta cliente que vende productos fuera de su giro
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente (pulpería) está vendiendo productos que no son típicos de una pulpería (electrodomésticos pequeños). El vendedor identifica oportunidad de ampliar surtido.
**Precondiciones:** Cliente conocido, vendedor nota cambio en el negocio
**Pasos:**
1. Vendedor llega a Pulpería Doña Mary y ve que ahora también vende ollas, sartenes
2. Vendedor: "Doña Mary, veo que amplió el negocio"
3. Cliente: "Sí, ahora vendo cositas de cocina"
4. Vendedor ve oportunidad: "¿Ha pensado en vender también aceite en botella pequeña? La gente que compra ollas necesita aceite"
5. Cliente: "No lo había pensado"
6. Vendedor sugiere agregar: 1 caja de Aceite Patrona en presentación 500ml
7. Cliente acepta probar: "Deme 12 botellas de 500ml a ver cómo va"
8. Vendedor registra el pedido con la nueva presentación
9. Cliente: "Si se vende bien, le pido más"
10. Vendedor anota: "Cliente potencial para línea de 500ml"
**Resultado esperado:** Nueva presentación ofrecida y aceptada, cartera de productos del cliente ampliada
**Variante:** Cliente no se interesa; vendedor no insiste y continúa con pedido normal

---

## PR-020: Vendedor registra pedido con nota de envío especial
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente institucional (Escuela Rubén Darío) requiere que el pedido se entregue con nota de envío específica del MINED y factura fiscal.
**Precondiciones:** Cliente institucional, requisitos fiscales específicos
**Pasos:**
1. Vendedor visita la Escuela Rubén Darío
2. Directora: "Necesito mi pedido mensual, pero con factura fiscal a nombre del MINED"
3. Vendedor selecciona cliente "Escuela Rubén Darío"
4. Sistema muestra que el cliente requiere factura fiscal
5. Vendedor agrega productos: 10 bultos Arroz, 5 bultos Frijoles, 3 cajas Leche Klim
6. Total: C$7,345
7. Marca opción "Factura fiscal" e ingresa datos del MINED
8. Agrega nota: "Entregar en horario 8-9 AM, antes de clases"
9. Configura entrega para el lunes
10. Registra pedido
**Resultado esperado:** Pedido registrado con factura fiscal y nota de envío, listo para proceso de despacho
**Variante:** Los datos fiscales del MINED cambiaron; el sistema rechaza el RUC y el vendedor debe solicitar actualización

---

## PR-021: Vendedor visita cliente en mora severa (60+ días)
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente tiene 65 días de mora con un saldo de C$32,000. El vendedor debe gestionar el cobro o suspender el servicio.
**Precondiciones:** Cliente con mora superior a 60 días, pedidos bloqueados
**Pasos:**
1. Vendedor llega a Distribuidora Pérez en León
2. Sistema muestra alerta roja: "Mora crítica — 65 días, C$32,000"
3. Vendedor: "Don Pérez, tenemos un problema serio con su saldo"
4. Cliente: "Es que he estado mal de ventas"
5. Vendedor: "Necesitamos un abono importante. Su línea de crédito está suspendida"
6. Cliente ofrece pagar C$10,000 ahora y C$22,000 en 15 días
7. Vendedor no tiene autorización para esa negociación
8. Llama al administrador para consultar
9. Administrador autoriza: "Acepte los C$10,000 y un convenio de pago por el resto"
10. Vendedor registra cobro de C$10,000 y genera convenio de pago en el sistema
**Resultado esperado:** Cobro parcial registrado, convenio de pago creado, cliente con nuevo plan de pagos
**Variante:** Cliente no acepta pagar nada; vendedor debe notificar que se suspende el servicio y el caso pasa a cobranza judicial

---

## PR-022: Vendedor promociona producto nuevo en el mercado
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Los Pinos acaba de agregar un producto nuevo: "Frijoles Negros Seda" (competencia directa de los rojos). El vendedor debe ofrecerlo a sus clientes.
**Precondiciones:** Nuevo producto en catálogo, material promocional disponible
**Pasos:**
1. Vendedor asiste a reunión matutina: "Hoy lanzamos Frijoles Negros Seda, precio introductorio C$25/lb"
2. Toma muestras y volantes promocionales
3. Visita a Pulpería Los Amigos
4. Vendedor: "Don Nacho, tenemos un producto nuevo: Frijoles Negros Seda, más baratos que los rojos"
5. Ofrece muestra gratis de 1 lb
6. Cliente prueba visualmente: "Se ven bien"
7. Vendedor: "Precio introductorio C$25, después sube a C$28. Le recomiendo pedir ahora"
8. Cliente: "Deme 2 bultos a ver cómo se venden"
9. Vendedor registra: 2 bultos Frijoles Negros Seda
10. Marca el pedido como "Primera compra — producto nuevo"
**Resultado esperado:** Producto nuevo agregado al pedido del cliente, promoción introductoria aplicada
**Variante:** Cliente rechaza porque "la gente está acostumbrada a los rojos"; vendedor respeta decisión y lo intentará en la próxima visita

---

## PR-023: Vendedor soluciona diferencia de precio con cliente
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente reclama que el precio que le cotizó el vendedor la semana pasada (C$80 el Aceite Patrona) es diferente al que aparece en la factura de entrega (C$85).
**Precondiciones:** Diferencia entre cotización y precio real
**Pasos:**
1. Cliente: "Don Freddy, usted me dijo que el Aceite Patrona estaba a C$80, pero en la factura viene a C$85"
2. Vendedor revisa la cotización que envió la semana pasada
3. Efectivamente, cotizó Aceite Patrona a C$80
4. Pero en el sistema el precio es C$85 (hubo un aumento)
5. Vendedor: "Tiene razón, yo le coticé a C$80. Fue error mío, el precio ya subió"
6. Vendedor selecciona "Ajuste por diferencia de cotización"
7. Sistema: requiere autorización para modificar precio
8. Vendedor llama al administrador: "Fue mi error, autorice la diferencia"
9. Administrador autoriza ajuste para este pedido
10. Se corrige la factura: 10 cajas Aceite Patrona x C$80 = C$800
**Resultado esperado:** Precio ajustado a lo cotizado, cliente satisfecho, vendedor registra incidente para evitar recurrencia
**Variante:** Administrador no autoriza; vendedor debe explicar al cliente que no puede modificar y ofrecer descuento en el próximo pedido

---

## PR-024: Vendedor cierra pedido con pago mixto (efectivo + crédito)
**Rol:** Vendedor
**Duración:** 10 minutos
**Descripción:** Un cliente quiere pagar parte del pedido en efectivo y el resto a crédito. El vendedor debe registrar el pago mixto en preventa.
**Precondiciones:** Cliente con línea de crédito disponible, pago parcial en efectivo
**Pasos:**
1. Vendedor toma pedido de Licorería El Chele: 15 cajas Aceite Patrona
2. Total: C$12,750
3. Cliente: "Tengo C$5,000 ahorita, el resto me lo fía"
4. Vendedor selecciona "Pago mixto" en la app
5. Ingresa efectivo: C$5,000
6. Sistema verifica línea de crédito: cliente tiene C$15,000 disponibles — saldo actual C$3,000
7. Crédito disponible: C$12,000 — suficiente para C$7,750
8. Vendedor confirma pago: C$5,000 efectivo + C$7,750 crédito
9. Pedido registrado con split de pago
10. Cliente firma
**Resultado esperado:** Pago mixto registrado, efectivo contabilizado, crédito actualizado a C$10,750
**Variante:** Cliente no tiene suficiente crédito disponible (solo C$5,000); el sistema rechaza y vendedor negocia pago en efectivo del restante

---

## PR-025: Vendedor maneja cliente insatisfecho por servicio previo
**Rol:** Vendedor
**Duración:** 15 minutos
**Descripción:** Un cliente está molesto porque la semana pasada su pedido llegó 3 horas tarde y casi pierde ventas. Amenaza con cambiarse de distribuidor.
**Precondiciones:** Cliente con experiencia negativa en entrega anterior
**Pasos:**
1. Vendedor llega a Pulpería El Buen Gusto
2. Cliente: "Don Freddy, la semana pasada el pedido llegó a las 2 PM, casi pierdo clientes. ¡Estoy harto!"
3. Vendedor escucha al cliente sin interrumpir
4. Cliente: "Si vuelve a pasar, me cambio a La Colonia"
5. Vendedor: "Tiene toda la razón, fue un retraso en la ruta. Ya hablé con despacho para que no se repita"
6. Vendedor ofrece: "Como disculpa, le voy a dar un 5% de descuento en su pedido de hoy"
7. Cliente acepta
8. Vendedor registra pedido con 5% de descuento por "Compensación por retraso"
9. Agrega nota: "Cliente insatisfecho — priorizar entrega puntual"
10. Cliente firma el pedido
**Resultado esperado:** Cliente retenido, descuento de compensación aplicado, nota de prioridad registrada
**Variante:** Cliente no acepta descuento y cancela su cuenta; vendedor debe escalar a administrador para retención de cliente
