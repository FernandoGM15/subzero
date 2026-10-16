# SubzeroFe - Architecture Guidelines

> Documento vivo para mantener consistencia arquitectónica. Actualizar cuando evolucione el proyecto.

---

## 🏗️ Estructura de Carpetas (Feature-Sliced Design Lite)

```
src/app/
├── core/                          # 🔒 Singleton globals
│   ├── providers/                 # Interceptors, error handlers, config providers
│   ├── guards/                    # Route guards (auth, roles, permissions)
│   └── tokens/                    # InjectionTokens para configuración
├── shared/                        # 🧱 UI Kit + Utilities (SIN lógica de negocio)
│   ├── ui/                        # Componentes dumb reutilizables
│   │   ├── sizing.ts              # 🔧 Escala de tamaños compartida (módulo de kit, NO componente)
│   │   ├── option.ts              # Tipos compartidos de opciones para controles de selección
│   │   ├── button/
│   │   ├── spinner/               # Indicador de carga reutilizable (decorativo por defecto)
│   │   ├── input/
│   │   ├── card/
│   │   ├── badge/
│   │   ├── avatar/
│   │   ├── modal/
│   │   ├── table/                 # Tabla genérica (sort + paginación por signals)
│   │   ├── chart/                 # Wrapper de ECharts (init/update/destroy)
│   │   └── toast/
│   ├── pipes/                     # Pipes puros (formatDate, currency, etc.)
│   ├── directives/                # Directivas de presentación
│   ├── utils/                     # Funciones puras (helpers, validators)
│   └── types/                     # Tipos compartidos (Pagination, ApiResponse)
├── features/                      # 🎯 DOMINIO - Cada feature es autónoma (lazy loaded)
│   ├── subscriptions/             # Módulo B+C: CRUD, tabla, filtros, cards
│   │   ├── data-access/           # API (json-server) + store (Signals)
│   │   ├── domain/                # Subscription model + rules (ciclos, nextBillingDate, Money)
│   │   ├── ui/                    # table-page, grid-page, subscription-form, filters
│   │   ├── subscriptions.routes.ts
│   │   └── index.ts               # 🔑 Public API únicamente
│   ├── dashboard/                 # Módulo A: KPIs + donut (consume store de subscriptions)
│   │   ├── data-access/
│   │   ├── domain/                # KPI projections (mensual/anual, próxima renovación)
│   │   ├── ui/
│   │   ├── dashboard.routes.ts
│   │   └── index.ts
│   └── [pendiente: auth / categories]  # Según decisiones de Usuarios/Categorías
├── layout/                        # 🖼️ Shell components
│   ├── shell/                     # Layout principal + router-outlet
│   └── navigation/                # Header, Sidebar, Breadcrumbs
├── app.routes.ts                  # Configuración principal (lazy load features)
├── app.config.ts                  # Providers globales
└── app.ts                         # Componente raíz minimal
```

---

## 🧠 Patrón Interno por Feature (Domain-Driven)

```
features/feature-name/
├── data-access/          # 🌐 Exterior: API, Storage, State (Signals)
│   ├── feature.service.ts
│   ├── feature.store.ts  # Signal-based store (computed, effect)
│   └── feature.api.ts
├── domain/               # 🧠 Núcleo: Types, Rules, Validators (PURE, testable)
│   ├── feature.model.ts
│   ├── feature.rules.ts  # Lógica de negocio SIN dependencias Angular
│   └── feature.errors.ts
├── ui/                   # 🎨 Presentación
│   ├── feature-list/
│   ├── feature-form/
│   └── feature-detail/
├── feature.routes.ts     # 🛣️ Lazy loading config
└── index.ts              # 📦 Public API (solo lo que se exporta)
```

**Regla de oro**: `domain/` **NO importa de** `data-access/` ni `ui/` → testable en Node puro.

---

## ⚙️ Stack Tecnológico Decidido (v1.2)

> Producto: **SubZero** — Minimalist Subscription & Recurring Expense Tracker (MVP).
> Ver PRD del proyecto para alcance funcional.

| Capa             | Decisión                                            | Notas                                                           |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| Framework        | **Angular 22** (Standalone)                         | Sin NgModules                                                   |
| Change Detection | **Zoneless** + **OnPush por defecto (v22)**         | Los componentes **omiten** `changeDetection`; ver Principios #8 |
| Estado           | **Signals + `computed` + `effect`**                 | Sin NgRx; store local por feature                               |
| Estilos          | **TailwindCSS v4**                                  | `@import 'tailwindcss'`                                         |
| Formularios      | **Signal Forms** (`@angular/forms/signals`)         | Requiere v21+; API nueva, aislar en `ui/`                       |
| Validación       | **Zod** + `validateStandardSchema()`                | Un schema = fuente de verdad (formulario + frontera API)        |
| HTTP             | `HttpClient`                                        | **`fetch` es el default en v22**; interceptores **funcionales** |
| Fechas           | **`DatePipe` + funciones puras + ISO `YYYY-MM-DD`** | **0 dependencias** (ver Convenciones de Dominio)                |
| Dinero           | **Enteros (centavos)** + `Intl.NumberFormat`        | Nunca `float`; ver Convenciones de Dominio                      |
| Gráficos         | **ECharts** (Apache-2.0)                            | Importar por módulos (`echarts/core`); sin wrapper              |
| Tabla            | **Componente genérico propio** + signals            | `shared/ui/table`; sin librería                                 |
| Íconos           | **`@tabler/icons-angular`** (MIT)                   | `provideTablerIcons()`; tree-shaken                             |
| Lint             | `angular-eslint` + **`eslint-plugin-boundaries`**   | Hace cumplir este documento por CI                              |
| Backend dev      | **json-server**                                     | REST desde `db.json`; sin backend real                          |
| Testing          | **Vitest** + `@testing-library/angular`             | Specs de UI por rol/accesibilidad; ver `docs/ui-kit.md`         |
| Build            | `@angular/build` (esbuild)                          | Ya configurado                                                  |
| Package manager  | **pnpm** (vía corepack)                             | Ver nota de pnpm                                                |

### 📦 Filosofía de dependencias

> **Minimizar dependencias externas.** Preferir primitivas nativas del framework/plataforma.

```
Runtime:   Angular · RxJS · Zod · ECharts · @tabler/icons-angular
Dev:       Tailwind · Vitest · @testing-library/angular · ESLint · Prettier · json-server
CERO deps: fechas · dinero (Intl) · estado (Signals) · HTTP (nativo)
```

**Regla:** antes de añadir una dependencia, justificar por qué no se resuelve con una primitiva nativa.

### ⚠️ Notas de entorno

- **pnpm 12** bloquea scripts de instalación por defecto → `esbuild`, `@parcel/watcher`, `lmdb`,
  `msgpackr-extract`, `unrs-resolver` requieren aprobación vía **`allowBuilds`** en
  `pnpm-workspace.yaml` (`pnpm approve-builds --all`).
- **json-server** fijado en la versión **estable `0.17.4`**; su CLI es
  `json-server --watch db.json` y usa paginación `_page`/`_limit`, orden `_sort`/`_order`
  (aunque el orden/paginación del MVP es en cliente).
  - Script: **`pnpm mock`** (levanta `db.json` en `:3000` con `--watch`).
  - **Los `id` se preservan como `number`** (lowdb no los stringifica) → el schema Zod de
    frontera debe tipar `id: number`.
- **Proxy dev**: `proxy.conf.json` mapea `/api/*` → `http://localhost:3000/*` (con `pathRewrite`),
  ya cableado en `angular.json` (`serve.options.proxyConfig`). El frontend consume `/api/<recurso>`
  y evita colisiones con las rutas SPA. Requiere `pnpm mock` corriendo en paralelo a `pnpm start`.
- **ECharts bundle**: usar `echarts/core` + `.use([...])` con solo los módulos necesarios
  (Pie, Tooltip, Legend, CanvasRenderer) para no romper el NFR de LCP < 1.5s.

### 🚧 Enforcement de arquitectura (ESLint boundaries)

`eslint.config.js` implementa este documento vía **`eslint-plugin-boundaries` v7** + **`no-restricted-imports`**.
La resolución de imports TS la aporta **`eslint-import-resolver-typescript`** (dev-only), sin la cual
boundaries no puede clasificar el destino de imports sin extensión.

**Elementos** (`src/app/**`): `core`, `shared`, `layout`, `feature` (con `capture: ['featureName']`).
Los archivos raíz (`app.ts`, `app.config.ts`, `app.routes.ts`) quedan **sin clasificar** = composition root.

**Políticas permitidas** (todo lo demás se rechaza):

| from ↓ / to → | core | shared | layout |      feature       |
| ------------- | :--: | :----: | :----: | :----------------: |
| **core**      |  ✅  |   ✅   |   ❌   |         ❌         |
| **shared**    |  ✅  |   ✅   |   ❌   |         ❌         |
| **layout**    |  ✅  |   ✅   |   ✅   |         ❌         |
| **feature**   |  ✅  |   ✅   |   ❌   | ✅ (mismo feature) |

**Regla de pureza `domain/`**: `no-restricted-imports` prohíbe `@angular/*`, `**/data-access/**` y
`**/ui/**` en cualquier `src/app/**/domain/**/*.ts` (testable en Node puro).

> Ejecuta **`pnpm lint`** antes de commitear. Verificado en CI local: violaciones de frontera y de
> pureza de `domain/` se detectan correctamente (cross-feature, `shared → feature`, Angular en `domain/`).

---

## 📋 Principios de Código

### 1. **Colocation**

Todo lo relacionado a un feature vive junto (component, service, store, types, test).

### 2. **Public API (index.ts)**

Cada feature expone solo lo necesario vía `index.ts`. Internals son `private`.

### 3. **Smart vs Dumb Components**

- **Smart** (`data-access`, `ui/smart-*`): Inyectan services/store, usan signals
- **Dumb** (`shared/ui`, `ui/dumb-*`): Solo `@Input() / @Output()` / `signal()` inputs

### 4. **Local State First**

Signal store por feature (`feature.store.ts`). Estado global **mínimo** (solo auth, UI global).

### 5. **Lazy Loading por Defecto**

Cada feature = ruta lazy loaded → chunk separado.

### 6. **Standalone First**

Sin NgModules. `bootstrapApplication` + `provideRouter` + `importProvidersFrom` si necesario.

### 7. **Domain Logic Pure**

`domain/*.rules.ts` = funciones puras TypeScript. Cero imports de Angular. Testables sin TestBed.

### 8. **Change Detection → OnPush implícito (v22)**

Angular 22 hizo **OnPush el default**: un componente sin `changeDetection` **es** OnPush.
Por eso los componentes **no** declaran `changeDetection: ChangeDetectionStrategy.OnPush` (es redundante).
Solo se declara para **opt-out** explícito:

```ts
// ❌ redundante en v22
@Component({ changeDetection: ChangeDetectionStrategy.OnPush /* … */ })

// ✅ v22 — OnPush implícito (lo correcto para este proyecto)
@Component({ /* … */ })

// ⚠️ opt-out — solo para código legacy que muta estado sin señales
@Component({ changeDetection: ChangeDetectionStrategy.Eager /* … */ })
```

Regla: el estado que la vista lee se escribe con **signals**; nunca se muta en el sitio sin señalizar.

---

## 🧾 Convenciones de Dominio (críticas)

### 1. Fechas → **ISO `YYYY-MM-DD`** como string (calendario, sin hora)

- Las fechas de negocio (`startDate`, `nextBillingDate`) son **fechas de calendario**, no instantes.
- Representarlas como **string `YYYY-MM-DD`** → evita bugs de timezone/DST y comparación por string.
- **Display**: `DatePipe` (nativo). **Aritmética**: funciones puras (ver `domain/date.rules.ts`).
- **NO** usar `Date` en el modelo, ni timestamps, ni librerías de fechas.

```ts
export type IsoDate = string; // 'YYYY-MM-DD'
// addMonths/addWeeks/addYears/daysBetween → puras, con clamp de fin de mes (bisiestos incluidos)
```

### 2. Dinero → **enteros en la unidad mínima** (centavos)

- Nunca `float`/`number` decimal para dinero en el modelo.
- `amountCents: number` (entero) + `currency: string`.
- **Display**: `Intl.NumberFormat`. **Cálculos**: aritmética entera.

### 3. Validación de frontera → **Zod**

- Validar **siempre** datos externos: respuestas de API (json-server), `localStorage`, params.
- Los tipos de TS se borran en runtime → no protegen datos externos.
- Reutilizar el mismo schema en Signal Forms vía `validateStandardSchema()`.

---

## 🔑 Convenciones de Nombrado

| Tipo         | Convención                   | Ejemplo                         |
| ------------ | ---------------------------- | ------------------------------- |
| Componentes  | kebab-case + sufijo          | `user-card.ts`, `login-form.ts` |
| Services     | kebab-case + `.service.ts`   | `auth.service.ts`               |
| Stores       | kebab-case + `.store.ts`     | `auth.store.ts`                 |
| Models/Types | kebab-case + `.model.ts`     | `user.model.ts`                 |
| Rules        | kebab-case + `.rules.ts`     | `auth.rules.ts`                 |
| Routes       | kebab-case + `.routes.ts`    | `auth.routes.ts`                |
| Pipes        | kebab-case + `.pipe.ts`      | `format-date.pipe.ts`           |
| Directives   | kebab-case + `.directive.ts` | `click-outside.directive.ts`    |
| Barrels      | `index.ts` en cada carpeta   | `export * from './button'`      |

### Sufijo `Container`: envolturas presentacionales

- Usar `<Purpose>Container` para una envoltura reutilizable que compone presentación alrededor
  de contenido o de un control. Ejemplo acordado: **`FieldContainer`**, no `FieldShell`.
- Archivo/carpeta: `field-container/field-container.ts`; selector: `app-field-container`.
- En `shared/ui`, `Container` **no significa componente smart**: no accede a datos, no inyecta
  servicios del dominio ni contiene validación de negocio.
- Preferir composición y proyección de contenido frente a una clase base heredada. El contenedor
  comparte estructura visual; cada control conserva su valor, eventos y contrato de formulario.
- Aplicar el sufijo cuando exista esa responsabilidad estructural; no renombrar todos los
  componentes visuales ni añadir envolturas sin una necesidad de reutilización.

`FieldContainer` centraliza borde/foco, label flotante, indicador obligatorio, ayuda/error y
reserva de espacio para Input, Select y futuros controles compatibles. La coordinación de las
asociaciones accesibles forma parte de su contrato; el valor y los atributos del elemento nativo
siguen siendo responsabilidad de cada control. Su API y extracción están pendientes de definición
e implementación; esta convención no afirma que ya exista.

---

## 🧩 Convenciones de Templates (HTML)

### 1. Elementos sin contenido → **self-closing** (`<x />`)

- Si un elemento **no tiene hijos**, se cierra en la misma etiqueta: `<ng-content />`, `<app-button />`, `<tabler-icon />`, `<div />`.
- **NO** usar la forma con cierre explícito para elementos vacíos: `<ng-content></ng-content>` ❌ → `<ng-content />` ✅.
- Aplica a **todo** el markup: templates de componentes, `index.html` y ejemplos de la documentación.

```html
<!-- ✅ correcto -->
<ng-content />
<tabler-icon icon="plus" />
<app-button />

<!-- ❌ incorrecto -->
<ng-content></ng-content>
```

---

## 📐 UI Kit: escala de tamaños (`shared/ui/sizing.ts`)

> Contrato de los componentes (propósito, API, accesibilidad y roadmap de theming): **`docs/ui-kit.md`**.

Fuente única de verdad de los tamaños del UI kit. Es un **módulo de kit**, no un componente:
vive como archivo suelto en `shared/ui/` porque lo consumen **varios** componentes del kit
(es la excepción deliberada a la regla "una carpeta por componente").

```ts
export type ControlSize = 'xs' | 'sm' | 'md' | 'lg'; // escala compartida por todo control

export const CONTROL: Record<ControlSize, ControlSizeTokens>; // dimensiones de la CAJA del control
export const SPINNER_SIZE: Record<ControlSize, string>; // tamaño del GLIFO (no es un control)
```

- **Todo control nuevo** (`input`, `select`, `badge`…) parte de `CONTROL[size]`; nunca redefine sus propios mapas (`HEIGHT_CLASSES`, `PADDING_X_CLASSES`, …).
- **Cada semántica en su mapa**: la caja de un control y el glifo de un spinner son cosas distintas; no se fuerza un único mapa para todo.
- Las clases se guardan como strings **literales y completos** (`[&_svg]:size-4`), nunca concatenados en runtime: Tailwind v4 las escanea del fuente y solo así genera las utilidades.
- **Colores y radius NO viven aquí** → son tokens CSS en `src/styles.css` (`@theme inline`), porque sí cambian en runtime (theming).

## 📦 Tipos compartidos de opciones (`shared/ui/option.ts`)

La forma común de una opción vive en un módulo del UI kit, no dentro del componente Select:

```ts
export type SelectValue = string | number;
export interface SelectOption<TValue extends SelectValue | null = SelectValue | null> {
  readonly value: TValue;
  readonly label: string;
  readonly disabled?: boolean;
}
```

- `SelectOption` permite `null` por defecto para conservar las opciones de limpieza de Select.
- Autocomplete restringe el tipo a `SelectOption<SelectValue>`: una opción elegida siempre tiene
  un valor concreto, mientras que la ausencia de selección se representa con `null` en el modelo.
- Los componentes importan el tipo compartido; no deben depender entre sí para reutilizar contratos.
- El barrel de Select reexporta `SelectOption` y `SelectValue` para conservar la ruta pública existente.

---

## 🌐 Configuración regional de fechas

- `app.config.ts` configura `LOCALE_ID` (`es-MX`) y registra los datos regionales de Angular.
- DatePicker hereda ese locale y los valores de `provideDatePickerDefaults`; no repetirlos en cada instancia.
- Los inputs `locale`, `displayFormat` y `messages` permiten excepciones locales. La configuración
  global fija defaults iniciales, no implementa cambio global reactivo de idioma.
- Los nombres de fechas usan `Intl`; los textos accesibles del DatePicker tienen español/inglés y
  overrides parciales por configuración o instancia. Otros idiomas usan fallback inglés para textos.
- El modelo permanece ISO `YYYY-MM-DD`; labels, ayuda y errores del consumidor no se traducen automáticamente.

---

## 🚫 Qué NO Hacer

- ❌ Importar de `features/*/data-access` o `features/*/ui` desde otro feature
- ❌ Poner lógica de negocio en componentes
- ❌ Usar `NgModule` (salvo librerías legacy)
- ❌ Estado global para datos de un solo feature
- ❌ `shared/ui` inyectando services de `features/*`
- ❌ `domain/` importando de Angular (`@angular/core`, `@angular/common`, etc.)
- ❌ Usar `Date`/timestamps en el modelo → usar **ISO `YYYY-MM-DD`**
- ❌ Usar `float` para dinero → usar **enteros (centavos)**
- ❌ Añadir librerías de fechas/dinero (date-fns, dayjs, currency.js…) → usar **primitivas nativas**
- ❌ Importar `echarts` completo → importar por módulos (`echarts/core`)
- ❌ Consumir datos externos sin **validar con Zod**
- ❌ Cerrar elementos vacíos con cierre explícito `<ng-content></ng-content>` → usar self-closing `<ng-content />`
- ❌ Declarar `changeDetection: ChangeDetectionStrategy.OnPush` → en v22 es el **default**; se **omite** (solo `Eager` como opt-out)
- ❌ Redefinir mapas de tamaño por componente (`HEIGHT_CLASSES`, `PADDING_X_CLASSES`…) → partir de `CONTROL` en `shared/ui/sizing.ts`

---

## ✅ Checklist al Crear Nuevo Feature

- [ ] Carpeta en `features/nombre-feature/`
- [ ] `data-access/` con `.service.ts` + `.store.ts` (Signals)
- [ ] `domain/` con `.model.ts` + `.rules.ts` (puro TS)
- [ ] `ui/` con componentes smart/dumb
- [ ] `feature.routes.ts` con lazy loading
- [ ] `index.ts` exportando Public API
- [ ] Tests: `domain/` (unit), `ui/` (component), `data-access/` (integration)
- [ ] Documentar en este AGENTS.md si hay decisiones nuevas

---

## 📝 Decisiones Pendientes / Por Definir

### ✅ Resueltas

- [x] **Dominio** → **SubZero**: tracker de suscripciones y gastos recurrentes (MVP).
- [x] **Features principales** → `subscriptions` (Módulo B+C), `dashboard` (Módulo A).
- [x] **API Strategy** → REST con **json-server** en dev; `HttpClient` + Zod en frontera.
- [x] **UI Library** → **Tailwind puro** (componentes propios) + `@tabler/icons-angular`.

### ⏳ Pendientes

- [ ] **Usuarios/Auth** → ¿single-user local o multi-user con login? (define si entra `features/auth`)
- [ ] **Moneda** → KPIs: ¿moneda base única, por moneda separado, o single-currency?
- [ ] **Categorías/Métodos de pago** → ¿catálogo fijo del sistema o CRUD del usuario?
- [ ] **Roles/Permisos** → RBAC / ABAC / simple (depende de Auth)
- [ ] **SSR/SSG** → Angular Universal / prerender / SPA only
- [x] **Primitivas de selección accesible** → `@angular/aria` (combobox/listbox) +
      `@angular/cdk/overlay` para Select propio con Tailwind, sin Angular Material.
      Diálogos y otras primitivas se evaluarán cuando corresponda.
- [ ] **Testing Strategy** → cobertura objetivo, e2e con Playwright/Cypress
- [ ] **Reglas de negocio pendientes del PRD** → estados (`ACTIVE/PAUSED/CANCELLED`), alertas de renovación, export `.ics`/CSV

---

## 🔄 Historial de Cambios

| Fecha      | Cambio                                                                                                                                                          | Autor   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2026-10-13 | Estructura base FSD Lite + Signals only                                                                                                                         | Inicial |
| 2026-10-13 | Stack v1.2 cerrado (Signal Forms, Zod, ECharts, Tabler, pnpm, json-server) + convenciones de dominio (ISO date, centavos, Zod)                                  | Stack   |
| 2026-10-13 | Tooling: ESLint flat + `eslint-plugin-boundaries` v7 (enforcement de fronteras + pureza `domain/`), proxy `/api` → json-server 0.17.4, seed `db.json`, Prettier | Tooling |
| 2026-10-13 | Convención de templates: elementos vacíos en self-closing (`<ng-content />`)                                                                                    | UI Kit  |
| 2026-10-13 | UI Kit: tokens semánticos Tailwind v4 (`@theme inline`) + `Button` (variantes/tamaños/estados) y `Spinner` (reutilizable)                                       | UI Kit  |
| 2026-10-14 | UI Kit: escala única de tamaños en `shared/ui/sizing.ts` (`CONTROL` + `SPINNER_SIZE`); OnPush es el default en v22 (los componentes omiten `changeDetection`)   | Docs    |
| 2026-10-14 | UI Kit: contrato de componentes en `docs/ui-kit.md` (propósito, API, a11y, roadmap de theming) + `@testing-library/angular` en specs                            | UI Kit  |
| 2026-10-15 | UI Kit: tipo genérico `SelectOption` centralizado en `shared/ui/option.ts`; Select conserva compatibilidad y Autocomplete restringe valores no nulos            | UI Kit  |

---

> **Nota**: Este documento vive en el repo. Cualquier decisión arquitectónica nueva se registra aquí.
