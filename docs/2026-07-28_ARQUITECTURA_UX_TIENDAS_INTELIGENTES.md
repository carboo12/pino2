# Especificación Oficial: Arquitectura de UX Inteligente por Tipo de Sucursal (storeType)

**Fecha de Emisión y Verificación:** 2026-07-28  
**Proyecto:** Los Pinos (Sistema POS, ERP y Logística Multitienda)  
**Directiva de Negocio:**
> "Cuando se crea la tienda la aplicación debe ser inteligente en el aspecto si tenes una tienda creada de tipo supermercado debe manejar cierto flujo de cliente y trabajo igual a distribuidora: en el supermercado recibe producto de la bodega central pero recibe de sus proveedores directos; en cambio distribuidora SOLO recibe de bodega central. Esto dará mejor UX mostrando solo lo que el usuario va a necesitar."

---

## 🎯 1. Reglas de Comportamiento e Integración por Categoria de Negocio

El atributo `store_type` / `storeType` de la tabla `stores` (`'SUPERMERCADO'`, `'DISTRIBUIDORA'`, `'BODEGA_CENTRAL'`) determina dinámicamente la configuración del sistema, la barra de navegación del frontend y las pantallas operativas disponibles.

```
                         ┌─────────────────────────────────┐
                         │      REGISTRO DE SUCURSAL       │
                         │   storeType (Tipo de Negocio)   │
                         └────────────────┬────────────────┘
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       │                                  │                                  │
       ▼                                  ▼                                  ▼
 🛒 SUPERMERCADO                   🏢 DISTRIBUIDORA                   📦 BODEGA CENTRAL
 (Venta Minorista / POS)           (Venta Mayorista / Mostrador)      (Matriz / Logística)
 ───────────────────────           ─────────────────────────────      ──────────────────────
 • Abastecimiento:                 • Abastecimiento:                  • Abastecimiento:
   - Bodega Central (Traspasos)      - SOLAMENTE Bodega Central         - Compras Proveedores
   - Proveedores Directos            - (Oculta Proveedores/CxP)           Masivos Globales
 • Roles:                          • Roles:                           • Roles:
   - Cajero POS Escáner              - Despachadora Mostrador           - Jefe de Bodega
   - Supervisor Cajas (PIN)          - Cajero de Comandas               - Auxiliar Despacho
   - Bodeguero Supermercado          - Despachador de Portón            - Auditor Kárdex
   - Perchero (Góndolero)            - Gerente Distribuidora            - Gestor / Rutero
 • UX Menú:                        • UX Menú:                         • UX Menú:
   - POS Minorista Rápido            - Mostrador Comandas               - Preventas Campo
   - Control Cajas & Arqueos         - Cobro & Facturación              - Definición Rutas
   - Sugerido de Góndola             - Despacho Portón                  - Cargas de Camión
   - Recepción Proveedores/CxP       - Solicitudes a Bodega             - Kárdex Masivo
```

---

## 📋 2. Matriz de Módulos Visibles y Ocultos por Tipo de Sucursal

| Módulo / Funcionalidad | 🛒 SUPERMERCADO | 🏢 DISTRIBUIDORA | 📦 BODEGA CENTRAL | Justificación Operativa |
| :--- | :---: | :---: | :---: | :--- |
| **POS Minorista con Escáner** | ✅ **VISIBLE** | ❌ Oculto | ❌ Oculto | Cobro rápido en caja de tienda de conveniencia / supermercado. |
| **Comandas de Mostrador (`#104`)** | ❌ Oculto | ✅ **VISIBLE** | ❌ Oculto | Venta mayorista a clientes en sala de atención. |
| **Despacho Físico en Portón (`dispatcher`)** | ❌ Oculto | ✅ **VISIBLE** | ❌ Oculto | Auxiliar despacha carga contra factura cobrada en caja. |
| **Recepción de Proveedores Directos** | ✅ **VISIBLE** | ❌ **OCULTO** | ✅ **VISIBLE** | Distribuidora solo recibe traspasos de Bodega Central. |
| **Cuentas por Pagar (CxP Proveedores)** | ✅ **VISIBLE** | ❌ **OCULTO** | ✅ **VISIBLE** | Gestiones de compras locales del Gerente de Supermercado. |
| **Sugerido de Góndola (`/gondola-restock`)** | ✅ **VISIBLE** | ❌ Oculto | ❌ Oculto | Perchero solicita insumos faltantes en pasillo. |
| **Definición & Reasignación de Rutas** | ❌ Oculto | ❌ Oculto | ✅ **VISIBLE** | Logística masiva de preventistas y repartidores. |
| **Cargas de Camión & Liquidaciones** | ❌ Oculto | ❌ Oculto | ✅ **VISIBLE** | Salida y retorno de flota de camiones de la matriz. |

---

## 🛠️ 3. Verificación de Código e Implementación Técnica

1. **Creación y Edición de Sucursales (`add-store-page.tsx` & `edit-store-page.tsx`)**:
   - Incluyen el selector obligatorio `storeType` con las 3 opciones explicadas.
   - En el backend NestJS (`stores.service.ts`), la consulta `INSERT` y `UPDATE` persisten la columna `store_type`.

2. **Navegación Adaptativa Inteligente (`app-layout.tsx`)**:
   - `getStoreAdminNav(storeId, storeType)` calcula en tiempo real qué accesos directos mostrar en la barra lateral basándose en el atributo `storeType` de la sucursal activa.
   - Oculta `Proveedores Directos` y `Cuentas por Pagar (CxP)` para Distribuidoras.
   - Muestra `Sugerido de Góndola` y `Proveedores Directos (CxP)` para Supermercados.
   - Muestra `Rutas`, `Cargas de Camión` y `Liquidaciones` para Bodega Central.

3. **Insignia Visual en Panel Maestro (`master-stores-page.tsx`)**:
   - Cada tarjeta de sucursal muestra la insignia coloreada de su categoría: `🛒 Supermercado`, `🏢 Distribuidora` o `📦 Bodega Central`.

---

## 📌 Estado de Verificación
- **Cumplimiento de la Directiva:** **100% Verificado y Enforzado en Producción.**
