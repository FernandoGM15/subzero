# UI Kit — SubZero

Contrato de los componentes de `src/app/shared/ui`.

> **Regla**: cada componente se **define aquí antes de implementarse**. El documento es la fuente de
> verdad del propósito, la API y la accesibilidad; el código lo implementa, no lo inventa.

- **Alcance**: primitivas de presentación (_dumb_). Sin lógica de negocio, sin acceso a datos, sin
  estado global.
- **Relacionado**: escala de tamaños (`shared/ui/sizing.ts`) y tokens (`src/styles.css`), documentados
  en `AGENTS.md`.
- **Iconografía**: los iconos de los componentes se renderizan con `TablerIconComponent` y los iconos
  importados de `@tabler/icons-angular`; no se dibujan iconos con SVG inline.

## Índice

| Componente                        | Selector              | Estado               | Pruebas                                                                                 |
| --------------------------------- | --------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| [Button](#button)                 | `app-button`          | Implementado         | [button.spec.ts](../src/app/shared/ui/button/button.spec.ts)                            |
| [Spinner](#spinner)               | `app-spinner`         | Implementado         | [spinner.spec.ts](../src/app/shared/ui/spinner/spinner.spec.ts)                         |
| [Input](#input)                   | `app-input`           | Implementado         | [input.spec.ts](../src/app/shared/ui/input/input.spec.ts)                               |
| [Select](#select)                 | `app-select`          | Implementado         | [select.spec.ts](../src/app/shared/ui/select/select.spec.ts)                            |
| [FieldContainer](#fieldcontainer) | `app-field-container` | Interno implementado | [field-container.spec.ts](../src/app/shared/ui/field-container/field-container.spec.ts) |
| [DatePicker](#datepicker)         | `app-date-picker`     | Implementado         | [date-picker.spec.ts](../src/app/shared/ui/date-picker/date-picker.spec.ts)             |

## Uso rápido

Importa desde el barrel de cada componente y añádelo a `imports` del componente consumidor.
Por ejemplo, desde `src/app/app.ts`:

```ts
import { Button } from './shared/ui/button';
import { Input } from './shared/ui/input';
import { Select } from './shared/ui/select';
import { Spinner } from './shared/ui/spinner';
```

No existe un barrel global de `shared/ui`. Los tipos propios, como `InputType`, se exportan desde
el barrel del componente; `ControlSize` se importa directamente de `shared/ui/sizing`.

Para elegir el componente:

- **Button**: ejecutar una acción; no sustituye un enlace de navegación.
- **Spinner**: indicar progreso indeterminado; decorativo salvo que reciba `label`.
- **Input**: editar texto; el consumidor conserva la validación y la visibilidad de los errores.
- **Select**: elegir una opción sin búsqueda editable; el consumidor proporciona el catálogo.
- **FieldContainer**: primitiva interna; los consumidores utilizan Input o Select directamente.

## Convenciones comunes

- **Standalone** (sin NgModules); selector con prefijo `app-`.
- **OnPush implícito (v22)**: los componentes **omiten** `changeDetection`.
- **Contenido**: vía `<ng-content />` cuando el componente es agnóstico. Los elementos vacíos se
  cierran en self-closing (`<ng-content />`, `<app-button />`).
- **Tamaños**: siempre desde `CONTROL[size]` / `SPINNER_SIZE` (`shared/ui/sizing.ts`); nunca mapas
  locales por componente.
- **Colores**: siempre **tokens semánticos** (`bg-primary`, `text-foreground`, `inset-ring-border`…);
  nunca colores crudos (`bg-slate-900`).
- **Accesibilidad**: se conserva el rol nativo; cuando el contenido no es texto (p. ej. solo icono),
  el consumidor aporta el **nombre accesible**.
- **Dependencias**: no se añade ninguna sin justificar por qué no basta una primitiva nativa.

### Ancho de campos y layout

Input, MoneyInput, Select, Autocomplete y DatePicker comparten `FIELD_HOST_CLASSES` desde
`shared/ui/sizing.ts`: `block w-full min-w-0 max-w-full`. Los campos ocupan el ancho del contenedor;
no imponen un ancho base ni un mínimo propio. `size` sigue controlando alto, padding y tipografía,
no el número de columnas. Button y Spinner conservan su dimensionado independiente.

Usar la utilidad compartida `field-grid` para filas de campos de igual ancho:

```html
<div class="field-grid gap-2">
  <app-input label="Name" />
  <app-money-input label="Amount" />
  <app-date-picker label="Start date" />
</div>
```

`field-grid` usa columnas `auto-fit` con mínimo legible centralizado en `--spacing-field-min`
(`12rem`, definido en `src/styles.css`) y máximo `1fr`. Si el contenedor es menor que el mínimo,
la columna puede ocupar su 100% sin forzar desbordamiento. El layout decide cuántas columnas caben;
no es necesario definir un ancho individual. Una cuadrícula con un único campo ocupa toda su fila.
Los labels e iconos muy largos siguen requiriendo revisión visual en su contexto.

Select conserva su input `width` para excepciones explícitas; su default pasa a `100%`. Las otras
instancias siguen la anchura de su contenedor. No usar un mínimo rígido en cada componente para
compensar un layout sin definir: usar `field-grid` o una cuadrícula propia del consumidor.

### Envolturas presentacionales: `Container`

El sufijo `Container` identifica una envoltura reutilizable de presentación, no un componente
smart ni un servicio. Se nombra `<Purpose>Container`, con archivo kebab-case y selector `app-*`:
`FieldContainer` → `field-container/field-container.ts` → `app-field-container`.
La convención general se registra en [AGENTS.md](../AGENTS.md).

**Arquitectura implementada:** Input y Select componen una primitiva interna
`FieldContainer` para compartir con otros controles compatibles:

- Borde outlined, foco sutil y presentación de estados.
- Label flotante e indicador de obligatoriedad.
- Ayuda/error y reserva de espacio para mensajes.
- Coordinación de los identificadores y las asociaciones accesibles entre label, control y mensaje.

Se usa **composición mediante proyección de contenido**, no una clase base de controles.
Input, Select y cada futuro control conservan el elemento nativo, su modelo de valor, foco/eventos
y la integración con Signal Forms. El contenedor recibe los estados de presentación; no deduce
si un valor está vacío ni decide cuándo mostrar errores.

El consumidor usa `app-input` y `app-select` sin envolverlos manualmente. La extracción conserva
la API y el comportamiento público de Input.

## Plantilla de definición

Todo componente nuevo se define con estas secciones, en este orden:

1. **Propósito** — qué problema resuelve y qué **no** es.
2. **API** — tabla de inputs (nombre, tipo, default, descripción) y outputs (si los hay).
3. **Variantes / Tamaños / Estados** — el conjunto cerrado de valores.
4. **Accesibilidad** — rol, nombre accesible, teclado, estados `aria-*`.
5. **Ejemplo** — uso real.

---

## Button

**Propósito**: ejecutar una acción mediante un `<button>` nativo. **No navega**: la
navegación es otro componente.

### API (`app-button`)

| Input       | Tipo                                              | Default     | Descripción                                       |
| ----------- | ------------------------------------------------- | ----------- | ------------------------------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Intención visual.                                 |
| `size`      | `ControlSize` (`xs \| sm \| md \| lg`)            | `'md'`      | Escala compartida del kit.                        |
| `type`      | `'button' \| 'submit' \| 'reset'`                 | `'button'`  | Atributo nativo; usar `submit` en formularios.    |
| `disabled`  | `boolean`                                         | `false`     | Acepta el atributo desnudo (`disabled`).          |
| `loading`   | `boolean`                                         | `false`     | Acepta el atributo desnudo (`loading`).           |
| `fullWidth` | `boolean`                                         | `false`     | Acepta el atributo desnudo (`fullWidth`).         |
| `iconOnly`  | `boolean`                                         | `false`     | Cuadrado de solo icono; requiere `ariaLabel`.     |
| `ariaLabel` | `string \| undefined`                             | `undefined` | Se enlaza al `aria-label` del `<button>` interno. |

**Outputs**: ninguno. Se usa el `(click)` **nativo** del host (burbujea hasta el consumidor).

### Variantes

`primary` (acción principal) · `secondary` (acción sobre fondo claro) · `ghost` (terciaria, sin
fondo) · `danger` (destructiva).

### Estados

- **disabled**: `disabled` nativo + `opacity-50` + `cursor-not-allowed`.
- **loading**: spinner superpuesto, contenido `invisible` (el **ancho no cambia**), `aria-busy="true"`
  y bloqueo de mouse, teclado y `type="submit"`.
- **focus**: `focus-visible:outline-*` con el token `--ring`.

### Accesibilidad

- El `<button>` interno conserva el **rol nativo**; el wrapper es transparente.
- **Solo icono ⇒ `ariaLabel` obligatorio.** Sin nombre accesible, en dev se emite un `console.warn`.

### Ejemplo

```html
<app-button (click)="save()">Guardar</app-button>

<app-button variant="danger" (click)="remove()">Eliminar</app-button>

<app-button variant="ghost" iconOnly ariaLabel="Abrir filtros">
  <tabler-icon icon="filter" />
</app-button>

<app-button [loading]="saving()" (click)="save()">Guardar</app-button>

<app-button type="submit" fullWidth>Crear suscripción</app-button>
```

---

## Spinner

**Propósito**: indicar **progreso indeterminado**. Es **decorativo por defecto**: el `aria-busy` o el
mensaje lo aporta quien lo contiene.

### API (`app-spinner`)

| Input   | Tipo                  | Default     | Descripción                                     |
| ------- | --------------------- | ----------- | ----------------------------------------------- |
| `size`  | `ControlSize`         | `'md'`      | Tamaño del **glifo** (`SPINNER_SIZE`).          |
| `label` | `string \| undefined` | `undefined` | Si se aporta, pasa a ser un `status` accesible. |

### Accesibilidad

- **Sin `label`**: `aria-hidden="true"` → decorativo (no se anuncia).
- **Con `label`**: `role="status"` + `aria-label`.

### Color

Hereda **`currentColor`**, de modo que el mismo spinner sirve sobre cualquier fondo sin variantes.

### Ejemplo

```html
<!-- decorativo: el contenedor comunica el estado -->
<app-spinner />

<!-- anunciado: aporta su propio mensaje -->
<app-spinner size="sm" label="Cargando suscripciones" />
```

---

## Input

**Estado**: componente implementado con pruebas de contrato en `input.spec.ts`. El foco sutil fue
confirmado manualmente por el usuario; la comprobación visual automatizada de la animación y el
layout sigue pendiente.

**Propósito**: entrada de texto reutilizable con un wrapper que contiene su propio input nativo,
label flotante y área de ayuda/error. Es una primitiva de presentación: no valida, normaliza ni
conoce reglas de negocio o schemas Zod.

**Fuera de esta versión**: controles de dinero y fechas, iconos decorativos y acciones para mostrar
la contraseña. La limpieza del valor está disponible como opción explícita.

### API (`app-input`)

| Input / modelo        | Tipo                                          | Default     | Descripción                                                                             |
| --------------------- | --------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `label`               | `string`                                      | Obligatorio | Label visible en todos los usos, incluida la búsqueda.                                  |
| `value`               | `string` (`model`)                            | `''`        | Valor sin normalización propia; `email` conserva la sanitización nativa descrita abajo. |
| `type`                | `'text' \| 'email' \| 'password' \| 'search'` | `'text'`    | Tipo del input nativo.                                                                  |
| `clearable`           | `boolean`                                     | `false`     | Muestra una acción para limpiar un valor no vacío; oculta con `disabled` o `readonly`.  |
| `size`                | `ControlSize` (`xs \| sm \| md \| lg`)        | `'md'`      | Dimensiones desde `CONTROL[size]`, sin mapas locales.                                   |
| `placeholder`         | `string \| undefined`                         | `undefined` | Ejemplo opcional, visible solo cuando la label esté elevada.                            |
| `helperText`          | `string \| undefined`                         | `undefined` | Ayuda debajo del campo cuando no hay un error visible.                                  |
| `error`               | `string \| undefined`                         | `undefined` | Mensaje de error que el consumidor decide mostrar; reemplaza la ayuda.                  |
| `reserveMessageSpace` | `boolean`                                     | `true`      | Reserva una línea para ayuda/error, incluso sin mensaje.                                |
| `disabled`            | `boolean`                                     | `false`     | Campo deshabilitado, no interactivo y visualmente atenuado.                             |
| `readonly`            | `boolean`                                     | `false`     | Impide editar; mantiene legibilidad, foco y copia del valor.                            |
| `required`            | `boolean`                                     | `false`     | Indica obligatoriedad con asterisco y estado accesible; no implica error visible.       |

**Salidas e integración**:

- `valueChange`: actualización del modelo para el uso independiente con `[(value)]`.
- `touch`: se emite al perder el foco del input nativo, no al recibirlo, para la integración con
  Signal Forms.
- `focus(options?: FocusOptions)`: dirige el foco al input nativo, no al wrapper.

`disabled`, `readonly`, `required` y `reserveMessageSpace` aceptan atributos booleanos desnudos.
Para desactivarlos, usa un binding booleano, por ejemplo `[reserveMessageSpace]="false"`.

Un `error` vacío (`''`) o ausente no activa el estado visual de error. Si existe `helperText`,
vuelve a mostrarse al retirar el mensaje de error. Los identificadores del input y del mensaje
se generan internamente para mantener separadas las asociaciones de cada instancia.

**Dos modos de uso, excluyentes por instancia**:

- **Independiente**: `[(value)]`, por ejemplo para una búsqueda.
- **Signal Forms**: `[formField]`, mediante el contrato `FormValueControl<string>` y su valor
  `model()`. El consumidor importa `FormField`; no se necesita `ControlValueAccessor`.

En ambos modos, el consumidor decide las reglas de validación y cuándo suministrar `error`.
El estado inválido del formulario no debe activar automáticamente la presentación del error.
La integración del valor y los estados del control no cambia esa responsabilidad.

### Variantes / Tamaños / Estados

- **Presentación**: outlined con label flotante; sin variante sin label.
- **Tamaños**: `xs`, `sm`, `md`, `lg`, usando la escala y los tokens semánticos existentes del kit.
- **Valor**: el componente no recorta espacios ni cambia mayúsculas/minúsculas; cualquier
  normalización adicional corresponde al consumidor. Los espacios y el uso de mayúsculas se
  conservan en texto y contraseñas.
- **Excepción nativa de `email`**: el navegador elimina espacios iniciales y finales antes de que
  el componente lea el valor introducido. Se mantiene ese comportamiento: al escribir
  `"  MiXeD@example.com  "`, se emite `"MiXeD@example.com"`, sin cambiar mayúsculas/minúsculas.

| Situación                     | Label                  | Placeholder                                                    |
| ----------------------------- | ---------------------- | -------------------------------------------------------------- |
| Vacío, sin foco               | Dentro del campo       | Oculto                                                         |
| Vacío, con foco               | Elevada sobre el borde | Visible, si existe                                             |
| Con contenido, con o sin foco | Elevada sobre el borde | Habilitado; el input nativo no lo muestra mientras tenga valor |

Al perder el foco, la label solo vuelve al interior si el valor está vacío. Los valores iniciales
o actualizados desde el consumidor deben respetar el mismo comportamiento.

- **Error visible**: el mensaje `error` y la presentación de error sustituyen la ayuda; no se
  calculan reglas ni políticas de visibilidad dentro del Input.
- **Área de mensajes**: reserva una línea por defecto. Puede desactivarse en usos compactos;
  los mensajes largos pueden ocupar varias líneas, sin recortarse para mantener una altura fija.
- **Solo lectura / deshabilitado**: son estados distintos, no variantes de validación.
- **Obligatorio**: el asterisco indica obligatoriedad, no que el campo ya tenga un error.

### Accesibilidad

- Se conserva la semántica y el teclado del input nativo según su `type`.
- La label visible se asocia al input nativo mediante `for`/`id`; el placeholder no sustituye el
  nombre accesible. Pulsar la label dirige el foco al campo cuando no está deshabilitado.
- Ayuda o error se asocian mediante `aria-describedby`, únicamente cuando existe un mensaje.
- El error visible se comunica mediante `aria-invalid`; la obligatoriedad se comunica al input
  nativo y a tecnologías de asistencia. El asterisco no es el único indicador accesible.
- El foco cambia sutilmente el color del borde, sin añadir un contorno exterior ni aumentar su
  grosor. Con error visible, el borde conserva el color de error también al enfocar. Se respetan
  los estados nativos `disabled` y `readonly`.

### Ejemplo

#### Búsqueda independiente

El consumidor declara un valor escribible, por ejemplo `readonly search = signal('')`, importando
`signal` de `@angular/core`, y añade `Input` a sus `imports`.

```html
<!-- Independent binding; compact message layout -->
<app-input
  label="Search subscriptions"
  type="search"
  [(value)]="search"
  [reserveMessageSpace]="false"
/>
```

#### Signal Forms y política de errores

Ejemplo completo de consumidor situado en `src/app/`. Aquí se muestra el error después de perder
el foco; es una política del consumidor, no un comportamiento impuesto por el Input.

```ts
import { Component, computed, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Input } from './shared/ui/input';

@Component({
  selector: 'app-subscription-form-example',
  imports: [Input, FormField],
  template: `
    <app-input
      label="Subscription name"
      [formField]="subscriptionForm.name"
      helperText="Use the service name."
      [error]="visibleNameError()"
    />
  `,
})
export class SubscriptionFormExample {
  readonly data = signal({ name: '' });
  readonly subscriptionForm = form(this.data, (path) => {
    required(path.name);
  });
  readonly visibleNameError = computed(() => {
    const field = this.subscriptionForm.name();
    return field.touched() && field.invalid() ? 'Enter a subscription name.' : undefined;
  });
}
```

El ejemplo usa únicamente la regla `required` para mostrar la integración. Las reglas de dominio
y el schema Zod del formulario real siguen perteneciendo al consumidor.

#### Estados nativos

```html
<app-input label="Service name" required placeholder="Netflix" />
<app-input label="Reference" value="SUB-001" readonly />
<app-input label="Unavailable field" disabled />
<app-input label="Contact email" type="email" />
```

### Verificación

Las pruebas de contrato cubren la asociación de la label y sus transiciones, la visibilidad
del placeholder, los valores iniciales y actualizados, la conservación del texto y la excepción
nativa de espacios en `email`, ambos modos de enlace, los estados `disabled`/`readonly`/`required`,
la sustitución de ayuda por error, la reserva de espacio y las asociaciones accesibles.
La animación y el layout requieren además comprobación
en navegador; las pruebas de DOM no verifican la apariencia ni la geometría final.

---

## Escala de tamaños

Fuente única de verdad del kit en `shared/ui/sizing.ts`:

- `ControlSize` = `'xs' | 'sm' | 'md' | 'lg'` (escala compartida).
- `CONTROL[size]` = dimensiones de la **caja** de un control (`height`, `square`, `paddingX`, `text`,
  `gap`, `icon`).
- `SPINNER_SIZE[size]` = tamaño del **glifo** del spinner (semántica distinta de la caja).

Reglas completas en `AGENTS.md` → _UI Kit: escala de tamaños_.

---

## Roadmap de theming

| Fase | Alcance     | Cómo                                                                                                       |
| ---- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | Tema claro  | **Actual.** Variables CSS en `:root` + `@theme inline` en `src/styles.css`.                                |
| 2    | Tema oscuro | `[data-theme='dark']` + `@custom-variant dark`; `ThemeStore` en `core/`, persistencia con Zod y anti-FOUC. |
| 3    | Paletas     | `[data-palette='x']` sobreescribiendo solo `--primary*` y `--ring`.                                        |

**Sin Angular Material/CDK.** Los componentes del kit consumen tokens semánticos, así que cambiar de
tema nunca requiere tocar componentes.

## FieldContainer

**Propósito**: primitiva interna presentacional para componer controles. No implementa un valor,
validación, eventos de formulario ni acceso a datos. Recibe el estado de flotación del control.

### API (`app-field-container`)

| Input                  | Tipo                  | Default     | Descripción                                                            |
| ---------------------- | --------------------- | ----------- | ---------------------------------------------------------------------- |
| `controlId`            | `string`              | requerido   | ID del elemento nativo proyectado; destino del label.                  |
| `label`                | `string`              | requerido   | Nombre visible.                                                        |
| `size`                 | `ControlSize`         | `'md'`      | Tipografía y padding del label desde CONTROL.                          |
| `floating`             | `boolean`             | `false`     | Estado visual explícito, calculado por el control.                     |
| `disabled`, `required` | `boolean`             | `false`     | Atenuación y marcador visual; el control aplica los atributos nativos. |
| `helperText`, `error`  | `string \| undefined` | `undefined` | Error visible reemplaza ayuda; no decide cuándo validarlo.             |
| `reserveMessageSpace`  | `boolean`             | `true`      | Reserva una línea, sin describir una región vacía.                     |

**Estado / accesibilidad**: borde outlined y foco sutil mediante `focus-within`; error mantiene
su borde. Expone `describedBy()` como ID de mensaje o null; el control lo aplica a su elemento
nativo. El mensaje usa `${controlId}-message`. Proyecta el control directamente en la caja;
label asociado mediante `for`. Sin outputs ni clase base.

### Ejemplo interno

```html
<app-field-container #field controlId="name" label="Name" [floating]="true" helperText="Full name">
  <input id="name" [attr.aria-describedby]="field.describedBy()" />
</app-field-container>
```

## Select

**Propósito**: elegir una opción de un catálogo suministrado por el consumidor mediante un
panel propio con Angular Aria y CDK Overlay. Sin Angular Material, búsqueda editable, HTTP, múltiples selecciones ni virtualización.

### API (`app-select`)

```ts
import type { SelectOption, SelectValue } from './shared/ui/option';
```

`SelectOption` is defined in `shared/ui/option.ts` and re-exported by the Select barrel for
compatibility. Its default type allows `value: null` for an explicit no-selection option.

| Input                  | Tipo                          | Default     | Descripción                                                 |
| ---------------------- | ----------------------------- | ----------- | ----------------------------------------------------------- |
| `label`                | `string`                      | requerido   | Label visible flotante asociado.                            |
| `options`              | `readonly SelectOption[]`     | `[]`        | Valores únicos; consumidor prepara los registros.           |
| `value`                | `SelectValue \| null` (model) | `null`      | Valor primitivo; conserva string/number sin normalizar.     |
| `width`                | `string`                      | `'100%'`    | Ancho base CSS; admite ajuste por instancia y máximo 100%.  |
| `size`                 | `ControlSize`                 | `'md'`      | Escala compartida xs/sm/md/lg.                              |
| `helperText`, `error`  | `string \| undefined`         | `undefined` | Visibilidad controlada externamente; error reemplaza ayuda. |
| `reserveMessageSpace`  | `boolean`                     | `true`      | Reserva una línea de mensaje.                               |
| `disabled`, `required` | `boolean`                     | `false`     | Estado accesible y visual; validación en el consumidor.     |

Outputs: `valueChange` del model y `touch` al perder foco. Método `focus(options?: FocusOptions)`.
Usar `[(value)]` o `[formField]`, nunca ambos en la misma instancia. No se soporta `readonly`,
incluida la regla readonly de Signal Forms: usar `disabled` cuando deba impedirse la interacción.

### Variantes / tamaños / estados

- Una selección; null es ausencia. `0` y `''` son valores válidos y no equivalen a null.
- No elige automáticamente la primera opción ni genera una opción vacía visible. El consumidor
  puede incluir `{ value: null, label: 'No selection' }` para permitir limpiar incluso con required;
  el consumidor decide cuándo mostrar el error. Los tokens internos de Aria no se exponen como valores de dominio.
- Si desaparece la opción seleccionada, conserva el model y deja vacío el texto mostrado.
  Si reaparece, recupera su etiqueta sin emitir cambios de valor.
- Sin opciones, el panel queda vacío y no muestra mensajes predeterminados; no borra un valor existente.
- Label elevado cuando hay foco, panel abierto o valor distinto de null. El label de una opción
  null del consumidor se oculta visualmente cuando reposa; no se crea opción vacía automática.
  Una capa de dimensionado invisible conserva el ancho intrínseco del catálogo al cambiar la selección.
- El panel usa superficie, borde, radius y colores semánticos. Alineación al ancho del trigger,
  posición inferior con alternativa superior, separación de 4 px y scroll vertical acotado.
- El control ocupa el 100% del contenedor por defecto; usa `width` para ajustarlo
  por instancia, por ejemplo `[width]="'240px'"`.
- El cursor es `pointer` en todo el control, incluida la label; cuando está deshabilitado cambia a
  `not-allowed`.
- El hover del puntero y la opción activa por teclado usan el mismo fondo de resaltado.
- Angular Aria gestiona navegación y semántica; selección explícita (navegar no cambia el model).
  La lista interna usa tokens y no puede borrar un valor externo cuando desaparecen opciones.
- Error, ayuda, espacio, borde y label se componen con FieldContainer. Opciones disabled conservan
  su estado nativo. El consumidor debe aportar valores únicos dentro del catálogo.

### Accesibilidad

Trigger `<button type="button">` con rol combobox; popup con listbox y opciones accesibles.
Nombre por label visible, `aria-required`, `aria-invalid`, `aria-describedby`, `aria-expanded`,
`aria-controls` y active-descendant. Flechas navegan omitiendo opciones disabled; Home/End van a
extremos y typeahead permite saltar por texto sin búsqueda editable. Enter/Space confirman;
Escape cancela, Tab cierra sin bloquear salida y clic exterior cierra. Reabrir conserva la selección.
Disabled impide abrir. El foco permanece en el trigger durante navegación; touch solo al abandonar
el control compuesto, no al elegir una opción. La regla required se valida mediante Signal Forms
(o por el consumidor standalone), no mediante validación HTML de un select nativo.
Un error no se muestra automáticamente; los mensajes vacíos no se describen. IDs distintos por
instancia. Verificar posicionamiento, viewport y lectores de pantalla en navegador real.

### Ejemplo

```ts
import { Select, type SelectOption, type SelectValue } from './shared/ui/select';

readonly cycle = signal<SelectValue | null>(null);
readonly cycles: readonly SelectOption[] = [
  { value: null, label: 'No selection' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];
```

```html
<app-select label="Billing cycle" [options]="cycles" [(value)]="cycle" required />
<!-- Signal Forms: <app-select label="Billing cycle" [options]="cycles" [formField]="fields.cycle" /> -->
```

## Autocomplete

**Purpose**: search and select one existing option from a consumer-provided search function. Typed
text is a query only; it is never a selected value. The component owns the combobox interaction,
debounce, request lifecycle, result accumulation, and incremental pagination. The consumer owns the
backend request and maps its domain records to shared options.

### API (`app-autocomplete`)

```ts
import type { SelectOption, SelectValue } from './shared/ui/option';
import type { Observable } from 'rxjs';

// Restrict Autocomplete options to concrete values; null means no selection.
type AutocompleteOption = SelectOption<SelectValue>;

interface AutocompleteRequest {
  query: string;
  offset: number;
  limit: number;
}

type AutocompleteFn = (request: AutocompleteRequest) => Observable<readonly AutocompleteOption[]>;
```

| Input / model / output | Type                               | Default     | Description                                                                                                       |
| ---------------------- | ---------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `label`                | `string`                           | required    | Visible floating label and accessible name.                                                                       |
| `autocompleteFn`       | `AutocompleteFn`                   | required    | Loads one page for the query, offset, and limit provided by the component.                                        |
| `value`                | `AutocompleteOption \| null` model | `null`      | The selected option object, not only its primitive ID.                                                            |
| `clearable`            | `boolean`                          | `false`     | Shows a clear action for an existing selection; clearing cancels pending work and does not query an empty string. |
| `limit`                | `number`                           | `20`        | Page size sent to `autocompleteFn`; values below one are normalized to one.                                       |
| `size`                 | `ControlSize`                      | `'md'`      | Shared control scale.                                                                                             |
| `placeholder`          | `string`                           | `undefined` | Placeholder shown while the label is floating.                                                                    |
| `helperText`, `error`  | `string \| undefined`              | `undefined` | Field guidance/validation; a field error replaces helper text.                                                    |
| `reserveMessageSpace`  | `boolean`                          | `true`      | Reserves one line for helper or validation text.                                                                  |
| `disabled`, `required` | `boolean`                          | `false`     | Interaction and required state; validation remains with the consumer.                                             |
| `requestError`         | output `unknown`                   | —           | Emits request failures; the consumer owns error presentation and recovery.                                        |

`touch` emits when focus leaves the composed control. Search uses a fixed 250 ms debounce. A query
change clears the current selection and results, cancels the previous request, and calls
`autocompleteFn` with `offset: 0`. The component appends each returned page and requests the next
offset automatically as the scroll panel nears its end. The panel remains closed until the initial
request finishes. The control does not render loading or request-error messages; it emits failures
through `requestError` so the consumer can decide how to present and recover from them. Empty
results leave an empty list without preset guidance or empty-state messages. An input placeholder
may still be supplied explicitly by the consumer.

Pagination completion is inferred from page length: a page shorter than `limit` ends the result set;
a page exactly equal to `limit` means another page may exist. Therefore, if the final page is exactly
full, the next request may return an empty page. The callback should return only options; it should
not append pages itself.

`Autocomplete` implements `FormValueControl<AutocompleteOption | null>` and works with Signal Forms.
Use `[formField]` or `[(value)]`, never both. The selected value is the original option object, so
the consumer can keep it or extract its ID at the feature boundary. A preselected object remains
displayable even if it is not in the current results. Option identity for rendering is its primitive
`value`; only an existing, enabled result can be selected. Editing the query clears the selected
value; free text is never emitted as a value.

### Accessibility and states

Use Angular Aria's editable combobox/listbox pattern: the input retains focus while the popup listbox
is navigated; Arrow keys move through enabled options, Enter commits the active option, Escape closes
the popup, and Tab leaves it without trapping focus. The visible label names the combobox; expose
expanded/controls, active descendant, required, invalid, and described-by state. Announce loading,
no-results, and loading errors without replacing field-validation feedback. Disabled options cannot
be selected. Verify screen-reader and real-browser behavior as part of implementation.

### Example

```ts
import type { SelectOption, SelectValue } from './shared/ui/option';
import type { AutocompleteFn } from './shared/ui/autocomplete';

type AutocompleteOption = SelectOption<SelectValue>;

interface Company {
  name: string;
  id: string;
  address: string;
}

readonly company = signal<AutocompleteOption | null>(null);
readonly searchCompanies: AutocompleteFn = ({ query, offset, limit }) => {
  const params = new HttpParams()
    .set('q', query)
    .set('_start', offset)
    .set('_limit', limit);

  return this.http.get<Company[]>('/api/companies', { params }).pipe(
    map((companies) =>
      companies.map(({ name, id }) => ({ label: name, value: id })),
    ),
  );
};
```

```html
<app-autocomplete
  label="Company"
  [autocompleteFn]="searchCompanies"
  [(value)]="company"
  [limit]="25"
/>
```

For Signal Forms, bind `[formField]="fields.company"` instead of `[(value)]`. The feature owns
the HTTP client and its Company DTO; the shared component only sees query/page metadata and options.

## MoneyInput

**Propósito**: editar importes con punto decimal y exponer centavos enteros, sin reglas de negocio
ni selección de moneda. Reutiliza FieldContainer; no modifica el contrato de Input.

### API (`app-money-input`)

| Input / model / output               | Type                   | Default     | Description                                         |
| ------------------------------------ | ---------------------- | ----------- | --------------------------------------------------- |
| `label`                              | `string`               | required    | Accessible floating label.                          |
| `value`                              | `number \| null` model | `null`      | Safe integer cents; null represents an empty field. |
| `size`                               | `ControlSize`          | `'md'`      | Shared control dimensions.                          |
| `placeholder`, `helperText`, `error` | `string \| undefined`  | `undefined` | Consumer-owned guidance and validation.             |
| `disabled`, `readonly`, `required`   | `boolean`              | `false`     | Native interaction and presentation states.         |
| `reserveMessageSpace`                | `boolean`              | `true`      | Reserve message height.                             |
| `touch`                              | output `void`          | —           | Emitted on blur.                                    |

### Variantes / Tamaños / Estados

Admite punto decimal, hasta dos decimales y signo negativo opcional; la feature decide si permite
importes negativos. Muestra comas de agrupación mientras se escribe y conserva la posición del cursor y la selección.
Acepta pegado con agrupaciones de tres dígitos (`1,234.56`); rechaza comas decimales y agrupaciones
mal formadas. No admite exponentes ni valores fuera del rango de enteros seguros. Una edición no admitida conserva el texto y valor anteriores. Los estados intermedios
`.` y `-` se conservan mientras se escribe y representan `null`. Al perder el foco se muestra el
valor con dos decimales, o vacío si es null. Los valores externos deben ser centavos enteros seguros.

### Accesibilidad

Input nativo de texto con `inputmode="decimal"`, label asociado y mensajes mediante FieldContainer.
Conserva required, invalid, disabled y readonly. Implementa `FormValueControl<number | null>`.

### Ejemplo

```html
<app-money-input label="Amount" [(value)]="amountCents" />
```

Usar `[formField]` o `[(value)]`, nunca ambos. `12.50` produce `1250`; vacío produce `null`.

MoneyInput: `1,234,567.89` es texto de presentación; el modelo emite `123456789` centavos.

## DatePicker

**Propósito**: seleccionar una fecha de calendario en un panel propio de estilo compacto.
No hay entrada de texto editable. Sustituye al DateInput nativo provisional.

### API (`app-date-picker`)

| Input / model / output             | Tipo                          | Default                 | Descripción                                                                   |
| ---------------------------------- | ----------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `label`                            | `string`                      | Obligatorio             | Label visible y nombre del calendario.                                        |
| `value`                            | `string` model                | `''`                    | Fecha ISO `YYYY-MM-DD`; vacío como cadena vacía.                              |
| `displayFormat`                    | `DateDisplayFormat`           | Global o `'dd/MM/yyyy'` | `'dd/MM/yyyy'`, `'MM/dd/yyyy'` o `'yyyy-MM-dd'`. Solo afecta la presentación. |
| `locale`                           | `string`                      | `LOCALE_ID`             | Configuración regional para nombres de días y meses.                          |
| `min`, `max`                       | `string \| undefined`         | `undefined`             | Límites ISO inclusivos de selección.                                          |
| `size`                             | `ControlSize`                 | `'md'`                  | Dimensiones compartidas del disparador.                                       |
| `helperText`, `error`              | `string \| undefined`         | `undefined`             | Mensajes controlados por el consumidor.                                       |
| `disabled`, `readonly`, `required` | `boolean`                     | `false`                 | Estados del control. Readonly conserva el foco, pero impide abrir.            |
| `reserveMessageSpace`              | `boolean`                     | `true`                  | Reserva de altura para mensajes.                                              |
| `messages`                         | `Partial<DatePickerMessages>` | `{}`                    | Overrides de traducciones por instancia.                                      |
| `touch`                            | output `void`                 | —                       | Al salir del control o cerrar el panel.                                       |

### Configuración global y traducciones

**Configurar una vez en `app.config.ts`; las instancias heredan los valores.** La configuración
actual de SubZero usa `es-MX` y `dd/MM/yyyy`, sin añadir atributos regionales en cada DatePicker.

#### Configuración de la aplicación

```ts
// src/app/app.config.ts
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideDatePickerDefaults } from './shared/ui/date-picker';

registerLocaleData(localeEsMx);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'es-MX' },
    provideDatePickerDefaults({ displayFormat: 'dd/MM/yyyy' }),
  ],
};
```

`registerLocaleData` registra los datos para los pipes regionales de Angular. DatePicker obtiene
el locale mediante inyección y usa `Intl` para nombres de meses, días y fechas accesibles.
`LOCALE_ID` no traduce por sí solo textos de la interfaz.

Con la configuración anterior, el consumidor solo aporta su label y modelo:

```ts
readonly paymentDate = signal('2026-10-16');
```

```html
<app-date-picker label="Payment date" [(value)]="paymentDate" />
```

El campo muestra `16/10/2026`; el modelo conserva `2026-10-16`. Las flechas usan «Mes anterior» y
«Mes siguiente» y las instrucciones accesibles se muestran en español. `label` sigue siendo el
texto del consumidor: el componente no traduce «Payment date» automáticamente.

#### Excepciones por instancia

Una instancia puede usar otro locale o formato sin cambiar las demás:

```html
<app-date-picker
  label="Payment date"
  [(value)]="paymentDate"
  locale="en-US"
  displayFormat="MM/dd/yyyy"
/>
```

Muestra `10/16/2026` y usa textos incorporados en inglés; el modelo sigue siendo `2026-10-16`.
Formatos admitidos: `dd/MM/yyyy`, `MM/dd/yyyy` y `yyyy-MM-dd`; no se admiten patrones arbitrarios.

#### Otros idiomas y textos personalizados

Los textos incorporados cubren español (`es`, `es-MX`, `es-ES`…) e inglés. Otros locales siguen
usando `Intl` para fechas, pero los textos de navegación e instrucciones tienen fallback inglés.
Para traducirlos, aportar `messages` sin modificar el componente:

```ts
import { LOCALE_ID } from '@angular/core';
import { provideDatePickerDefaults, type DatePickerMessages } from './shared/ui/date-picker';

const frenchMessages: DatePickerMessages = {
  previousMonth: 'Mois précédent',
  nextMonth: 'Mois suivant',
  keyboardHelp:
    'Utilisez les flèches pour parcourir les dates et Entrée pour sélectionner. Échap ferme le calendrier.',
};

// Entries to add to appConfig.providers, preserving the other application providers.
const dateProviders = [
  { provide: LOCALE_ID, useValue: 'fr-FR' },
  provideDatePickerDefaults({ displayFormat: 'dd/MM/yyyy', messages: frenchMessages }),
];
```

Si la aplicación también usa pipes de Angular en francés, registrar sus datos regionales como en
el ejemplo de español. Para una excepción puntual, `[messages]="customMessages"` admite
`Partial<DatePickerMessages>`. Las claves omitidas conservan el texto del nivel anterior.

| Configuración | Precedencia, de menor a mayor                                            |
| ------------- | ------------------------------------------------------------------------ |
| Locale        | `LOCALE_ID` → input `locale`                                             |
| Formato       | `dd/MM/yyyy` → defaults globales → input `displayFormat`                 |
| Textos        | Diccionario del locale efectivo → `messages` globales → input `messages` |

Los textos globales explícitos también se aplican a instancias con otro locale. Si una excepción
necesita otros textos, sobrescribir sus claves mediante el input `messages`.

#### Alcance y archivos de referencia

- `label`, `helperText` y `error` pertenecen al consumidor; no se traducen automáticamente.
- El modelo y los límites `min`/`max` siempre son ISO; vacío se representa con `''`.
- El locale no altera el inicio de semana: el calendario mantiene domingo a sábado.
- La configuración global fija defaults iniciales; no hay selector global reactivo de idioma ni
  persistencia de preferencias. Los inputs locales siguen pudiendo actualizarse mediante bindings.
- Este mecanismo configura DatePicker, no traduce automáticamente el resto del UI kit.

| Archivo                                                                         | Responsabilidad                                       |
| ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [app.config.ts](../src/app/app.config.ts)                                       | Locale y defaults de la aplicación.                   |
| [date-picker.config.ts](../src/app/shared/ui/date-picker/date-picker.config.ts) | Token, provider, tipos y diccionarios.                |
| [date-picker.ts](../src/app/shared/ui/date-picker/date-picker.ts)               | Consumo de defaults y resolución de textos.           |
| [app.config.spec.ts](../src/app/app.config.spec.ts)                             | Prueba de la configuración real de la aplicación.     |
| [date-picker.spec.ts](../src/app/shared/ui/date-picker/date-picker.spec.ts)     | Herencia, excepciones, traducciones y comportamiento. |

Las pruebas automatizadas verifican herencia global, overrides y fallback de textos. La validación
visual y con lector de pantalla sigue pendiente; no está cubierta por las pruebas de jsdom.

### Variantes / Tamaños / Estados

El disparador llena su contenedor con la política compartida de ancho de campos. El icono conserva
su ancho y el label no se divide en líneas. Usar `field-grid` o un layout propio para proporcionar
columnas legibles y adaptables, sin anchos específicos del DatePicker.

Los días y las flechas de navegación habilitados usan cursor pointer y hover con tokens semánticos
existentes (`surface-muted`; `primary-hover` para el día seleccionado). Los controles deshabilitados
no reaccionan al hover y muestran cursor de acción no disponible.

Selección de una fecha, sin rangos ni presets. El botón muestra la fecha con el formato configurado;
el modelo y los límites siguen siendo ISO, sin horas ni zonas horarias. Los valores externos deben
ser fechas válidas de cuatro dígitos de año (`0001`–`9999`). El calendario usa semanas de domingo
a sábado. Una selección externa fuera de límites no se corrige silenciosamente: el consumidor
conserva su validación; el panel enfoca la fecha permitida más cercana. Un rango imposible no abre.

### Accesibilidad

Botón con nombre y fecha seleccionada, `aria-haspopup="dialog"` y estado expandido. El panel modal
usa CDK Overlay y gestión de foco de CDK; Escape/clic exterior cierran sin cambiar el valor. El foco
vuelve al botón al cerrar. Un solo día está en la secuencia de Tab; las flechas navegan por días y
semanas, Home/End por los extremos de semana, PageUp/PageDown por meses y Shift por años. Enter o
Espacio seleccionan. La navegación cambia el foco, nunca el valor. Los días fuera de límites están
deshabilitados. No editable no significa inaccesible por teclado. Verificar en navegador y lector
de pantalla antes de considerar completada la validación de accesibilidad.

### Ejemplo

```html
<app-date-picker
  label="Payment date"
  [(value)]="paymentDate"
  displayFormat="dd/MM/yyyy"
  min="2026-01-01"
/>
```

Implementa `FormValueControl<string>`; usar `[formField]` o `[(value)]`, no ambos.
`focus(options?)` enfoca el disparador. Importar DatePicker y DateDisplayFormat desde su barrel.
