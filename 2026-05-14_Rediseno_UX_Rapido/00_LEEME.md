# Rediseno UX Rapido Pino2

Fecha: 2026-05-14

Objetivo: convertir React y Flutter en una experiencia mas rapida, ligera y facil para operacion diaria. El cambio propuesto no busca solo "verse moderno"; busca bajar vueltas, pantallas, clics, campos visibles y cambio de contexto.

## Diagnostico corto

El sistema tiene buena cobertura funcional, pero la experiencia esta pesada:

- React tiene demasiados destinos visibles, grupos y pantallas separadas.
- Flutter esta mejor orientado a tarea, pero todavia mezcla home, metricas, sincronizacion y entrada a flujos.
- Varias pantallas web parecen de estilos distintos: neumorfismo, cards grandes, gradientes, tablas clasicas y tableros tipo kanban conviven sin una regla comun.
- Para tareas frecuentes, el usuario debe navegar por modulo en vez de entrar directo a una accion.

## Nueva direccion

Pino2 debe sentirse como una herramienta de trabajo rapido:

- El usuario entra y ve su puesto de trabajo, no un menu largo.
- Cada rol tiene 3 a 5 acciones principales visibles.
- Las tareas frecuentes se resuelven en una pantalla o en un panel lateral.
- Los formularios largos se convierten en pasos compactos, defaults inteligentes y edicion directa.
- El diseno baja decoracion y sube densidad legible.

## Documentos

- `01_DIAGNOSTICO_ACTUAL_REACT_FLUTTER.md`: problemas reales detectados por plataforma.
- `02_NUEVO_MODELO_EXPERIENCIA.md`: nueva arquitectura UX por roles, puestos de trabajo y acciones rapidas.
- `03_REDISENO_REACT_WEB.md`: propuesta concreta para React web.
- `04_REDISENO_FLUTTER_MOVIL.md`: propuesta concreta para Flutter.
- `05_FLUJOS_RAPIDOS_OBJETIVO.md`: flujos actuales vs flujos nuevos.
- `06_SISTEMA_VISUAL_COMPONENTES.md`: estilo visual, componentes, densidad y reglas de UI.
- `07_PLAN_IMPLEMENTACION_PRIORIZADO.md`: fases, entregables y orden recomendado.
- `08_REFERENCIAS_INVESTIGACION.md`: fuentes usadas y principios aplicados.
- `09_MATRIZ_MIGRACION_PANTALLAS.md`: donde migra cada pantalla actual.
- `10_SEGUNDA_PASADA_HUECOS_Y_MEJORAS.md`: huecos detectados en la revision adicional.
- `11_GUIA_PARA_IA_EJECUTORA.md`: instrucciones pieza por pieza para que otra IA implemente sin perderse.
- `12_BACKLOG_TECNICO_POR_PIEZAS.md`: tareas atomicas con archivos, tecnologia, pasos y aceptacion.
- `13_CONTRATOS_UX_Y_DATOS.md`: contratos de estados, objetos, acciones y feedback para mantener consistencia.

## Decision principal

No conviene redisenar pagina por pagina copiando el mapa actual. Conviene crear una capa nueva de "workspaces" por rol y mover las pantallas existentes detras de acciones contextuales. Asi se puede mejorar rapido sin destruir la funcionalidad actual.
