# Roadmap del UI Kit — SubZero

**Dirección acordada:** Select sencillo → Autocomplete con búsqueda remota y carga incremental →
virtualización si el volumen la justifica.

Este documento registra el camino previsto, no una implementación ni una API definitiva.
Button, Spinner, Input, Select y la primitiva interna FieldContainer ya existen; sus contratos están en [docs/ui-kit.md](docs/ui-kit.md).
El alcance de producto se describe en [docs/subzero-specs.md](docs/subzero-specs.md).
El inventario incluye los componentes previstos en ese alcance y en la estructura de
[AGENTS.md](AGENTS.md), no un catálogo ilimitado de controles. Las fases detalladas de selección
y búsqueda se mantienen; las demás piezas se desarrollarán cuando las necesite una feature.

## Inventario de componentes

### Implementados

| Componente     | Ubicación                    | Responsabilidad                                                                                            |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Button         | `shared/ui/button/`          | Acciones, variantes visuales y estado de carga.                                                            |
| Spinner        | `shared/ui/spinner/`         | Progreso indeterminado.                                                                                    |
| Input          | `shared/ui/input/`           | Entrada de texto con label flotante.                                                                       |
| Select         | `shared/ui/select/`          | Selección simple con panel propio (Aria/CDK); valores primitivos, Signal Forms y catálogos del consumidor. |
| FieldContainer | `shared/ui/field-container/` | Presentación compartida de Input y Select por composición.                                                 |

MoneyInput también está implementado en `shared/ui/money-input/`: punto decimal y modelo de centavos enteros o null.

`shared/ui/sizing.ts` también existe: es un módulo de tokens compartidos, no un componente.
Todas las ubicaciones de este documento son relativas a `src/app/`.

### Pendientes de definición e implementación

Las ubicaciones siguientes son propuestas organizativas, no APIs ya aprobadas. Antes de crear
cada componente, definir su contrato y accesibilidad en `docs/ui-kit.md`.

| Componente       | Ubicación propuesta              | Necesidad / alcance                                                                                                                                                      |
| ---------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autocomplete     | `shared/ui/autocomplete/`        | Búsqueda y selección con opciones suministradas por el consumidor; dirección acordada en este roadmap.                                                                   |
| Numeric Input    | `shared/ui/input/` (por evaluar) | Entrada numérica genérica, independiente de MoneyInput. Definir modelo `number` o `null`, conversión, valor vacío y atributos `min`, `max`, `step` antes de implementar. |
| DateInput        | `shared/ui/date-input/`          | Selección de fecha de calendario; empezar por un control nativo y definir el contrato ISO `YYYY-MM-DD`; RF-B1.                                                           |
| Card             | `shared/ui/card/`                | Contenedor visual con contenido proyectado, sin datos ni cálculos de suscripciones; RF-A y RF-C3.                                                                        |
| Badge            | `shared/ui/badge/`               | Indicador visual genérico; el consumidor traduce estado de negocio a texto e intención visual. Previsto en arquitectura.                                                 |
| Dialog / Modal   | `shared/ui/modal/`               | Contenedor modal accesible para confirmaciones y, si se elige ese flujo, formularios; RF-B3. Un solo componente base, no dos implementaciones duplicadas.                |
| Table            | `shared/ui/table/`               | Columnas y filas genéricas con ordenamiento, sin conocer el modelo Subscription; RF-C1.                                                                                  |
| Pagination       | `shared/ui/pagination/`          | Navegación de páginas y estado de página/tamaño suministrado por el consumidor; RF-C1.                                                                                   |
| SegmentedControl | `shared/ui/segmented-control/`   | Elección genérica entre opciones excluyentes, inicialmente tabla/cards; RF-C3. Crear solo si aporta reutilización frente a componer Button.                              |
| Skeleton         | `shared/ui/skeleton/`            | Placeholder visual de carga para bloques de contenido; NFR de estados de UI.                                                                                             |
| EmptyState       | `shared/ui/empty-state/`         | Mensaje, contenido y acción para ausencia de datos, definidos por el consumidor; NFR de estados de UI.                                                                   |
| Chart            | `shared/ui/chart/`               | Wrapper de ECharts: inicializar, actualizar y destruir la instancia. Datos y agrupaciones pertenecen al dashboard; RF-A4.                                                |
| Toast            | `shared/ui/toast/`               | Presentación accesible de avisos temporales. Previsto en arquitectura; prioridad y mecanismo de coordinación pendientes.                                                 |
| Avatar           | `shared/ui/avatar/`              | Representación visual genérica de imagen o iniciales. Previsto en arquitectura; condicionado a una necesidad real de usuarios/perfiles.                                  |

### Orden orientativo del resto del kit

1. **Base de campos:** definir `FieldContainer` y planificar la extracción de la presentación de
   Input sin cambiar su contrato público, antes de duplicarla en Select.
2. **Formularios:** MoneyInput y DateInput, además de Select y Autocomplete según el plan detallado.
3. **Presentación y estados:** Card, Badge, Skeleton y EmptyState.
4. **Gestión de suscripciones:** Dialog/Modal, Table y Pagination; evaluar SegmentedControl.
5. **Dashboard:** Chart, manteniendo los cálculos fuera del kit.
6. **Complementos:** Toast cuando se defina la experiencia de avisos; Avatar si entra en el alcance.

Este orden no obliga a terminar todo el kit antes de construir una feature. Tampoco confirma
Auth, perfiles ni una infraestructura global de notificaciones.

### Límites del UI kit

- La tarjeta de suscripción, los KPIs, el formulario y los filtros del dominio viven en sus
  respectivas `features/*/ui`, aunque se compongan con controles compartidos.
- Las acciones de cambio de tema o vista pueden componerse en sus consumidores; el kit no
  conserva preferencias globales ni conoce el router o el store del dominio.
- Las reglas monetarias, el cálculo de renovaciones y las llamadas HTTP no pertenecen a
  `shared/ui`.
- Los iconos, el botón de limpiar y la visibilidad de contraseña siguen pendientes como
  extensiones de Input, no como componentes ya implementados.
- La virtualización sigue siendo una capacidad opcional; no implica crear otro componente
  público ni añadir una dependencia sin evaluarla.

## Plan detallado de Select y Autocomplete

| Fase | Entrega                                                 | Estado                            |
| ---- | ------------------------------------------------------- | --------------------------------- |
| 1    | Select para elegir entre opciones sin búsqueda editable | Implementado; ver ui-kit          |
| 2    | Autocomplete con búsqueda remota y carga incremental    | Implementado; ver ui-kit          |
| 3    | Virtual scroll, condicionado al volumen y rendimiento   | Opcional; pendiente de evaluación |

### 1. Select

- [x] Definir el contrato en `docs/ui-kit.md` antes de implementar.
- [x] Definir `FieldContainer` y extraer la presentación común de Input antes de reutilizarla en
      Select; conservar valores, eventos y comportamiento público de Input.
- [x] Sustituir la primera versión nativa por un panel propio con Angular Aria y CDK Overlay;
      conservar valores, opciones null del consumidor e integración con Signal Forms.
- [x] Cubrir inicialmente catálogos definidos en frontend: ciclos, estados y monedas.
- [x] Recibir las opciones del consumidor, sin conocer su origen ni realizar peticiones HTTP.

El origen estático es el uso inicial, no una restricción del componente. Un Select también puede
recibir una lista que el consumidor haya obtenido del backend.

### 2. Autocomplete

- [x] Definir el contrato de búsqueda, selección, teclado y accesibilidad en `docs/ui-kit.md`.
- [x] Permitir escribir para buscar y seleccionar solo opciones existentes.
- [x] Recibir una función del consumidor con `(query, offset, limit) => Observable<Options[]>`.
- [x] Centralizar debounce de 250 ms, acumulación de páginas y carga incremental en el componente.
- [x] Implementar `FormValueControl` para Signal Forms; conservar el objeto opción seleccionado.
- [x] Añadir limpieza opcional de selección en Autocomplete y de texto en Input.
- [ ] Integrar una feature real con búsqueda remota y verificar accesibilidad en navegador/lector de pantalla.

El Autocomplete no depende obligatoriamente del backend: su interacción es editable y puede
recibir resultados locales o remotos. La primera integración prevista usa búsqueda remota.

#### Separación de responsabilidades

| Capa                                     | Responsabilidad                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `shared/ui`                              | Query, debounce, offset/limit, acumulación, cancelación de solicitudes obsoletas, selección, teclado y accesibilidad. |
| Consumidor y `data-access` de la feature | Realizar la petición y mapear DTOs a `SelectOption`; no acumula páginas ni mantiene estados visuales de carga.        |

El componente compartido no conoce endpoints ni inyecta servicios de negocio. `autocompleteFn`
recibe `{ query, offset, limit }` y devuelve solo la página actual como `Observable<Options[]>`.
El tamaño predeterminado es 20; una página menor que `limit` indica el final. Si la última página
llega llena, la siguiente petición puede devolver una página vacía.

#### Paginación remota

- Usar inicialmente `offset` y `limit`, con un orden determinista, por ejemplo nombre e ID.
- Reiniciar resultados y posición de paginación al cambiar la búsqueda.
- Aplicar debounce interno fijo de 250 ms y cancelar solicitudes de consultas anteriores.
- Evitar solicitudes duplicadas simultáneas; cargar la página siguiente automáticamente al acercarse al final del scroll.
- Inferir el final si una página trae menos elementos que `limit`.

La feature adapta sus parámetros backend (por ejemplo `_start`/`_limit`) dentro de `autocompleteFn`.
Para catálogos grandes o con cambios frecuentes, evaluar cursores antes de mantener offsets elevados
como solución permanente.

### 3. Virtualización opcional

- [ ] Evaluar el volumen esperado de opciones y el costo real de renderizarlas.
- [ ] Incorporar virtual scroll solo cuando exista una necesidad identificada.
- [ ] Verificar navegación por teclado y que la opción activa esté renderizada y sea accesible.

**No confundir las tres responsabilidades:**

| Mecanismo                       | Qué controla                                                   |
| ------------------------------- | -------------------------------------------------------------- |
| Paginación (`offset` / `limit`) | Cuántos registros se descargan por petición.                   |
| Carga incremental               | Cuándo se solicita la siguiente página al recorrer resultados. |
| Virtual scroll                  | Cuántas opciones se renderizan simultáneamente en el DOM.      |

La búsqueda paginada puede funcionar sin virtualización. Virtualizar no pagina el backend ni
limita por sí mismo la memoria de los resultados acumulados. La elección de una primitiva o
dependencia para virtualizar queda pendiente; este roadmap no añade ninguna.

## Decisiones pendientes antes de implementar

- [x] Solo se seleccionan opciones existentes; el texto escrito es una consulta, nunca el valor.
- [x] `value` es el objeto de opción completo para conservar su etiqueta aunque no esté en la página
      actual; cada consumidor decide si guarda el objeto o extrae su ID.
- [x] Integración prevista con Signal Forms y escala de tamaños existente; carga, búsqueda y
      paginación se reciben/controlan desde el consumidor.
- [ ] Definir detalles de implementación y probar navegación/accessibilidad en navegador real.

## Siguiente paso

Validar visualmente Select y Autocomplete en navegador y usar Autocomplete desde una feature real
cuando corresponda. La implementación está en `src/app/shared/ui/autocomplete/`; ver el contrato
actualizado en `docs/ui-kit.md`.

## Referencias

- [WAI-ARIA: patrón Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).
- [Angular CDK: virtual scrolling](https://material.angular.dev/cdk/scrolling/overview).
- [PostgreSQL: consideraciones de LIMIT y OFFSET](https://www.postgresql.org/docs/current/queries-limit.html).
