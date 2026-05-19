# Auditoria funcional y tecnica - Pino2

Fecha: 2026-04-30
Ruta analizada: `/opt/apps/pino2`

## Alcance

Se revisaron los tres pilares del proyecto:

- `web`: React + Vite + Tailwind + Radix UI para POS, administracion y operacion web.
- `backend`: NestJS + Fastify + PostgreSQL puro para API REST, seguridad, sincronizacion y modulos de negocio.
- `flutter`: Flutter + Riverpod + Dio + Drift para app movil con cache local, rutas, preventa, bodega y offline base.

No se modifico codigo de aplicacion. Solo se genero esta documentacion.

## Lectura general

El proyecto no esta en estado scaffold. Tiene una base funcional amplia y ya cubre POS, administracion multi-tienda, bodega, ventas en ruta, cobranza, devoluciones, cuentas po r cobrar/pagar, sincronizacion, notificaciones, reportes y app movil operativa.

Tambien tiene deuda tecnica clara: contratos tipados incompletos, varios endpoints aceptan `any`, documentacion de subproyectos todavia generica, pruebas web inexistentes, riesgo de divergencia entre esquema maestro y migraciones, y pantallas con logica de datos/calculo dentro del componente.

## Metricas rapidas

- `web/src`: 188 archivos.
- `web/src/pages`: 73 paginas React.
- `backend/src`: 133 archivos.
- `backend/src/modules`: 37 modulos NestJS.
- `flutter/lib`: 66 archivos.
- `flutter/lib/features`: 14 features principales.
- Pruebas detectadas: backend unit/e2e activos y legacy; Flutter con 3 pruebas; no se detectaron pruebas React dedicadas.

## Que tiene

- Arquitectura monorepo logica separada por `backend`, `web`, `flutter`, `docs`, `plan`.
- API NestJS modular con autenticacion JWT, roles, guards, Swagger, CORS, Helmet, rate limit y WebSocket events.
- PostgreSQL como fuente principal con tablas multi-tienda, usuarios, tiendas, cadenas, catalogo, ventas, caja, inventario, pedidos, proveedores, clientes, cuentas, rutas, devoluciones, sincronizacion y logs.
- Frontend React con rutas protegidas por rol, carga lazy, layout compartido, componentes UI reutilizables, POS, admin tienda, master admin, chain admin, vendedores, bodega, finanzas y reportes.
- Flutter con login real, sesion persistida, cache local Drift, cola offline base, catalogo, cartera, rutas, pedidos, cobros, devoluciones, bodega, cierre diario, preventa y PDF.
- Estrategia offline en web y movil: IndexedDB en web, Drift/sync queue en Flutter, external_id/idempotencia en backend.

## Que le falta o conviene cerrar

- Contratos DTO completos en backend para todos los modulos. Hay controladores/servicios con `any` en clientes, tiendas, usuarios, grupos, notificaciones, sync y otros.
- Fuente unica de esquema. `schema.sql`, migraciones y `ensureOperationalTables()` crean/modifican estructura en lugares distintos.
- Pruebas de frontend. No se encontraron tests React para flujos criticos como login, POS, caja, inventario, pedidos, autorizaciones y roles.
- Pruebas moviles de sync/offline mas completas. Existen pruebas Flutter, pero falta cubrir reconciliacion, replay, conflictos e idempotencia extremo a extremo.
- Documentacion actualizada por subproyecto. `backend/README.md` y `web/README.md` siguen siendo templates genericos; el README raiz menciona TypeORM aunque el backend usa `pg` directo.
- Observabilidad de produccion mas ordenada: correlacion request-id, logs estructurados, trazas por operacion offline, metricas de cola y errores por tienda/usuario.
- Sistema de permisos mas granular. Hoy hay roles generales y un campo `permisos` JSONB, pero falta normalizar permisos por accion/modulo si el sistema crecera.

## Riesgos principales

- Riesgo de inconsistencias de datos si las reglas de negocio se duplican entre React, Flutter y backend.
- Riesgo de regresiones por falta de tests React y baja cobertura especifica por modulo backend.
- Riesgo de deuda de datos por tener DDL repartido entre schema maestro, migraciones y alteraciones automaticas en bootstrap.
- Riesgo de seguridad por almacenamiento de token web en `localStorage`; es practico para SPA, pero aumenta impacto ante XSS.
- Riesgo de performance por pantallas que consultan listas completas y calculan totales en cliente, especialmente dashboard/reportes/multi-tienda.

## Prioridad recomendada

1. Estabilizar contratos y base de datos: DTOs, OpenAPI confiable, migraciones versionadas y prohibir DDL silencioso en bootstrap salvo tablas operativas controladas.
2. Cerrar flujos criticos con pruebas: login, venta POS, cierre caja, inventario, pedido, despacho, entrega, cobro, devolucion y sync offline.
3. Separar logica de UI: hooks/repositorios por dominio en React, servicios de aplicacion en backend, casos de uso compartidos documentados.
4. Mejorar tablas y pantallas operativas: paginacion server-side, filtros persistentes, estados vacios, acciones masivas, exportacion consistente, columnas configurables.
5. Pulir UX visual: unificar densidad, jerarquia, estados de error/carga, version movil/tablet, tema consistente y tablero ejecutivo mas accionable.

## Documentos generados

- `01_WEB_REACT.md`: alcance, faltantes y mejoras del frontend.
- `02_BACKEND_NEST_BD.md`: API, logica, tablas y riesgos de base de datos.
- `03_FLUTTER_MOVIL.md`: app movil, offline, pantallas y mejoras.
- `04_PLAN_PRIORIZADO.md`: plan practico por prioridad.
